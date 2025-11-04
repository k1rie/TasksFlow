import {pool} from "../db.js"
import nodeMailer from "nodemailer"
import QRCode from "qrcode"
import XlsxPopulate from "xlsx-populate"
import { createStudent } from "./students.controller.js";
import crypto from "crypto";

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

// Utilidad para cifrar datos del QR con AES-256-GCM
function encryptQrData(payloadObject) {
  const secretRaw = process.env.QR_SECRET || "smartclass-default-secret";
  const key = crypto.createHash("sha256").update(secretRaw).digest(); // 32 bytes
  const iv = crypto.randomBytes(12); // GCM recomienda 12 bytes
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(payloadObject), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // iv.tag.ciphertext en base64
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
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
                    
                    const qrPayload = JSON.stringify({ id: data.insertId });
                    const QRBuffer = await QRCode.toBuffer(qrPayload, { errorCorrectionLevel: 'L' });
                    
                    // Configurar el transporter
                    const transporter = nodeMailer.createTransport({
                        host: "smtp.gmail.com",
                        port: 465,
                        secure: true,
                        auth: {
                            user: "d628587@gmail.com",
                            pass: process.env.EMAIL_PASSWORD
                        }
                    });
                    
                    // Verificar que el correo es válido antes de enviar
                    if (student.correo && student.correo.trim().length > 0 && student.correo.includes('@')) {
                        try {
                            await transporter.sendMail({
                                from: '"SmartClass" <d628587@gmail.com>',
                                to: student.correo.trim(),
                                subject: `¡Bienvenido a tu nueva clase! - ${student.apellidos} ${student.nombre}`,
                                text: `¡Hola ${student.nombre}!\n\n¡Has sido transferido exitosamente a una nueva clase en SmartClass!\n\nTu nueva clase: ${newGroup[0].grado} ${newGroup[0].grupo} ${newGroup[0].especialidad}\n\nTu código QR personal está adjunto en este correo. Úsalo para registrar tu asistencia de forma rápida y segura.\n\n¡Que tengas un excelente período académico en tu nueva clase!\n\nSaludos,\nSmartClass`,
                                html: `
                                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
                                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                                      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">SmartClass</h1>
                                      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Sistema de Gestión Académica</p>
                                    </div>
                                    
                                    <div style="padding: 40px 30px; background-color: white;">
                                      <div style="text-align: center; margin-bottom: 30px;">
                                        <h2 style="color: #007bff; margin-bottom: 10px; font-size: 26px;">🔄 ¡Bienvenido a tu nueva clase ${student.nombre}!</h2>
                                        <p style="color: #666; font-size: 16px; margin: 0;">Has sido transferido exitosamente</p>
                                      </div>
                                      
                                      <div style="background-color: #e3f2fd; padding: 25px; border-radius: 12px; margin-bottom: 30px; border: 2px solid #2196f3;">
                                        <h3 style="color: #1565c0; margin: 0 0 20px 0; font-size: 18px; text-align: center;">📚 Tu nueva información académica</h3>
                                        <div style="display: grid; gap: 15px;">
                                          <div style="background-color: white; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff;">
                                            <strong style="color: #007bff;">👤 Nombre:</strong> ${student.nombre} ${student.apellidos}
                                          </div>
                                          <div style="background-color: white; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
                                            <strong style="color: #28a745;">🎓 Nueva clase:</strong> ${newGroup[0].grado} ${newGroup[0].grupo} - ${newGroup[0].especialidad}
                                          </div>
                                          <div style="background-color: white; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
                                            <strong style="color: #e67e22;">📧 Email:</strong> ${student.correo}
                                          </div>
                                        </div>
                                      </div>

                                      <div style="text-align: center; background-color: #f8f9fa; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
                                        <h3 style="color: #333; margin-bottom: 20px; font-size: 20px;">📱 Tu Código QR Actualizado</h3>
                                        <p style="color: #666; margin-bottom: 20px; line-height: 1.6;">
                                          Tu código QR ha sido actualizado para tu nueva clase. Úsalo para registrar tu asistencia.
                                        </p>
                                        <div style="background-color: white; padding: 20px; border-radius: 8px; display: inline-block; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                                          <p style="margin: 0; color: #28a745; font-weight: bold; font-size: 14px;">✅ Código QR adjunto como imagen</p>
                                        </div>
                                      </div>

                                      <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107;">
                                        <h4 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">📋 Importante:</h4>
                                        <ul style="color: #856404; margin: 0; padding-left: 20px; line-height: 1.6;">
                                          <li>Este es tu nuevo código QR para la nueva clase</li>
                                          <li>Reemplaza cualquier código QR anterior que tengas</li>
                                          <li>Guarda la nueva imagen en tu teléfono</li>
                                          <li>Si tienes dudas, contacta a tu profesor</li>
                                        </ul>
                                      </div>
                                    </div>

                                    <div style="background-color: #343a40; padding: 20px; text-align: center;">
                                      <p style="color: #adb5bd; margin: 0; font-size: 14px;">
                                        Este correo fue enviado automáticamente por SmartClass<br>
                                        Si tienes alguna pregunta, contacta a tu profesor
                                      </p>
                                    </div>
                                  </div>
                                `,
                                attachments: [{
                                    filename: 'codigo-qr-smartclass.png',
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
                      pass: process.env.EMAIL_PASSWORD,
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
                              COALESCE(SUM(DISTINCT ts.final_rate), 0) AS suma_total_calificaciones,
                              CASE 
                                  WHEN COUNT(DISTINCT CASE WHEN ts.final_rate IS NOT NULL THEN ts.id END) > 0 
                                  THEN COALESCE(SUM(DISTINCT ts.final_rate), 0) / COUNT(DISTINCT CASE WHEN ts.final_rate IS NOT NULL THEN ts.id END)
                                  ELSE 0 
                              END AS promedio,
                              COUNT(DISTINCT CASE WHEN ts.final_rate IS NOT NULL THEN ts.id END) AS numero_tareas,
                              (SELECT COUNT(DISTINCT a2.id) 
                               FROM attendence a2 
                               WHERE a2.studentid = s.id AND a2.attendance = 1) AS suma_total_asistencias
                          FROM 
                              students s
                          LEFT JOIN 
                              tasks_students ts ON s.id = ts.task_for AND ts.user = s.user
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
                              pass: process.env.EMAIL_PASSWORD,
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
                                WHEN COUNT(DISTINCT CASE WHEN ts.final_rate IS NOT NULL THEN ts.id END) > 0 THEN (
                                    COALESCE(SUM(CASE 
                                        WHEN ts.final_rate IS NOT NULL THEN ts.final_rate 
                                        ELSE 0 
                                    END), 0) / COUNT(DISTINCT CASE WHEN ts.final_rate IS NOT NULL THEN ts.id END)
                                )
                                ELSE 0 
                            END AS promedio
                        FROM 
                            students s
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
                            pass: process.env.EMAIL_PASSWORD,
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

            // Generar enlace único para compartir calificaciones
            export const generateGroupLink = async (req, res) => {
              try {
                // 1. Validación de autenticación
                const authHeader = req.headers['authorization'];
                if (!authHeader) {
                  return res.status(401).json({ error: 'Autorización requerida' });
                }
                
                const base64Credentials = authHeader.split(' ')[1];
                const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
                const [emailUser, password] = credentials.split(':');
                
                // 2. Verificar usuario (profesor)
                const [userRow] = await pool.query(
                  "SELECT * FROM users WHERE email = ? AND password = ?",
                  [emailUser, password]
                );
                
                if (userRow.length === 0) {
                  return res.status(401).json({ error: 'Credenciales inválidas' });
                }
                
                // 3. Validar que el grupo existe y pertenece al profesor
                const { groupId } = req.body;
                if (!groupId) {
                  return res.status(400).json({ error: 'groupId es requerido' });
                }
                
                const [groupRow] = await pool.query(
                  "SELECT * FROM classrooms WHERE id = ? AND user = ?",
                  [groupId, emailUser]
                );
                
                if (groupRow.length === 0) {
                  return res.status(403).json({ error: 'No tienes permiso para generar enlaces para este grupo' });
                }
                
                // 4. Generar hash único (usando crypto para mayor seguridad)
                const hash = crypto.randomBytes(32).toString('hex');
                
                // 5. Verificar que el hash no existe (extremadamente improbable, pero por seguridad)
                let attempts = 0;
                let finalHash = hash;
                while (attempts < 5) {
                  const [existingLink] = await pool.query(
                    "SELECT * FROM group_links WHERE hash = ?",
                    [finalHash]
                  );
                  
                  if (existingLink.length === 0) {
                    break;
                  }
                  
                  finalHash = crypto.randomBytes(32).toString('hex');
                  attempts++;
                }
                
                // 6. Insertar el enlace en la base de datos
                const [insertResult] = await pool.query(
                  "INSERT INTO group_links (group_id, hash, created_by) VALUES (?, ?, ?)",
                  [groupId, finalHash, emailUser]
                );
                
                // 7. Obtener información del grupo
                const group = groupRow[0];
                const groupName = `${group.grado}° ${group.grupo} - ${group.especialidad}`;
                
                // 8. Construir la URL completa (usando el dominio desde el frontend o variables de entorno)
                const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
                const fullLink = `${baseUrl}/#/grades/${finalHash}`;
                
                // 9. Retornar respuesta
                res.json({
                  success: true,
                  link: {
                    id: insertResult.insertId,
                    hash: finalHash,
                    fullLink: fullLink,
                    groupId: groupId,
                    groupName: groupName,
                    createdAt: new Date().toISOString(),
                    createdBy: emailUser
                  }
                });
              } catch (error) {
                console.error('Error en generateGroupLink:', error);
                res.status(500).json({ 
                  error: 'Error al generar enlace',
                  details: error.message 
                });
              }
            };

            // Obtener enlaces generados por un profesor
            export const getGroupLinks = async (req, res) => {
              try {
                // 1. Validación de autenticación
                const authHeader = req.headers['authorization'];
                if (!authHeader) {
                  return res.status(401).json({ error: 'Autorización requerida' });
                }
                
                const base64Credentials = authHeader.split(' ')[1];
                const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
                const [emailUser, password] = credentials.split(':');
                
                // 2. Verificar usuario (profesor)
                const [userRow] = await pool.query(
                  "SELECT * FROM users WHERE email = ? AND password = ?",
                  [emailUser, password]
                );
                
                if (userRow.length === 0) {
                  return res.status(401).json({ error: 'Credenciales inválidas' });
                }
                
                // 3. Obtener todos los enlaces generados por este profesor con información del grupo
                const [links] = await pool.query(`
                  SELECT 
                    gl.id,
                    gl.hash,
                    gl.group_id,
                    gl.created_at,
                    gl.last_accessed_at,
                    gl.access_count,
                    c.grado,
                    c.grupo,
                    c.especialidad,
                    CONCAT(c.grado, '° ', c.grupo, ' - ', c.especialidad) AS group_name
                  FROM group_links gl
                  INNER JOIN classrooms c ON gl.group_id = c.id
                  WHERE gl.created_by = ?
                  ORDER BY gl.created_at DESC
                `, [emailUser]);
                
                // 4. Construir URLs completas
                const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
                const linksWithUrls = links.map(link => ({
                  id: link.id,
                  hash: link.hash,
                  groupId: link.group_id,
                  groupName: link.group_name,
                  fullLink: `${baseUrl}/#/grades/${link.hash}`,
                  createdAt: link.created_at,
                  lastAccessedAt: link.last_accessed_at,
                  accessCount: link.access_count || 0
                }));
                
                res.json({
                  success: true,
                  links: linksWithUrls
                });
              } catch (error) {
                console.error('Error en getGroupLinks:', error);
                res.status(500).json({ 
                  error: 'Error al obtener enlaces',
                  details: error.message 
                });
              }
            };

            // Obtener calificaciones por hash (endpoint público)
            export const getGradesByHash = async (req, res) => {
              try {
                const { hash } = req.params;
                
                if (!hash) {
                  return res.status(400).json({ error: 'Hash es requerido' });
                }
                
                // 1. Verificar que el hash existe
                const [linkRow] = await pool.query(
                  "SELECT * FROM group_links WHERE hash = ?",
                  [hash]
                );
                
                if (linkRow.length === 0) {
                  // Protección contra enumeración: no revelar si el hash existe o no
                  return res.status(404).json({ 
                    error: 'Enlace no válido o expirado' 
                  });
                }
                
                const link = linkRow[0];
                const groupId = link.group_id;
                
                // 2. Actualizar estadísticas de acceso
                await pool.query(
                  "UPDATE group_links SET last_accessed_at = NOW(), access_count = access_count + 1 WHERE hash = ?",
                  [hash]
                );
                
                // 3. Obtener información del grupo (solo datos públicos)
                const [groupRow] = await pool.query(
                  "SELECT grado, grupo, especialidad FROM classrooms WHERE id = ?",
                  [groupId]
                );
                
                if (groupRow.length === 0) {
                  return res.status(404).json({ error: 'Grupo no encontrado' });
                }
                
                const group = groupRow[0];
                const groupName = `${group.grado}° ${group.grupo} - ${group.especialidad}`;
                
                // 4. Obtener estudiantes del grupo con suma de calificaciones
                const [students] = await pool.query(`
                  SELECT 
                    s.id,
                    s.nombre,
                    s.apellidos,
                    COALESCE(SUM(CASE 
                      WHEN ts.final_rate IS NOT NULL THEN ts.final_rate 
                      ELSE 0 
                    END), 0) AS suma_total,
                    COUNT(DISTINCT CASE WHEN ts.final_rate IS NOT NULL THEN ts.id END) AS numero_tareas
                  FROM 
                    students s
                  LEFT JOIN 
                    tasks_students ts ON s.id = ts.task_for 
                  WHERE 
                    s.groupid = ?
                  GROUP BY 
                    s.id, s.nombre, s.apellidos
                  ORDER BY 
                    s.apellidos ASC, s.nombre ASC
                `, [groupId]);
                
                // 5. Obtener detalles de tareas y calificaciones (limitado a información no sensible)
                const [tasks] = await pool.query(
                  "SELECT id, name, rate FROM tasks WHERE groupid = ? ORDER BY id ASC",
                  [groupId]
                );
                
                // Para cada estudiante, obtener sus calificaciones por tarea
                const studentsWithGrades = await Promise.all(
                  students.map(async (student) => {
                    const [grades] = await pool.query(
                      "SELECT name, final_rate FROM tasks_students WHERE task_for = ? AND final_rate IS NOT NULL",
                      [student.id]
                    );
                    
                    return {
                      id: student.id,
                      nombre: student.nombre,
                      apellidos: student.apellidos,
                      total: parseFloat(student.suma_total).toFixed(2),
                      numeroTareas: student.numero_tareas,
                      calificaciones: grades.map(g => ({
                        tarea: g.name,
                        calificacion: parseFloat(g.final_rate).toFixed(2)
                      }))
                    };
                  })
                );
                
                // 6. Retornar respuesta (sin información sensible como emails, IDs internos, etc.)
                res.json({
                  success: true,
                  group: {
                    nombre: groupName,
                    grado: group.grado,
                    grupo: group.grupo,
                    especialidad: group.especialidad
                  },
                  students: studentsWithGrades,
                  tasks: tasks.map(t => ({
                    nombre: t.name,
                    valor: parseFloat(t.rate).toFixed(2)
                  })),
                  linkInfo: {
                    createdAt: link.created_at,
                    accessCount: (link.access_count || 0) + 1
                  }
                });
              } catch (error) {
                console.error('Error en getGradesByHash:', error);
                res.status(500).json({ 
                  error: 'Error al obtener calificaciones',
                  details: error.message 
                });
              }
            };

            // Eliminar enlace único
            export const deleteGroupLink = async (req, res) => {
              try {
                // 1. Validación de autenticación
                const authHeader = req.headers['authorization'];
                if (!authHeader) {
                  return res.status(401).json({ error: 'Autorización requerida' });
                }
                
                const base64Credentials = authHeader.split(' ')[1];
                const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
                const [emailUser, password] = credentials.split(':');
                
                // 2. Verificar usuario (profesor)
                const [userRow] = await pool.query(
                  "SELECT * FROM users WHERE email = ? AND password = ?",
                  [emailUser, password]
                );
                
                if (userRow.length === 0) {
                  return res.status(401).json({ error: 'Credenciales inválidas' });
                }
                
                // 3. Obtener el ID del enlace desde los parámetros
                const { linkId } = req.params;
                if (!linkId) {
                  return res.status(400).json({ error: 'linkId es requerido' });
                }
                
                // 4. Verificar que el enlace existe y pertenece al profesor
                const [linkRow] = await pool.query(
                  "SELECT * FROM group_links WHERE id = ? AND created_by = ?",
                  [linkId, emailUser]
                );
                
                if (linkRow.length === 0) {
                  return res.status(403).json({ 
                    error: 'No tienes permiso para eliminar este enlace o el enlace no existe' 
                  });
                }
                
                // 5. Eliminar el enlace
                await pool.query(
                  "DELETE FROM group_links WHERE id = ? AND created_by = ?",
                  [linkId, emailUser]
                );
                
                // 6. Retornar respuesta exitosa
                res.json({
                  success: true,
                  message: 'Enlace eliminado exitosamente'
                });
              } catch (error) {
                console.error('Error en deleteGroupLink:', error);
                res.status(500).json({ 
                  error: 'Error al eliminar enlace',
                  details: error.message 
                });
              }
            };

// Generar enlace único para solicitar unión al grupo (profesor)
export const generateJoinLink = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'Autorización requerida' });
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [emailUser, password] = credentials.split(':');

    const [userRow] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?", [emailUser, password]);
    if (userRow.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });

    const { groupId } = req.body;
    if (!groupId) return res.status(400).json({ error: 'groupId es requerido' });

    const [groupRow] = await pool.query("SELECT * FROM classrooms WHERE id = ? AND user = ?", [groupId, emailUser]);
    if (groupRow.length === 0) return res.status(403).json({ error: 'No tienes permiso para este grupo' });

    let finalHash = crypto.randomBytes(32).toString('hex');
    for (let i = 0; i < 5; i++) {
      const [existing] = await pool.query("SELECT id FROM join_links WHERE hash = ?", [finalHash]);
      if (existing.length === 0) break;
      finalHash = crypto.randomBytes(32).toString('hex');
    }

    const [insert] = await pool.query(
      "INSERT INTO join_links (group_id, hash, created_by) VALUES (?,?,?)",
      [groupId, finalHash, emailUser]
    );

    const group = groupRow[0];
    const groupName = `${group.grado}° ${group.grupo} - ${group.especialidad}`;
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const fullLink = `${baseUrl}/#/join/${finalHash}`;

    res.json({
      success: true,
      link: {
        id: insert.insertId,
        hash: finalHash,
        fullLink,
        groupId,
        groupName,
        createdAt: new Date().toISOString(),
        createdBy: emailUser,
      }
    });
  } catch (error) {
    console.error('Error en generateJoinLink:', error);
    res.status(500).json({ error: 'Error al generar enlace de unión', details: error.message });
  }
};

// Enviar solicitud pública de unión por hash
export const submitJoinRequest = async (req, res) => {
  try {
    const { hash } = req.params;
    const { nombre, apellidos, correo } = req.body;
    if (!hash) return res.status(400).json({ error: 'Hash requerido' });
    if (!nombre || !apellidos || !correo) return res.status(400).json({ error: 'Datos incompletos' });

    const [linkRow] = await pool.query("SELECT * FROM join_links WHERE hash = ?", [hash]);
    if (linkRow.length === 0) return res.status(404).json({ error: 'Enlace no válido' });

    const groupId = linkRow[0].group_id;
    const [groupRow] = await pool.query("SELECT grado, grupo, especialidad FROM classrooms WHERE id = ?", [groupId]);
    if (groupRow.length === 0) return res.status(404).json({ error: 'Grupo no encontrado' });
    const g = groupRow[0];

    await pool.query(
      `INSERT INTO student_join_requests (group_id, nombre, apellidos, correo, grado, grupo, especialidad)
       VALUES (?,?,?,?,?,?,?)`,
      [groupId, nombre, apellidos, correo, g.grado, g.grupo, g.especialidad]
    );

    res.json({ success: true, message: 'Solicitud enviada' });
  } catch (error) {
    console.error('Error en submitJoinRequest:', error);
    res.status(500).json({ error: 'Error al enviar solicitud', details: error.message });
  }
};

// Listar solicitudes por grupo (profesor)
export const getJoinRequests = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'Autorización requerida' });
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [emailUser, password] = credentials.split(':');
    const [userRow] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?", [emailUser, password]);
    if (userRow.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });

    const { groupId } = req.params;
    const [groupRow] = await pool.query("SELECT id FROM classrooms WHERE id = ? AND user = ?", [groupId, emailUser]);
    if (groupRow.length === 0) return res.status(403).json({ error: 'Sin permiso para este grupo' });

    const [rows] = await pool.query(
      `SELECT id, nombre, apellidos, correo, status, created_at
       FROM student_join_requests WHERE group_id = ? AND status = 'pending' ORDER BY created_at DESC`,
      [groupId]
    );

    res.json({ success: true, requests: rows });
  } catch (error) {
    console.error('Error en getJoinRequests:', error);
    res.status(500).json({ error: 'Error al obtener solicitudes', details: error.message });
  }
};

