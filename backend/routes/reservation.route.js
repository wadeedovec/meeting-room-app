import express from "express";
import { getReservations, getReservationById, getReservationsByRoomId, createReservation, updateReservation, deleteReservation } from "../controllers/reservation.controller.js";
const router = express.Router();
router.get("/", getReservations);
router.get("/room/:roomId", getReservationsByRoomId);
router.get("/:id", getReservationById);
router.post("/", createReservation);
router.put("/:id", updateReservation);
router.delete("/:id", deleteReservation);

export default router;  