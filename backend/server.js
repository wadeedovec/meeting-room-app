import express from 'express';
import { connectDB } from './config/db.js';
import dotenv from 'dotenv';
import roomRoutes from "./routes/room.route.js";
import userRoutes from "./routes/users.route.js";
import reservationRoutes from "./routes/reservation.route.js";
import cors from 'cors'
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use(cors());
app.get('/api/', async (req, res) => {
    const dbConnected = await connectDB();  // Check if the DB is connected
    if (dbConnected) {
        res.status(200).send('API is running... Database connected!');
    } else {
        res.status(500).send('API is running... but Database connection failed!');
    }
});
app.use("/api/rooms", roomRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reservations", reservationRoutes);

app.listen(PORT, () => {
    connectDB();
    console.log("Server is running");

});