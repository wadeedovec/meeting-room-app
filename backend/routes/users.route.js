import express from "express";
import { verifyApiKey } from "../middlewares/authMiddleware.js";
import { checkUser, createUser, updateUser, deleteUser } from "../controllers/user.controller.js";
const router = express.Router();
router.post("/check-user", verifyApiKey, checkUser);
router.post("/add-user", verifyApiKey, createUser);
router.put("/:id", verifyApiKey, updateUser);
router.delete("/:id", verifyApiKey, deleteUser);
export default router;