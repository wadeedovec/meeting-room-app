import express from "express";
import { verifyApiKey } from "../middlewares/authMiddleware.js";
import { getReservations, unListAreservation, getReservationById, getReservationsByRoomId, createReservation, updateReservation, deleteReservation, deleteAllReservations } from "../controllers/reservation.controller.js";
const router = express.Router();
router.get("/", verifyApiKey, getReservations);
router.get("/room/:roomId", verifyApiKey, getReservationsByRoomId);
router.get("/:id", verifyApiKey, getReservationById);
router.post("/", verifyApiKey, createReservation);
router.put("/:id", verifyApiKey, updateReservation);
router.patch("/:id", verifyApiKey, unListAreservation);
router.delete("/:id", verifyApiKey, deleteReservation);
router.delete("/", verifyApiKey, deleteAllReservations);

export default router;  