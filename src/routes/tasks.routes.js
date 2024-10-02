import { Router } from "express";
import {createTask,getTasks,changeRateTask, getTasksGroup, changeNameTask, changeRateTaskGroup} from "../controllers/tasks.controller.js"

const router = Router()

router.post("/createTask",createTask)

router.get("/getTasks/:id",getTasks)

router.post("/changeRateTask",changeRateTask)

router.patch("/changeRateTask",changeRateTask)

router.patch("/changeNameTask",changeNameTask)

router.patch("/changeRateTaskGroup",changeRateTaskGroup)


router.get("/getTasksGroup/:grade/:group/:area",getTasksGroup)





export default router