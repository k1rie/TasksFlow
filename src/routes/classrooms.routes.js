import {Router} from "express"
import {getClassrooms, createClassroom, deleteClassroom, updateClassroom, getDataList, getClassroom, getResume, getCalifications, getAttendances, getClassroomByName, importGroup, generateGroupLink, getGroupLinks, getGradesByHash, deleteGroupLink, generateJoinLink, submitJoinRequest, getJoinRequests, approveJoinRequest, rejectJoinRequest} from "../controllers/classrooms.controller.js"


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

// Rutas para enlaces únicos de calificaciones
router.post("/generateGroupLink", generateGroupLink)
router.get("/getGroupLinks", getGroupLinks)
router.delete("/deleteGroupLink/:linkId", deleteGroupLink)
// Ruta pública para ver calificaciones por hash
router.get("/grades/:hash", getGradesByHash)

// Rutas para enlaces y solicitudes de unión a grupos
router.post("/generateJoinLink", generateJoinLink)
router.post("/join/:hash", submitJoinRequest) // pública
router.get("/getJoinRequests/:groupId", getJoinRequests)
router.patch("/approveJoinRequest/:id", approveJoinRequest)
router.patch("/rejectJoinRequest/:id", rejectJoinRequest)


export default router