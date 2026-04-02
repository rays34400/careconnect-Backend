import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {

    try {
        const conn = await mongoose.connect(process.env.MONGO_URI as string);
        console.log(`MongoDB connected: ${conn.connection.host}`);
        
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1); // stop l'app si la DB ne répond pas
    }
};

export default connectDB;