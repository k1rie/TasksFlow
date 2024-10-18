import {Router} from "express"
import {getClassrooms, createClassroom, deleteClassroom, updateClassroom, getDataList, getClassroom, getResume, getCalifications} from "../controllers/classrooms.controller.js"


const router = Router()

router.get("/getClassrooms",getClassrooms)

router.get("/getClassroom/:id",getClassroom)

router.post("/createClassroom", createClassroom)

router.delete("/deleteClassroom/:id",deleteClassroom)

router.patch("/updateGroup",updateClassroom)

router.get("/getDataList/:groupId/:grade/:group/:area",getDataList)

router.get("/getResume/:idGroup",getResume)

router.get("/getCalifications/:idGroup",getCalifications)


export default router