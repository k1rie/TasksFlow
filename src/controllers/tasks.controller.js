import {pool} from "../db.js"

export const createTask = async (req,res)=>{
    try {
      await pool.query("INSERT INTO tasks (name,rate,grade,groupTask,area) VALUES (?,?,?,?,?)",[req.body.nombre,req.body.rate,req.body.grade,req.body.group,req.body.area])

        await req.body.alumnosTask.forEach(async(element) => {
    await pool.query("INSERT INTO tasks_students (name,rate,final_rate,task_for) VALUES (?,?,?,?)",[req.body.nombre,req.body.rate,req.body.finalRate,element.id])

        });
        res.send("todo bien")

    } catch (error) {
        res.send(error)
    }
   

}

export const deleteTask = async (req,res)=>{
  try {
    await pool.query("DELETE FROM tasks WHERE id = ?",[req.body.id])

      await req.body.alumnosTask.forEach(async(element) => {
  await pool.query("DELETE FROM tasks_students WHERE name = ? AND task_for = ?",[req.body.nameTask,element.id])

      });
      res.send("todo bien")

  } catch (error) {
      res.send(error)
  }
 

}

export const getTasks = async (req,res)=>{
   
    try {
        const data = await pool.query("SELECT * FROM tasks_students WHERE task_for = ?",[req.params.id])
        res.send(data[0])  
    } catch (error) {
        res.send(error)

    }

    }

    
export const getTasksGroup = async (req,res)=>{
   
   try {
    const data = await pool.query("SELECT * FROM tasks WHERE grade = ? AND groupTask = ? AND area = ?",[req.params.grade,req.params.group,req.params.area])
    res.send(data[0])
   } catch (error) {
    res.send(error)
   }

}

    export const changeRateTask = async (req,res)=>{
  try {
    const data = await pool.query("UPDATE tasks_students SET final_rate = ? WHERE task_for = ? AND name = ?",[req.body.newRate,req.body.idStudent,req.body.taskName])
    res.send(data)
  } catch (error) {
    res.send(error)
  }

    }

    export const changeNameTask = async (req,res)=>{
      try {

        const data = await pool.query("UPDATE tasks SET name = ? WHERE  id = ?",[req.body.newTaskName,req.body.idTask])
       req.body.alumnosTask.forEach(async(element) => {
        await pool.query("SET SQL_SAFE_UPDATES = 0")

        await pool.query("UPDATE tasks_students SET name = ? WHERE  task_for = ? AND name = ?",[req.body.newTaskName,element.id,req.body.nameTask])
        })
        await pool.query("SET SQL_SAFE_UPDATES = 1")


        res.send(data)
      } catch (error) {
        res.send(error)
      }
    
        }

        export const changeRateTaskGroup = async (req,res)=>{
          try {
    
            const data = await pool.query("UPDATE tasks SET rate = ? WHERE  id = ?",[req.body.newRate,req.body.idTask])
           req.body.alumnosTask.forEach(async(element) => {
            await pool.query("SET SQL_SAFE_UPDATES = 0")
    
            await pool.query("UPDATE tasks_students SET rate = ? WHERE  task_for = ? AND name = ?",[req.body.newRate,element.id,req.body.nameTask])
      
            })
    
            res.send(data)
          } catch (error) {
           res.send(error)
          }
        
            }
        
    

    


    export const downloadExcel = async (req,res)=>{
      try {
        const data = await pool.query("UPDATE tasks_students SET final_rate = ? WHERE task_for = ? AND name = ?",[req.body.newRate,req.body.idStudent,req.body.taskName])
        res.send(data)
      } catch (error) {
        res.send(error)
      }

    }