// Aprobar solicitud: crea estudiante y marca como aprobada
export const approveJoinRequest = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'Autorización requerida' });
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [emailUser, password] = credentials.split(':');
    const [userRow] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?", [emailUser, password]);
    if (userRow.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });

    const { id } = req.params;
    const [reqRow] = await pool.query("SELECT * FROM student_join_requests WHERE id = ? AND status = 'pending'", [id]);
    if (reqRow.length === 0) return res.status(404).json({ error: 'Solicitud no encontrada' });
    const r = reqRow[0];

    // Verificar propiedad del grupo
    const [groupRow] = await pool.query("SELECT * FROM classrooms WHERE id = ? AND user = ?", [r.group_id, emailUser]);
    if (groupRow.length === 0) return res.status(403).json({ error: 'Sin permiso para este grupo' });

    // Crear estudiante
    const [insertStudent] = await pool.query(
      `INSERT INTO students (nombre, apellidos, correo, especialidad, grado, grupo, user, groupid)
       VALUES (?,?,?,?,?,?,?,?)`,
      [r.nombre, r.apellidos, r.correo, r.especialidad, r.grado, r.grupo, emailUser, r.group_id]
    );

    // Inicializar tasks_students en 0 para tareas existentes del grupo (opcional)
    const [tasks] = await pool.query("SELECT name, rate FROM tasks WHERE groupid = ? AND user = ?", [r.group_id, emailUser]);
    if (tasks.length > 0) {
      await Promise.all(tasks.map(t => pool.query(
        "INSERT INTO tasks_students (name, rate, final_rate, task_for, user) VALUES (?,?,0,?,?)",
        [t.name, t.rate, insertStudent.insertId, emailUser]
      )));
    }

    // Actualizar alumnos del grupo
    await pool.query("UPDATE classrooms SET alumnos = alumnos + 1 WHERE id = ?", [r.group_id]);

    // Generar QR sin datos sensibles (JSON) para el alumno aprobado
    let qrBuffer = null;
    try {
      const qrPayload = JSON.stringify({ id: insertStudent.insertId });
      qrBuffer = await QRCode.toBuffer(qrPayload, { errorCorrectionLevel: 'L' });
    } catch (e) {
      console.error('Error generando QR:', e);
    }

    // Marcar solicitud como aprobada
    await pool.query(
      "UPDATE student_join_requests SET status='approved', processed_at=NOW(), processed_by=? WHERE id = ?",
      [emailUser, id]
    );

    // Enviar correo de confirmación al alumno con QR adjunto
    try {
      const transporter = nodeMailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: "d628587@gmail.com", pass: process.env.EMAIL_PASSWORD }
      });

      const group = groupRow[0];
      const mailOptions = {
        from: '"SmartClass" <d628587@gmail.com>',
        to: r.correo,
        subject: `Solicitud aprobada - ${r.apellidos} ${r.nombre}`,
        html: `<p>Hola ${r.nombre},</p>
               <p>Tu solicitud para unirte al grupo ${group.grado}° ${group.grupo} - ${group.especialidad} ha sido <strong>aprobada</strong>.</p>
               <p>Adjuntamos tu código QR personal para registrar asistencia. Guárdalo en tu teléfono.</p>
               <p>Saludos,<br/>SmartClass</p>`,
        attachments: qrBuffer ? [{ filename: 'codigo-qr-smartclass.png', content: qrBuffer, contentType: 'image/png' }] : []
      };
      await transporter.sendMail(mailOptions);
    } catch (e) {
      console.error('Error enviando correo de aprobación:', e);
    }

    res.json({ success: true, message: 'Solicitud aprobada y alumno agregado' });
  } catch (error) {
    console.error('Error en approveJoinRequest:', error);
    res.status(500).json({ error: 'Error al aprobar solicitud', details: error.message });
  }
};

