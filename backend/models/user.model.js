import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        aad_id: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        role: {
            type: String,
            enum: ["admin", "user"],
            default: "user",
        },
        roomAccess: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Room",
            }
        ]

    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
);

const User = mongoose.model('User', userSchema);
export default User;
