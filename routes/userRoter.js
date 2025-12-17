import { getUser, login, logout, register, updatePassword, updateProfile } from "../controllers/userController.js";
import express from "express"
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", isAuthenticated, logout);
router.get("/me", isAuthenticated, getUser);
router.put("/update/profile", isAuthenticated, updateProfile);
router.put("/update/password", isAuthenticated, updatePassword);

export default router