import { Router } from "express";
import {createTask,getTasks,changeRateTask, getTasksGroup, changeNameTask, changeRateTaskGroup, deleteTask} from "../controllers/tasks.controller.js"

const router = Router()

router.post("/createTask",createTask)

router.get("/getTasks/:id",getTasks)


router.patch("/changeRateTask",changeRateTask)

router.patch("/changeNameTask",changeNameTask)

router.patch("/changeRateTaskGroup",changeRateTaskGroup)


router.get("/getTasksGroup/:groupId",getTasksGroup)

router.delete("/deleteTask",deleteTask)





export default router