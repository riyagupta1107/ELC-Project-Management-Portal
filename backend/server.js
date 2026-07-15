import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Message from "./src/models/Message.js";
import User from "./src/models/User.js";
import app from "./src/app.js";

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN?.split(",") || "http://localhost:5173" }
});

app.set('socketio', io);

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) throw new Error("Missing token");
    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  socket.join(`user:${socket.user.id}`);

  socket.on("joinProjectRoom", (projectId) => {
    // Project membership is enforced by the HTTP history endpoint. A future chat
    // screen should use the same authorization rule before exposing this action.
    socket.join(`project:${projectId}`);
  });

  socket.on("sendMessage", async ({ projectId, text }) => {
    if (!projectId || !text?.trim()) return;
    try {
      const user = await User.findById(socket.user.id).select("firstName lastName");
      if (!user) return;
      const message = await Message.create({
        projectId,
        senderUid: user._id.toString(),
        senderName: `${user.firstName} ${user.lastName}`,
        text: text.trim(),
      });
      io.to(`project:${projectId}`).emit("receiveMessage", message);
    } catch (error) {
      socket.emit("messageError", { message: "Unable to send message" });
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
