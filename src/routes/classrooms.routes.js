import {Router} from "express"
import {getClassrooms, createClassroom, deleteClassroom, updateClassroom, getDataList, getClassroom, getResume, getCalifications, getAttendances, getClassroomByName, importGroup} from "../controllers/classrooms.controller.js"


const router = Router()

router.get("/getClassrooms",getClassrooms)

router.get("/getClassroom/:id",getClassroom)

router.get("/getClassroomByName/:name",getClassroomByName)


router.post("/createClassroom", createClassroom)

router.delete("/deleteClassroom/:id",deleteClassroom)

router.patch("/updateGroup",updateClassroom)

router.get("/getDataList/:groupId/:grade/:group/:area",getDataList)

router.get("/getResume/:idGroup",getResume)

router.get("/getCalifications/:idGroup",getCalifications)

router.get("/getAttendances/:idGroup/:date",getAttendances)

router.post("/importGroup",importGroup)



export default router