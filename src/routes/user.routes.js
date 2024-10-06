import { Router } from "express";
import { createUser, getUser } from "../controllers/user.controller.js";

const router = Router()

router.post("/createUser",createUser)

router.get("/verifyUser",getUser)

export default router