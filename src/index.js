import express from "express"
import cors from "cors"
import classroomsRoutes from "./routes/classrooms.routes.js"
import studentsRoutes from "./routes/students.routes.js"
import tasksRoutes from "./routes/tasks.routes.js"
import userRoutes from "./routes/user.routes.js"


const App = express()
App.use(cors())
App.use(express.json())
App.use(express.urlencoded({ extended: true }));


App.listen(4000,()=>{
console.log("listening on", 8000)
})

App.use(classroomsRoutes)
App.use(studentsRoutes)
App.use(tasksRoutes)
App.use(userRoutes)
