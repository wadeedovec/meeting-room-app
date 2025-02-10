import Room from '../models/room.model.js'
import mongoose from 'mongoose';
export const getRooms = async (req, res) => {
    try {
        const rooms = await Room.find({});
        res.status(200).json({ success: true, data: rooms });
    } catch (error) {
        console.log("error in fetching rooms:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}
export const getRoomById = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ success: false, message: "Invalid Room id" });
    }
    try {
        const room = await Room.findById(id);
        res.status(200).json({ success: true, data: room });
    } catch (error) {
        console.log("error in fetching room:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}
export const createRoom = async (req, res) => {
    const roomForm = req.body;
    if (!roomForm.name || !roomForm.capacity) {
        return res.status(400).json({ success: false, message: "Please Provide all fields" });
    }
    const newRoom = new Room(roomForm);
    try {
        await newRoom.save();
        res.status(201).json({ success: true, data: newRoom });
    } catch (error) {
        console.error("error in creaating!! ", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}
export const updateRoom = async (req, res) => {
    const { id } = req.params;
    const roomForm = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ success: false, message: "Invalid Room id" });
    }
    try {
        const updatedRoom = await Room.findByIdAndUpdate(id, roomForm, { new: true });
        res.status(200).json({ success: true, data: updatedRoom });
    } catch (error) {
        console.error("error in updating!! ", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}
export const deleteRoom = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ success: false, message: "Invalid Room id" });
    }
    try {
        await Room.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "Room deleted successfully" });
    } catch (error) {
        console.error("error in deleting!! ", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}