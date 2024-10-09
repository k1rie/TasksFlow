import {Router} from "express"
import {createStudent,getStudents,getStudent, deleteStudent, updateStudent, attendenceStudent, getAttendenceStudent} from "../controllers/students.controller.js"

const router = Router()

router.post("/createStudent",createStudent)

router.get("/getStudents/:especialidad/:grado/:grupo",getStudents)

router.get("/getStudent/:id",getStudent)

router.delete("/deleteStudent/:id",deleteStudent)

router.patch("/updateStudent/:id",updateStudent)

router.post("/attendance/:name/:lastName/:grade/:group/:area/:email",attendenceStudent)

router.get("/getStudentAttendance/:name/:lastName/:grade/:group/:area/:user",getAttendenceStudent)

export default router