// Rechazar solicitud
export const rejectJoinRequest = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'Autorización requerida' });
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [emailUser, password] = credentials.split(':');
    const [userRow] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?", [emailUser, password]);
    if (userRow.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });

    const { id } = req.params;
    const [reqRow] = await pool.query("SELECT * FROM student_join_requests WHERE id = ? AND status = 'pending'", [id]);
    if (reqRow.length === 0) return res.status(404).json({ error: 'Solicitud no encontrada' });

    // Verificar propiedad del grupo
    const [groupRow] = await pool.query("SELECT * FROM classrooms WHERE id = ? AND user = ?", [reqRow[0].group_id, emailUser]);
    if (groupRow.length === 0) return res.status(403).json({ error: 'Sin permiso para este grupo' });

    await pool.query(
      "UPDATE student_join_requests SET status='rejected', processed_at=NOW(), processed_by=? WHERE id = ?",
      [emailUser, id]
    );

    // Enviar correo de rechazo al alumno
    try {
      const transporter = nodeMailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: "d628587@gmail.com", pass: process.env.EMAIL_PASSWORD }
      });

      const rj = reqRow[0];
      await transporter.sendMail({
        from: '"SmartClass" <d628587@gmail.com>',
        to: rj.correo,
        subject: `Solicitud rechazada - ${rj.apellidos} ${rj.nombre}`,
        html: `<p>Hola ${rj.nombre},</p>
               <p>Tu solicitud para unirte al grupo ha sido <strong>rechazada</strong>.</p>
               <p>Si crees que se trata de un error, contacta a tu profesor.</p>
               <p>Saludos,<br/>SmartClass</p>`
      });
    } catch (e) {
      console.error('Error enviando correo de rechazo:', e);
    }

    res.json({ success: true, message: 'Solicitud rechazada' });
  } catch (error) {
    console.error('Error en rejectJoinRequest:', error);
    res.status(500).json({ error: 'Error al rechazar solicitud', details: error.message });
  }
};
