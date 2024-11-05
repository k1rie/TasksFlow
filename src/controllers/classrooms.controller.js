import {pool} from "../db.js"
import nodeMailer from "nodemailer"
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

    export const getClassroom= async (req,res)=>{
      const authHeader = req.headers['authorization'];
      const base64Credentials = authHeader.split(' ')[1]; // Obtener la parte después de "Basic"
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      const [emailUser, password] = credentials.split(':');
      const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[emailUser,password])
   
      if(row.length > 0){
      const data = await pool.query("SELECT * FROM classrooms WHERE id = ? AND user = ?",[req.params.id,emailUser])
      
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
            await pool.query("SET SQL_SAFE_UPDATES = 0")

            const data = await pool.query("UPDATE classrooms SET grado = ?, grupo = ?, especialidad = ? WHERE id = ? AND user = ?"
                
                ,[req.body.newGrade,req.body.newGroup,req.body.newArea,req.body.id,req.body.emailUser])
                
                req.body.students.forEach(async element => {
                  await pool.query("SET SQL_SAFE_UPDATES = 0")
                  await pool.query("UPDATE students SET grado = ?, grupo = ?, especialidad = ? WHERE grado = ? AND grupo = ? AND especialidad = ? AND user = ?",
                     [req.body.newGrade,req.body.newGroup,req.body.newArea,req.body.grade,req.body.group,req.body.area,req.body.emailUser]
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
              await pool.query("SET FOREIGN_KEY_CHECKS = 0")
            const data = await pool.query("DELETE FROM classrooms WHERE id = ? ",[req.params.id])
            await pool.query("SET FOREIGN_KEY_CHECKS = 1")
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
               const students = await pool.query(`SELECT * 
FROM students 
WHERE groupid = ? 
  AND user = ? 
ORDER BY apellidos ASC;`,[req.params.groupId,emailUser])
               const tasks = await pool.query("SELECT * FROM tasks WHERE groupid = ? AND user = ?",[req.params.groupId,emailUser])
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
                                 
                                 let transporter =  nodeMailer.createTransport({
                                    host: "smtp.gmail.com",  // Servidor SMTP (por ejemplo: smtp.gmail.com)
                                    port: 465,                 // Puerto (normalmente 587 o 465 para SSL)
                                    secure: true,             // True para 465, false para otros puertos
                                    auth: {
                                      user: "d628587@gmail.com", // Tu correo
                                      pass: "sose ogiz orks eyvi",         // Contraseña de tu correo
                                    },
                                  });

        
                                      // Enviar correo
                                      let info = await transporter.sendMail({
                                        from: '"Remitente" <d628587@gmail.com>', // Remitente
                                        to: emailUser,                            // Lista de destinatarios
                                        subject: "Calificaciones Excel",
                                        text: `Aqui estan sus calificaciones de ${req.params.grade} ${req.params.group} ${req.params.area}`      ,
                                        attachments: [
                                          {   // Adjuntar el archivo Excel en memoria
                                            filename: 'usuarios.xlsx',
                                            content: excelBuffer,  // El contenido del archivo adjunto como buffer
                                            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // Tipo MIME para Excel
                                          }
                                        ]                       // Asunto del correo                          // Cuerpo del correo en HTML
                                      });
                                                                      
                                 

                                 
                                  res.send(excelBuffer);
                         
              })
            }
              } catch (error) {
               res.send(error)
              }
             }

             export const getResume = async (req,res)=>{
              const authHeader = req.headers['authorization'];
              const base64Credentials = authHeader.split(' ')[1]; // Obtener la parte después de "Basic"
              const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
              const [emailUser, password] = credentials.split(':');
              console.log("aa")
             try {
              const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[emailUser,password])

              if(row.length > 0){
                console.log("bb")
                const [group,infoGroupQuery] = await pool.query("SELECT * FROM classrooms WHERE id = ? AND user = ?",[req.params.idGroup,emailUser])
                const [rows] = await pool.query(`
SELECT 
    s.nombre AS nombre_alumno,
    s.apellidos AS apellidos_alumno,
    COALESCE(SUM(ts.final_rate), 0) AS suma_total_calificaciones,
    COALESCE(SUM(a.attendance), 0) AS suma_total_asistencias
FROM 
    students s
LEFT JOIN 
    tasks_students ts ON s.id = ts.task_for
LEFT JOIN 
    attendence a ON s.id = a.studentid
LEFT JOIN 
    classrooms c ON s.groupid = c.id  
WHERE 
    s.groupid = ?  
    AND c.user = ?
GROUP BY 
    s.id, s.nombre, s.apellidos
ORDER BY 
    s.apellidos ASC;

                `, [req.params.idGroup,emailUser]);
        
                // Crear un nuevo libro de trabajo (workbook) con xlsx-populate
                const workbook = await XlsxPopulate.fromBlankAsync();
        
                // Seleccionar la hoja de trabajo (por defecto)
                const sheet = workbook.sheet(0);
        
                // Establecer los encabezados
                sheet.cell("A1").value("Apellidos");
                sheet.cell("B1").value("Nombres");
                sheet.cell("C1").value("Suma de Calificaciones");
                sheet.cell("D1").value("Calificaciones");
                sheet.cell("E1").value("Asistencias");
        
                // Insertar los datos en la hoja de trabajo
                rows.forEach((row, index) => {
                    const rowIndex = index + 2; // Comenzar en la fila 2
                    sheet.cell(`A${rowIndex}`).value(row.apellidos_alumno);
                    sheet.cell(`B${rowIndex}`).value(row.nombre_alumno);
                    sheet.cell(`C${rowIndex}`).value(row.suma_total_calificaciones);
                    sheet.cell(`D${rowIndex}`).value(row.suma_total_calificaciones/10);
                    sheet.cell(`E${rowIndex}`).value(row.suma_total_asistencias);
                });
        
                // Guardar el archivo en el sistema de archivos
        
                console.log(`Archivo Excel generado para el grupo ${req.params.idGroup}`);

                const excelBuffer = await workbook.outputAsync();

                // Configurar las cabeceras HTTP para la descarga
                res.setHeader('Content-Disposition', 'attachment; filename="reporte.xlsx"');
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');


                let transporter =  nodeMailer.createTransport({
                  host: "smtp.gmail.com",  // Servidor SMTP (por ejemplo: smtp.gmail.com)
                  port: 465,                 // Puerto (normalmente 587 o 465 para SSL)
                  secure: true,             // True para 465, false para otros puertos
                  auth: {
                    user: "d628587@gmail.com", // Tu correo
                    pass: "sose ogiz orks eyvi",         // Contraseña de tu correo
                  },
                });
console.log(group)

                    // Enviar correo
                    let info = await transporter.sendMail({
                      from: '"SmartClass" <d628587@gmail.com>', // Remitente
                      to: emailUser,                            // Lista de destinatarios
                      subject: "Resumen",
                      text: `Aqui está tu resumen de ${group[0].grado} ${group[0].grupo} ${group[0].especialidad}`      ,
                      attachments: [
                        {   // Adjuntar el archivo Excel en memoria
                          filename: 'Resumen.xlsx',
                          content: excelBuffer,  // El contenido del archivo adjunto como buffer
                          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // Tipo MIME para Excel
                        },
                      ]                       // Asunto del correo                          // Cuerpo del correo en HTML
                    });
                                                    
               

               
                res.send(excelBuffer);

              } 
             }catch(err){
              res.send(err)
             }
            }

            export const getCalifications = async (req,res)=>{
              const authHeader = req.headers['authorization'];
              const base64Credentials = authHeader.split(' ')[1]; // Obtener la parte después de "Basic"
              const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
              const [emailUser, password] = credentials.split(':');
              console.log("aa")
             try {
              const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[emailUser,password])

              if(row.length > 0){
                console.log("bb")
                const [group,infoGroupQuery] = await pool.query("SELECT * FROM classrooms WHERE id = ? AND user = ?",[req.params.idGroup,emailUser])
          
                ///////////////////////////
                const [rows] = await pool.query(`
             SELECT 
    s.nombre AS nombre_alumno,
    s.apellidos AS apellidos_alumno,
    COALESCE(SUM(ts.final_rate), 0) AS suma_total_calificaciones
FROM 
    students s
LEFT JOIN 
    tasks_students ts ON s.id = ts.task_for
LEFT JOIN 
    classrooms c ON s.groupid = c.id  
WHERE 
    s.groupid = ?  
    AND c.user = ?
GROUP BY 
    s.id, s.nombre, s.apellidos
ORDER BY 
    s.apellidos ASC;

                                  `, [req.params.idGroup,emailUser]);
                          


                const workbook = await XlsxPopulate.fromBlankAsync();
        
                // Seleccionar la hoja de trabajo (por defecto)
                const sheet = workbook.sheet(0);
        
                // Establecer los encabezados
                sheet.cell("A1").value("Apellidos");
                sheet.cell("B1").value("Nombres");
                sheet.cell("C1").value("Calificaciones");
        
                // Insertar los datos en la hoja de trabajo
                rows.forEach((row, index) => {
                    const rowIndex = index + 2; // Comenzar en la fila 2
                    sheet.cell(`A${rowIndex}`).value(row.apellidos_alumno);
                    sheet.cell(`B${rowIndex}`).value(row.nombre_alumno);
                    sheet.cell(`C${rowIndex}`).value(row.suma_total_calificaciones/10);
                });
        
                const excelBuffer = await workbook.outputAsync();


                let transporter =  nodeMailer.createTransport({
                  host: "smtp.gmail.com",  // Servidor SMTP (por ejemplo: smtp.gmail.com)
                  port: 465,                 // Puerto (normalmente 587 o 465 para SSL)
                  secure: true,             // True para 465, false para otros puertos
                  auth: {
                    user: "d628587@gmail.com", // Tu correo
                    pass: "sose ogiz orks eyvi",         // Contraseña de tu correo
                  },
                });
console.log(group)

                    // Enviar correo
                    let info = await transporter.sendMail({
                      from: '"SmartClass" <d628587@gmail.com>', // Remitente
                      to: emailUser,                            // Lista de destinatarios
                      subject: "Calificaciones ",
                      text: `Aqui están tus calificaciones de ${group[0].grado} ${group[0].grupo} ${group[0].especialidad}`      ,
                      attachments: [
                        {   // Adjuntar el archivo Excel en memoria
                          filename: 'Calificaciones.xlsx',
                          content: excelBuffer,  // El contenido del archivo adjunto como buffer
                          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // Tipo MIME para Excel
                        }
                      ]                       // Asunto del correo                          // Cuerpo del correo en HTML
                    });
                                                    
               

               
                res.send(excelBuffer);

              } 
             }catch(err){
              res.send(err)
             }
            }

            export const getAttendances = async (req, res) => {
              const authHeader = req.headers['authorization'];
              const base64Credentials = authHeader.split(' ')[1]; // Obtener la parte después de "Basic"
              const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
              const [emailUser, password] = credentials.split(':');
            
              try {
                const [row, info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?", [emailUser, password]);
            
                if (row.length > 0) {
                  const [rows, info] = await pool.query(`
                   SELECT 
    s.id AS student_id,
    s.nombre,
    s.apellidos,
    COALESCE(a.attendance, 'No registrada') AS estado_asistencia, 
    a.ispermission,
    a.created_at AS fecha_asistencia
FROM 
    students s
LEFT JOIN 
    attendence a ON s.id = a.studentid AND DATE(a.created_at) = ? 
WHERE 
    s.groupid = ? 
    AND s.user = ?
ORDER BY 
    s.apellidos ASC;
`, [req.params.date, req.params.idGroup, emailUser]);
            
                  const workbook = await XlsxPopulate.fromBlankAsync();
                  const sheet = workbook.sheet(0);
            
                  // Especificar encabezados en la primera fila
                  const headers = ["Apellidos", "Nombre", "Asistencia", "Fecha"];
                  headers.forEach((header, index) => {
                    sheet.cell(1, index + 1).value(header);
                  });
            
                  // Agregar los datos de asistencia en las siguientes filas
                  rows.forEach((item, rowIndex) => {
                    sheet.cell(rowIndex + 2, 1).value(item.apellidos);       // Apellidos
                    sheet.cell(rowIndex + 2, 2).value(item.nombre);          // Nombre
            
                    // Logica para asistencia: "permiso" si ispermission = 1, "✓" si asistió, "✗" si no asistió
                    let asistencia = '';
                    if (item.ispermission === 1) {
                      asistencia = 'Permiso';
                    } else if (item.estado_asistencia === '1') {
                      asistencia = '✓';
                    } else {
                      asistencia = '✗';
                    }
                    sheet.cell(rowIndex + 2, 3).value(asistencia);
            
                    // Escribir la fecha de asistencia
                    sheet.cell(rowIndex + 2, 4).value(req.params.date);
                  });
            
                  // Escribir el archivo a un buffer
                  const excelBuffer = await workbook.outputAsync();
            
                  // Establecer encabezados para la descarga del archivo
                  res.setHeader('Content-Disposition', 'attachment; filename="asistencia.xlsx"');
                  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            
                  // Enviar el archivo como respuesta
                  res.send(excelBuffer);
                }
              } catch (error) {
                res.send(error);
              }
            };