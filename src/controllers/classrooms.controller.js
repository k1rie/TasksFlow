import {pool} from "../db.js"
import nodeMailer from "nodemailer"
import QRCode from "qrcode"
import XlsxPopulate from "xlsx-populate"
import { createStudent } from "./students.controller.js";

async function queryWithRetry(sqlQuery, params, maxRetries = 3) {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            return await pool.query(sqlQuery, params);
        } catch (error) {
            if (error.code === 'ETIMEDOUT' && retries < maxRetries - 1) {
                retries++;
                console.log(`Intento ${retries} después de error de conexión`);
                await new Promise(resolve => setTimeout(resolve, 1000 * retries));
            } else {
                throw error;
            }
        }
    }
}


export const getClassrooms = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).send('Autorización requerida');
        }
        
        const base64Credentials = authHeader.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        const [emailUser, password] = credentials.split(':');
        
        // Usar la función con reintentos
        const [row, info] = await queryWithRetry(
            "SELECT * FROM users WHERE email = ? AND password = ?",
            [emailUser, password]
        );
        
        if (row.length > 0) {
            const data = await queryWithRetry(
                "SELECT * FROM classrooms WHERE user = ?",
                [emailUser]
            );
            res.send(data[0]);
        } else {
            res.status(401).send('Credenciales inválidas');
        }
    } catch (error) {
        console.error("Error en getClassrooms:", error);
        res.status(500).send({
            error: 'Error al conectar con la base de datos',
            details: error.message
        });
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

       
    export const getClassroomByName = async (req,res)=>{
      const authHeader = req.headers['authorization'];
      const base64Credentials = authHeader.split(' ')[1]; // Obtener la parte después de "Basic"
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      const [emailUser, password] = credentials.split(':');
      const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[emailUser,password])
   
      if(row.length > 0){
      const [rows] = await pool.query("SELECT * FROM classrooms WHERE especialidad LIKE CONCAT('%', ?, '%') AND user = ?",[req.params.name,emailUser])
      
      res.send(rows)
      }
       }

       export const importGroup = async (req, res) => {
        try {
            const authHeader = req.headers['authorization'];
            const base64Credentials = authHeader.split(' ')[1];
            const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
            const [emailUser, password] = credentials.split(':');
            
            const [row] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?", [emailUser, password]);
            
            if (row.length > 0) {
                const [students] = await pool.query("SELECT * FROM students WHERE groupid = ? AND user = ?", [req.body.idGroup, emailUser]);
                const [group] = await pool.query("SELECT * FROM classrooms WHERE id = ? AND user = ?", [req.body.idGroup, emailUser]);
                const [newGroup] = await pool.query("SELECT * FROM classrooms WHERE id = ? AND user = ?", [req.body.idNewGroup, emailUser]);

                // Usar Promise.all para manejar las operaciones asíncronas en paralelo
                await Promise.all(students.map(async (student) => {
                    const [data] = await pool.query(
                        "INSERT INTO students (nombre,apellidos,correo,especialidad,grado,grupo,user,groupid) VALUES(?,?,?,?,?,?,?,?)",
                        [student.nombre, student.apellidos, student.correo, newGroup[0].especialidad, newGroup[0].grado, newGroup[0].grupo, emailUser, req.body.idNewGroup]
                    );
                    
                    const [rows] = await pool.query("SELECT * FROM tasks WHERE groupid = ? and user = ?", [req.body.idNewGroup, emailUser]);
                    
                    if (rows.length > 0) {
                        await Promise.all(rows.map(task => 
                            pool.query("INSERT INTO tasks_students (name,rate,final_rate,task_for,user) VALUES (?,?,0,?,?)",
                            [task.name, task.rate, data.insertId, req.body.emailUser])
                        ));
                    }
                    
                    await pool.query(
                        "UPDATE classrooms SET alumnos = ? WHERE id = ?",
                        [students.length, req.body.idNewGroup]
                    );
                    
                    const QRBuffer = await QRCode.toBuffer(
                        `https://tasks-flow-b44f6.web.app/attendance/${data.insertId}/${student.nombre}/${student.apellidos}/${group[0].grado}/${group[0].grupo}/${group[0].especialidad}/${student.correo}`,
                        { errorCorrectionLevel: 'L' }
                    );
                    
                    // Configurar el transporter
                    const transporter = nodeMailer.createTransport({
                        host: "smtp.gmail.com",
                        port: 465,
                        secure: true,
                        auth: {
                            user: "d628587@gmail.com",
                            pass: "sose ogiz orks eyvi"
                        }
                    });
                    
                    // Verificar que el correo es válido antes de enviar
                    if (student.correo && student.correo.trim().length > 0 && student.correo.includes('@')) {
                        try {
                            await transporter.sendMail({
                                from: '"Remitente" <d628587@gmail.com>',
                                to: student.correo.trim(), // Asegurarse de que el correo esté limpio
                                subject: "QR",
                                text: `Aquí está tu código QR en formato PNG para la clase ${group[0].grado} ${group[0].grupo} ${group[0].especialidad}`,
                                attachments: [{
                                    filename: 'qrcode.png',
                                    content: QRBuffer,
                                    contentType: 'image/png'
                                }]
                            });
                            console.log(`Correo enviado exitosamente a ${student.correo}`);
                        } catch (emailError) {
                            console.error(`Error al enviar correo a ${student.correo}:`, emailError);
                        }
                    } else {
                        console.log(`Correo inválido para ${student.nombre} ${student.apellidos}: ${student.correo}`);
                    }
                }));
                
                res.json({ success: true, message: "Grupo importado exitosamente" });
            } else {
                res.status(401).json({ success: false, message: "Autenticación fallida" });
            }
        } catch (error) {
            console.error('Error en importGroup:', error);
            res.status(500).json({ success: false, message: "Error interno del servidor", error: error.message });
        }
    };


    export const createClassroom = async (req,res)=>{
try {
   const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[req.body.emailUser,req.body.password])

   if(row.length > 0){
   const data = await pool.query("INSERT INTO classrooms (especialidad, grado, grupo,alumnos,user) VALUES (?,?,?,0,?)"
       
       ,[req.body.especialidad,req.body.grado,req.body.grupo,req.body.emailUser])
       
       res.send(data)
   }
} catch (error) {
   
   res.send(error)
}
        
         }

         export const updateClassroom = async (req,res)=>{
          try {
            const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[req.body.emailUser,req.body.password])

            if(row.length > 0){
            
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
            
            }
           } catch (error) {
            res.send(error)
           }
             }
         

             export const getDataList = async (req, res) => {
              const authHeader = req.headers['authorization'];
              const base64Credentials = authHeader.split(' ')[1];
              const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
              const [emailUser, password] = credentials.split(':');
            
              try {
                const [row] = await pool.query(
                  "SELECT * FROM users WHERE email = ? AND password = ?",
                  [emailUser, password]
                );
            
                if (row.length > 0) {
                  // 1. Obtener lista de estudiantes con nombre y apellidos
                  const [students] = await pool.query(`
                    SELECT id, nombre, apellidos, user 
                    FROM students 
                    WHERE groupid = ? AND user = ? 
                    ORDER BY apellidos ASC, nombre ASC
                  `, [req.params.groupId, emailUser]);
            
                  // 2. Obtener lista de tareas/actividades
                  const [tasks] = await pool.query(
                    "SELECT * FROM tasks WHERE groupid = ? AND user = ? ORDER BY id ASC",
                    [req.params.groupId, emailUser]
                  );
            
                  // 3. Crear el Excel
                  const workbook = await XlsxPopulate.fromBlankAsync();
                  const sheet = workbook.sheet(0);
            
                  // 4. Escribir encabezados
                  sheet.cell("A1").value("Apellidos");
                  sheet.cell("B1").value("Nombre");
                  tasks.forEach((task, index) => {
                    const column = String.fromCharCode(67 + index); // Empezamos desde C porque A y B son para apellidos y nombre
                    sheet.cell(`${column}1`).value(task.name);
                  });
                  sheet.cell(`${String.fromCharCode(67 + tasks.length)}1`).value("Suma Total");
            
                  // 5. Procesar cada estudiante
                  for (let studentIndex = 0; studentIndex < students.length; studentIndex++) {
                    const student = students[studentIndex];
                    const rowNum = studentIndex + 2; // Empezamos en la fila 2
            
                    // Escribir apellidos y nombre del estudiante
                    sheet.cell(`A${rowNum}`).value(student.apellidos);
                    sheet.cell(`B${rowNum}`).value(student.nombre);
            
                    // Obtener todas las calificaciones del estudiante
                    const [grades] = await pool.query(
                      "SELECT ts.* FROM tasks_students ts WHERE ts.task_for = ? AND ts.user = ?",
                      [student.id, emailUser]
                    );
            
                    let sumaTotal = 0;
            
                    // Procesar cada tarea
                    tasks.forEach((task, taskIndex) => {
                      const column = String.fromCharCode(67 + taskIndex); // Empezamos desde C para las calificaciones
                      // Buscar la calificación correspondiente a esta tarea por nombre
                      const grade = grades.find(g => g.name === task.name);
                      
                      if (grade && grade.final_rate !== null) {
                        const finalRate = Number(grade.final_rate);
                        sheet.cell(`${column}${rowNum}`).value(finalRate);
                        sumaTotal += finalRate;
                      } else {
                        // Si no hay calificación, dejar la celda vacía
                        sheet.cell(`${column}${rowNum}`).value("");
                      }
                    });
            
                    // Escribir suma total
                    sheet.cell(`${String.fromCharCode(67 + tasks.length)}${rowNum}`).value(sumaTotal);
                  }
            
                  // 6. Generar el buffer del Excel
                  const excelBuffer = await workbook.outputAsync();
            
                  // 7. Configurar el correo
                  let transporter = nodeMailer.createTransport({
                    host: "smtp.gmail.com",
                    port: 465,
                    secure: true,
                    auth: {
                      user: "d628587@gmail.com",
                      pass: "sose ogiz orks eyvi",
                    },
                  });
            
                  // 8. Enviar el correo
                  await transporter.sendMail({
                    from: '"Remitente" <d628587@gmail.com>',
                    to: emailUser,
                    subject: "Calificaciones Excel",
                    text: `Aqui estan sus calificaciones de ${req.params.grade} ${req.params.group} ${req.params.area}`,
                    attachments: [{
                      filename: 'calificaciones.xlsx',
                      content: excelBuffer,
                      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    }]
                  });
            
                  // 9. Enviar la respuesta
                  res.setHeader('Content-Disposition', 'attachment; filename="calificaciones.xlsx"');
                  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                  res.send(excelBuffer);
                }
              } catch (error) {
                console.error(error);
                res.status(500).send(error);
              }
            };

            export const getResume = async (req,res) => {
              try {
                  // 1. Validación de autenticación
                  const authHeader = req.headers['authorization'];
                  if (!authHeader) {
                      return res.status(401).send('Autorización requerida');
                  }
                  const base64Credentials = authHeader.split(' ')[1];
                  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
                  const [emailUser, password] = credentials.split(':');
                  
                  // 2. Verificar usuario
                  const [row] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",
                      [emailUser, password]
                  );
          
                  if(row.length > 0) {
                      // 3. Verificar grupo
                      const [group] = await pool.query(
                          "SELECT * FROM classrooms WHERE id = ? AND user = ?",
                          [req.params.idGroup, emailUser]
                      );
          
                      // 4. Obtener datos
                      const [rows] = await pool.query(`
                          SELECT 
                              s.nombre AS nombre_alumno,
                              s.apellidos AS apellidos_alumno,
                              COALESCE(SUM(ts.final_rate), 0) AS suma_total_calificaciones,
                              CASE 
                                  WHEN COUNT(ts.id) > 0 
                                  THEN COALESCE(SUM(ts.final_rate), 0) / COUNT(ts.id)
                                  ELSE 0 
                              END AS promedio,
                              COUNT(ts.id) AS numero_tareas,
                              COALESCE(SUM(a.attendance), 0) AS suma_total_asistencias
                          FROM 
                              students s
                          LEFT JOIN 
                              tasks_students ts ON s.id = ts.task_for AND ts.user = s.user
                          LEFT JOIN 
                              tasks t ON t.groupid = s.groupid AND t.user = s.user
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
                              s.apellidos ASC
                      `, [req.params.idGroup, emailUser]);
          
                      // 5. Crear Excel
                      const workbook = await XlsxPopulate.fromBlankAsync();
                      const sheet = workbook.sheet(0);
          
                      // Establecer encabezados
                      sheet.cell("A1").value("Apellidos");
                      sheet.cell("B1").value("Nombres");
                      sheet.cell("C1").value("Suma de Calificaciones");
                      sheet.cell("D1").value("Promedio");
                      sheet.cell("E1").value("Asistencias");
          
                      // Insertar datos
                      rows.forEach((row, index) => {
                          const rowIndex = index + 2;
                          sheet.cell(`A${rowIndex}`).value(row.apellidos_alumno);
                          sheet.cell(`B${rowIndex}`).value(row.nombre_alumno);
                          sheet.cell(`C${rowIndex}`).value(row.suma_total_calificaciones);
                          sheet.cell(`D${rowIndex}`).value(row.promedio);
                          sheet.cell(`E${rowIndex}`).value(row.suma_total_asistencias);
                      });
          
                      const excelBuffer = await workbook.outputAsync();
          
                      // Configurar correo
                      let transporter = nodeMailer.createTransport({
                          host: "smtp.gmail.com",
                          port: 465,
                          secure: true,
                          auth: {
                              user: "d628587@gmail.com",
                              pass: "sose ogiz orks eyvi",
                          },
                      });
          
                      // Enviar correo
                      await transporter.sendMail({
                          from: '"SmartClass" <d628587@gmail.com>',
                          to: emailUser,
                          subject: "Resumen",
                          text: `Aqui está tu resumen de ${group[0].grado} ${group[0].grupo} ${group[0].especialidad}`,
                          attachments: [{
                              filename: 'Resumen.xlsx',
                              content: excelBuffer,
                              contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                          }]
                      });
          
                      res.setHeader('Content-Disposition', 'attachment; filename="reporte.xlsx"');
                      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                      res.send(excelBuffer);
                  }
              } catch(err) {
                  console.error('Error en getResume:', err);
                  res.status(500).send(err);
              }
          };
          export const getCalifications = async (req,res) => {
            try {
                // 1. Validación de autenticación
                const authHeader = req.headers['authorization'];
                if (!authHeader) {
                    return res.status(401).send('Autorización requerida');
                }
                const base64Credentials = authHeader.split(' ')[1];
                const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
                const [emailUser, password] = credentials.split(':');
                
                // 2. Verificar usuario
                const [row] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",
                    [emailUser, password]
                );
        
                if(row.length > 0) {
                    // 3. Verificar grupo
                    const [group] = await pool.query(
                        "SELECT * FROM classrooms WHERE id = ? AND user = ?",
                        [req.params.idGroup, emailUser]
                    );
        
                    // 4. Obtener datos con el cálculo corregido del promedio
                    const [rows] = await pool.query(`
                        SELECT 
                            s.nombre AS nombre_alumno,
                            s.apellidos AS apellidos_alumno,
                            CASE 
                                WHEN COUNT(DISTINCT t.id) > 0 THEN (
                                    COALESCE(SUM(CASE 
                                        WHEN ts.final_rate IS NOT NULL THEN ts.final_rate 
                                        ELSE 0 
                                    END), 0) / COUNT(DISTINCT t.id)
                                )
                                ELSE 0 
                            END AS promedio
                        FROM 
                            students s
                        LEFT JOIN 
                            tasks t ON t.groupid = s.groupid AND t.user = s.user
                        LEFT JOIN 
                            tasks_students ts ON s.id = ts.task_for 
                            AND ts.user = s.user
                        LEFT JOIN 
                            classrooms c ON s.groupid = c.id
                        WHERE 
                            s.groupid = ? 
                            AND c.user = ?
                        GROUP BY 
                            s.id, s.nombre, s.apellidos
                        ORDER BY 
                            s.apellidos ASC
                    `, [req.params.idGroup, emailUser]);
        
                    // 5. Crear Excel
                    const workbook = await XlsxPopulate.fromBlankAsync();
                    const sheet = workbook.sheet(0);
        
                    // Establecer encabezados
                    sheet.cell("A1").value("Apellidos");
                    sheet.cell("B1").value("Nombres");
                    sheet.cell("C1").value("Calificaciones");
        
                    // Insertar datos
                    rows.forEach((row, index) => {
                        const rowIndex = index + 2;
                        sheet.cell(`A${rowIndex}`).value(row.apellidos_alumno);
                        sheet.cell(`B${rowIndex}`).value(row.nombre_alumno);
                        sheet.cell(`C${rowIndex}`).value(row.promedio);
                    });
        
                    const excelBuffer = await workbook.outputAsync();
        
                    // Configurar correo
                    let transporter = nodeMailer.createTransport({
                        host: "smtp.gmail.com",
                        port: 465,
                        secure: true,
                        auth: {
                            user: "d628587@gmail.com",
                            pass: "sose ogiz orks eyvi",
                        },
                    });
        
                    // Enviar correo
                    await transporter.sendMail({
                        from: '"SmartClass" <d628587@gmail.com>',
                        to: emailUser,
                        subject: "Calificaciones",
                        text: `Aqui están tus calificaciones de ${group[0].grado} ${group[0].grupo} ${group[0].especialidad}`,
                        attachments: [{
                            filename: 'Calificaciones.xlsx',
                            content: excelBuffer,
                            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                        }]
                    });
        
                    res.setHeader('Content-Disposition', 'attachment; filename="calificaciones.xlsx"');
                    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                    res.send(excelBuffer);
                }
            } catch(err) {
                console.error('Error en getCalifications:', err);
                res.status(500).send(err);
            }
        };

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
