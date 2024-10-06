import {pool} from "../db.js"
import XlsxPopulate from "xlsx-populate"


export const getClassrooms= async (req,res)=>{
   const authHeader = req.headers['authorization'];
   const base64Credentials = authHeader.split(' ')[1]; // Obtener la parte después de "Basic"
   const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
   const [emailUser, password] = credentials.split(':');
   const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[emailUser,password])

   if(row.length > 0){
   const data = await pool.query("SELECT * FROM classrooms WHERE user = ?",[emailUser])
   
   res.send(data[0])
   }
    }


    export const createClassroom = async (req,res)=>{
try {
   const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[req.body.emailUser,req.body.password])

   if(row.length > 0){
   const data = await pool.query("INSERT INTO classrooms (especialidad, grado, grupo,alumnos,user) VALUES (?,?,?,0,?)"
       
       ,[req.body.especialidad,req.body.grado,req.body.grupo,req.body.emailUser])
       console.log(data[0].insertId)
       res.send(data)
   }
} catch (error) {
   console.log(error)
   res.send(error)
}
        
         }

         export const updateClassroom = async (req,res)=>{
          try {
            const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[req.body.emailUser,req.body.password])

            if(row.length > 0){
            console.log(req.body)
    
            const data = await pool.query("UPDATE classrooms SET grado = ?, grupo = ?, especialidad = ? WHERE id = ?"
                
                ,[req.body.newGrade,req.body.newGroup,req.body.newArea,req.body.id])
                
                req.body.students.forEach(async element => {
                  await pool.query("SET SQL_SAFE_UPDATES = 0")
                  await pool.query("UPDATE students SET grado = ?, grupo = ?, especialidad = ? WHERE grado = ? AND grupo = ? AND especialidad = ?",
                     [req.body.newGrade,req.body.newGroup,req.body.newArea,req.body.grade,req.body.group,req.body.area]
                  )
                });
                await pool.query("SET SQL_SAFE_UPDATES = 1")
                res.send("Todo bien")
               }
          } catch (error) {
            res.send(error)
          }

             }

         export const deleteClassroom= async (req,res)=>{
           try {
            const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[req.body.emailUser,req.body.password])

            if(row.length > 0){
            const data = await pool.query("DELETE FROM classrooms WHERE id = ? ",[req.params.id])
            res.send(data[0])
            console.log(data[0])
            }
           } catch (error) {
            res.send(error)
           }
             }
         

             export const getDataList= async (req,res)=>{
               const authHeader = req.headers['authorization'];
               const base64Credentials = authHeader.split(' ')[1]; // Obtener la parte después de "Basic"
               const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
               const [emailUser, password] = credentials.split(':');
              try {
               const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[emailUser,password])

               if(row.length > 0){
               let taskStudents = []
               const students = await pool.query("SELECT * FROM students WHERE grado = ? AND grupo = ? AND especialidad = ? AND user = ?",[req.params.grade,req.params.group,req.params.area,emailUser])
               const tasks = await pool.query("SELECT * FROM tasks WHERE grade = ? AND groupTask = ? AND area = ? AND user = ?",[req.params.grade,req.params.group,req.params.area,emailUser])
               await Promise.all(
               students[0].map(async (e)=>{
                 const [rows,fields] = await pool.query("SELECT * FROM tasks_students WHERE task_for = ? AND user = ?",[e.id,emailUser])
                 rows.map((e)=>{
                  taskStudents.push(e)
                 })
               })
            )

              

               XlsxPopulate.fromBlankAsync().then(async (workbook)=>{
                  var contador = 2
                  var contador2 = 1
                  var sumaTotal = 0
                  const dataExcel = workbook.sheet(0).cell("A1").value("Alumno")
                  await students[0].forEach((e)=>{
                     dataExcel.sheet(0).cell(`A${contador}`).value(e.nombre)
                     contador++
                  })
                  contador = 2
                  await tasks[0].forEach((e,indice)=>{
                     dataExcel.sheet(0).cell(`${String.fromCharCode(66+indice)}1`).value(e.name)

                  })
                  
                  console.log(tasks[0])
                  taskStudents.forEach((e,index)=>{
if(contador2 !== tasks[0].length+1){
   dataExcel.sheet(0).cell(`${String.fromCharCode(65+contador2)}${contador}`).value(e.final_rate)
   sumaTotal = sumaTotal+Number(e.final_rate)
   contador2++

}
if(contador2  === tasks[0].length+1){
   dataExcel.sheet(0).cell(`${String.fromCharCode(65+contador2)}1`).value("Suma Total")
   dataExcel.sheet(0).cell(`${String.fromCharCode(65+contador2)}${contador}`).value(sumaTotal)
   sumaTotal = 0
   contador2 = 1
   contador++
}
  

                                 })
                                 const excelBuffer = await workbook.outputAsync();

                                 // Configurar las cabeceras HTTP para la descarga
                                 res.setHeader('Content-Disposition', 'attachment; filename="reporte.xlsx"');
                                 res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                                 res.send(excelBuffer);
                         
              })
            }
              } catch (error) {
               res.send(error)
              }
             }