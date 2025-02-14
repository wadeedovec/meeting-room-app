import express from "express";
import { getUsers, checkUser, createUser, updateUser, deleteUser } from "../controllers/user.controller.js";
const router = express.Router();
router.get("/", getUsers);
router.post("/check-user", checkUser);
router.post("/add-user", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
export default router;