import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        capacity: {
            type: Number,
            required: true,
        },
        room_color: {
            type: String,
            required: false,
        }
    },
    {
        timestamps: true, // Automatically add createdAt and updatedAt timestamps
    }
);

const Room = mongoose.model("Room", roomSchema);
export default Room;
