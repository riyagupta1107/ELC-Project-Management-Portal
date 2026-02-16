// backend/src/app.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/users", userRoutes);
app.use("/projects", projectRoutes);

const PORT = process.env.PORT;
// app.listen(PORT, ()=> {
//     console.log(`Server is running on port ${PORT}`);
// })

export default app;