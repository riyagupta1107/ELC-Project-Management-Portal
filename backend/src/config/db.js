import mongoose from "mongoose";

const connectDB = async() => {

    if (process.env.NODE_ENV === 'test') {
        return; 
    }
    console.log("MONGO_URI =", process.env.MONGO_URI);
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log("MongoDB connected");
    } catch(error) {
        console.log("Connections failed", error);
        process.exit(1);
    }
};

export default connectDB;