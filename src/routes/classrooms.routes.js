import {Router} from "express"
import {getClassrooms, createClassroom, deleteClassroom, updateClassroom, getDataList} from "../controllers/classrooms.controller.js"


const router = Router()

router.get("/getClassrooms",getClassrooms)

router.post("/createClassroom", createClassroom)

router.delete("/deleteClassroom/:id",deleteClassroom)

router.patch("/updateGroup",updateClassroom)

router.get("/getDataList/:grade/:group/:area",getDataList)

export default router