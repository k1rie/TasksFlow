import {Router} from "express"
import {deleteFaceStudent,searchFaceStudent,registerFaceStudent,createStudent,getStudents,getStudent, deleteStudent, updateStudent, attendenceStudent, getAttendenceStudent, createPermission, getPermissions, createAttendance, sendQR,getStudentByName} from "../controllers/students.controller.js"

const router = Router()

router.post("/createStudent",createStudent)

router.get("/getStudents/:groupId",getStudents)

router.get("/getStudent/:id",getStudent)

router.delete("/deleteStudent/:id",deleteStudent)

router.patch("/updateStudent/:id",updateStudent)

router.post("/attendance",attendenceStudent)

router.post("/createPermission",createPermission)

router.post("/createAttendance",createAttendance)


router.get("/getPermissions/:id",getPermissions)

router.get("/getStudentAttendance/:id",getAttendenceStudent)

router.post("/sendQR",sendQR)

router.get("/getStudentByName/:name/:groupid",getStudentByName)

router.post("/registerFaceStudent",registerFaceStudent)
router.post("/searchFaceStudent",searchFaceStudent)
router.post("/deleteFaceStudent",deleteFaceStudent)



export default router
