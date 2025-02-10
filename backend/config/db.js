import mongoose from 'mongoose';

export const connectDB = async () => {
    const MONGO_URI = "mongodb+srv://wadeeaburayya:kI1CmeH3rbGjSNvA@meeting-room-app.k0vm8.mongodb.net/meeting-room?retryWrites=true&w=majority&appName=meeting-room-app";

    try {
        const conn = await mongoose.connect(MONGO_URI);
        console.log(MONGO_URI);  // Log to check if the URI is correct

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};