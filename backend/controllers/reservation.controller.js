import Reservation from "../models/reservation.model.js";
import mongoose from 'mongoose';
export const getReservations = async (req, res) => {
    try {
        const reservations = await Reservation.find().populate('organizer', 'name').populate('meetingRoomId', 'name');;
        res.status(200).json({ success: true, data: reservations });
    } catch (error) {
        console.log("error in fetching reservations:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}
export const getReservationsByRoomId = async (req, res) => {
    try {
        const { roomId } = req.params;  // Getting the roomId from the query parameters
        if (!mongoose.Types.ObjectId.isValid(roomId)) {
            return res.status(400).json({ success: false, message: "Invalid Room ID" });
        }

        // Find reservations that match the meetingRoomId
        const reservations = await Reservation.find({ meetingRoomId: roomId })
            .populate('organizer', 'name')
            .populate('meetingRoomId', 'name'); // You can add more fields to populate if needed

        if (!reservations.length) {
            return res.status(200).json({ success: true, data: [] });
        }

        res.status(200).json({ success: true, data: reservations });
    } catch (error) {
        console.log("Error in fetching reservations:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}



export const getReservationById = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ success: false, message: "Invalid Reservation id" });
    }
    try {
        const reservation = await Reservation.findById(id);
        res.status(200).json({ success: true, data: reservation });
    } catch (error) {
        console.log("error in fetching reservation:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}
export const createReservation = async (req, res) => {
    const reservationForm = req.body;
    if (!reservationForm.subject || !reservationForm.start || !reservationForm.end) {
        return res.status(400).json({ success: false, message: "Please Provide all fields" });
    }
    const newReservation = new Reservation(reservationForm);
    try {
        await newReservation.save();
        res.status(201).json({ success: true, data: newReservation });
    } catch (error) {
        console.error("error in creaating!! ", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}
export const updateReservation = async (req, res) => {
    const { id } = req.params;
    const reservationForm = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ success: false, message: "Invalid Reservation id" });
    }
    try {
        const updatedReservation = await Reservation.findByIdAndUpdate(id, reservationForm, { new: true });
        res.status(200).json({ success: true, data: updatedReservation });
    } catch (error) {
        console.error("error in updating!! ", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}
export const deleteReservation = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ success: false, message: "Invalid Reservation id" });
    }
    try {
        await Reservation.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "Reservation deleted successfully" });
    } catch (error) {
        console.error("error in deleting!! ", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}
export const deleteAllReservations = async (req, res) => {
    try {
        await Reservation.deleteMany({});
        res.status(200).json({ success: true, message: "All Reservations deleted successfully" });
    } catch (error) {
        console.error("error in deleting all!! ", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}