import express from 'express';
import { connectDB } from './config/db.js';
import dotenv from 'dotenv';
import roomRoutes from "./routes/room.route.js";
import userRoutes from "./routes/users.route.js";
import reservationRoutes from "./routes/reservation.route.js";
import cors from 'cors';
import fetch from 'node-fetch'; // Required for making API calls

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

app.get('/api/', async (req, res) => {
    const dbConnected = await connectDB();
    if (dbConnected) {
        res.status(200).send('API is running... Database connected!');
    } else {
        res.status(500).send('API is running... but Database connection failed!');
    }
});

// ✅ Add Microsoft OAuth Token Route
app.post('/api/getAccessToken', async (req, res) => {
    const url = `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`;
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("client_id", process.env.CLIENT_ID);
    params.append("client_secret", process.env.CLIENT_SECRET);
    params.append("scope", "https://graph.microsoft.com/.default");

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params.toString(),
        });

        const data = await response.json();

        if (response.ok) {
            res.json({ access_token: data.access_token });
        } else {
            res.status(response.status).json({ error: data.error_description || "Failed to get access token" });
        }
    } catch (error) {
        console.error("Error fetching token:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.use("/api/rooms", roomRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reservations", reservationRoutes);

app.listen(PORT, () => {
    connectDB();
    console.log(`Server is running on port ${PORT}`);
});
