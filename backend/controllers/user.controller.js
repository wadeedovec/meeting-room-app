import User from '../models/user.model.js'
import mongoose from 'mongoose';
export const getUsers = async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        console.log("error in fetching users:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}
export const getUsersRoom = async (req, res) => {
    const { roomId } = req.params;
    if (!roomId) {
        return res.status(400).json({ message: "roomId is required" });
    }
    try {
        // Find all users who have this roomId in their roomAccess array
        const users = await User.find({ roomAccess: roomId });
        if (users.length > 0) {
            return res.status(200).json({ success: true, data: users });
        } else {
            return res.status(404).json({ success: false, message: "No users found for this room" });
        }
    } catch (error) {
        console.error("Error in fetching users:", error.message);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};
export const checkUser = async (req, res) => {
    const { email } = req.body; // Ensure the email is passed in the request body
    if (!email) {
        return res.status(400).json({ message: "Email is required" }); // Validate input
    }
    try {
        const user = await User.findOne({ email }).populate('roomAccess'); // Query the database
        if (user) {
            return res.json({ userExists: true, user });
        } else {
            return res.json({ userExists: false });
        }
    } catch (error) {
        console.error("Error checking user:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export const createUser = async (req, res) => {
    const { email, name, aad_id, role, roomAccess } = req.body;
    try {
        // Check if user already exists in MongoDB
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.json({ userExists: true, user: existingUser });
        }
        // Create a new user
        const newUser = new User({
            aad_id,
            name,
            email,
            role,
            roomAccess
        });
        await newUser.save();
        res.json({ userExists: false, user: newUser });
    } catch (err) {
        console.error('Error adding user:', err);
        res.status(500).send('Server Error');
    }
};
export const updateUser = async (req, res) => {
    const { id } = req.params;
    const userForm = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ success: false, message: "Invalid User id" });
    }
    try {
        const updatedUser = await User.findByIdAndUpdate(id, userForm, { new: true });
        res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
        console.error("error in updating!! ", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}
export const deleteUser = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ success: false, message: "Invalid User id" });
    }
    try {
        await User.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        console.error("error in deleting!! ", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}