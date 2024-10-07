import {pool} from "../db.js"

export const createTask = async (req,res)=>{
    try {
const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[req.body.emailUser,req.body.password])

if(row.length > 0){
  await pool.query("INSERT INTO tasks (name,rate,grade,groupTask,area,user) VALUES (?,?,?,?,?,?)",[req.body.nombre,req.body.rate,req.body.grade,req.body.group,req.body.area,req.body.emailUser])

  await req.body.alumnosTask.forEach(async(element) => {
await pool.query("INSERT INTO tasks_students (name,rate,final_rate,task_for,user) VALUES (?,?,?,?,?)",[req.body.nombre,req.body.rate,req.body.finalRate,element.id,req.body.emailUser])

  });
  res.send("todo bien")

}
} catch (error) {
        res.send(error)
    }
   

}

export const deleteTask = async (req,res)=>{
  try {

    const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[req.body.emailUser,req.body.password])

if(row.length > 0){
  await pool.query("DELETE FROM tasks WHERE id = ?",[req.body.id])

  await req.body.alumnosTask.forEach(async(element) => {
await pool.query("DELETE FROM tasks_students WHERE name = ? AND task_for = ?",[req.body.nameTask,element.id])

  });
  res.send("todo bien")
}

  } catch (error) {
      res.send(error)
  }
 

}

export const getTasks = async (req,res)=>{
  const authHeader = req.headers['authorization'];
  const base64Credentials = authHeader.split(' ')[1]; // Obtener la parte después de "Basic"
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [emailUser, password] = credentials.split(':');
    try {
      const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[emailUser,password])
      if(row.length > 0){
        console.log("aaa")

        const data = await pool.query("SELECT * FROM tasks_students WHERE task_for = ? AND user = ?",[req.params.id,emailUser])
        res.send(data[0])  
      }
        
    } catch (error) {
        res.send(error)

    }

    }

    
export const getTasksGroup = async (req,res)=>{
  const authHeader = req.headers['authorization'];
  const base64Credentials = authHeader.split(' ')[1]; // Obtener la parte después de "Basic"
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [emailUser, password] = credentials.split(':');
   try {

    const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[emailUser,password])

    if(row.length > 0){
      const data = await pool.query("SELECT * FROM tasks WHERE grade = ? AND groupTask = ? AND area = ? AND user = ?",[req.params.grade,req.params.group,req.params.area,emailUser])
      res.send(data[0])
    }
   } catch (error) {
    res.send(error)
   }

}

    export const changeRateTask = async (req,res)=>{
  try {

    
    const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[req.body.emailUser,req.body.password])

    if(row.length > 0){
      const data = await pool.query("UPDATE tasks_students SET final_rate = ? WHERE task_for = ? AND name = ?",[req.body.newRate,req.body.idStudent,req.body.taskName])
    

      res.send(data)
    }
  } catch (error) {
    res.send(error)
  }

    }

    export const changeNameTask = async (req,res)=>{
      try {

        
    const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[req.body.emailUser,req.body.password])

    if(row.length > 0){
      const data = await pool.query("UPDATE tasks SET name = ? WHERE  id = ?",[req.body.newTaskName,req.body.idTask])
      req.body.alumnosTask.forEach(async(element) => {
       await pool.query("SET SQL_SAFE_UPDATES = 0")

       await pool.query("UPDATE tasks_students SET name = ? WHERE  task_for = ? AND name = ?",[req.body.newTaskName,element.id,req.body.nameTask])
       })
       await pool.query("SET SQL_SAFE_UPDATES = 1")


       res.send(data)
    }
      } catch (error) {
        res.send(error)
      }
    
        }

        export const changeRateTaskGroup = async (req,res)=>{
          try {

            const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[req.body.emailUser,req.body.password])

            if(row.length > 0){
              await pool.query("SET SQL_SAFE_UPDATES = 0")

              const data = await pool.query("UPDATE tasks SET rate = ? WHERE  id = ?",[req.body.newRate,req.body.idTask])
              await req.body.alumnosTask.forEach(async(element) => {
       
               await pool.query("UPDATE tasks_students SET rate = ? WHERE  task_for = ? AND name = ?",[req.body.newRate,element.id,req.body.nameTask])
         
               })
              

               const studentsTasks = await pool.query("SELECT * FROM tasks_students WHERE name = ? AND user = ?",[req.body.taskName,req.body.emailUser])
               console.log("aquuiiii")
               console.log(studentsTasks)
               studentsTasks[0].map(async (e)=>{
                const percentage = ((e.final_rate*100)/req.body.rate)/100
                 await pool.query("UPDATE tasks_students SET final_rate = ? WHERE task_for = ? AND name = ?",[percentage*req.body.newRate,e.id,e.taskName])
         
               })
       
               res.send(data)
            }
          } catch (error) {
            console.log(error)
           res.send(error)
          }
        
            }
        
    

    

