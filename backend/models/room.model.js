import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true, // Make this field required
        },
        capacity: {
            type: Number,
            required: true, // Make this field required
        },
    },
    {
        timestamps: true, // Automatically add createdAt and updatedAt timestamps
    }
);

const Room = mongoose.model("Room", roomSchema);
export default Room;
