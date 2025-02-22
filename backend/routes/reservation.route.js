import express from "express";
import { verifyApiKey } from "../middlewares/authMiddleware.js";
import { getReservations, unListAreservation, getReservationById, getReservationsByRoomId, createReservation, updateReservation, deleteReservation, deleteAllReservations } from "../controllers/reservation.controller.js";
const router = express.Router();
router.get("/", getReservations);
router.get("/room/:roomId", getReservationsByRoomId);
router.get("/:id", getReservationById);
router.post("/", createReservation);
router.put("/:id", updateReservation);
router.patch("/:id", unListAreservation);
router.delete("/:id", verifyApiKey, deleteReservation);
router.delete("/", verifyApiKey, deleteAllReservations);

export default router;  