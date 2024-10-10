import {Router} from "express"
import {createStudent,getStudents,getStudent, deleteStudent, updateStudent, attendenceStudent, getAttendenceStudent, createPermission, getPermissions, createAttendance} from "../controllers/students.controller.js"

const router = Router()

router.post("/createStudent",createStudent)

router.get("/getStudents/:groupId",getStudents)

router.get("/getStudent/:id",getStudent)

router.delete("/deleteStudent/:id",deleteStudent)

router.patch("/updateStudent/:id",updateStudent)

router.post("/attendance/:name/:lastName/:grade/:group/:area/:email",attendenceStudent)

router.post("/createPermission",createPermission)

router.post("/createAttendance",createAttendance)


router.get("/getPermissions/:name/:lastName/:grade/:group/:area",getPermissions)

router.get("/getStudentAttendance/:name/:lastName/:grade/:group/:area",getAttendenceStudent)

export default router