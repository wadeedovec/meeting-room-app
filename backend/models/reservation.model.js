import mongoose from "mongoose";
const reservationSchema = new mongoose.Schema(
    {
        subject: {
            type: String,
            required: true,
        },
        organizer: {
            type: String,
            required: true,
        },
        meetingRoomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            default: null,
        },
        start: {
            type: Date,
            required: true,
        },
        end: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);
const Reservation = mongoose.model("Reservation", reservationSchema);
export default Reservation;
