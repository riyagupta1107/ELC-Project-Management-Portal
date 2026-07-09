// backend/src/app.js

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import noticeRoutes from "./routes/noticeRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import dotenv from 'dotenv';
dotenv.config();


connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
    res.status(200).send("ELC Backend is running normally");
  });
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);

const PORT = process.env.PORT;

export default app;