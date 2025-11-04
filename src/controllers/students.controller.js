
import {pool} from "../db.js"
import nodeMailer from "nodemailer"
import QRCode from "qrcode"

export const sendQR = async(req,res)=>{
    const authHeader = req.headers['authorization'];
    const base64Credentials = authHeader.split(' ')[1]; // Obtener la parte después de "Basic"
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [emailUser, password] = credentials.split(':');
    try{
        const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[emailUser,password])

    if(row.length > 0){
const [data,info] = await pool.query("SELECT * FROM students WHERE id = ?",[req.body.idStudent])
const student = data[0]

const QRBuffer = await QRCode.toBuffer(JSON.stringify({ id: student.id }), {
    errorCorrectionLevel: 'L',
  });



    
let transporter =  nodeMailer.createTransport({
    host: "smtp.gmail.com",  // Servidor SMTP (por ejemplo: smtp.gmail.com)
    port: 465,                 // Puerto (normalmente 587 o 465 para SSL)
    secure: true,             // True para 465, false para otros puertos
    auth: {
      user: "d628587@gmail.com", // Tu correo
      pass: process.env.EMAIL_PASSWORD,         // Contraseña de tu correo
    },
  });

      // Enviar correo
      let message = await transporter.sendMail({
        from: '"SmartClass" <d628587@gmail.com>',
        to: student.correo,
        subject: `Código QR - ${student.apellidos} ${student.nombre}`,
        text: `Hola ${student.nombre},\n\nAquí está tu código QR para la clase ${student.grado} ${student.grupo} ${student.especialidad}.\n\nUsa este código para registrar tu asistencia de forma rápida y segura.\n\nSaludos,\nSmartClass`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">SmartClass</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Sistema de Gestión Académica</p>
            </div>
            
            <div style="padding: 40px 30px; background-color: white;">
              <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">¡Hola ${student.nombre}!</h2>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h3 style="color: #495057; margin: 0 0 15px 0; font-size: 18px;">📚 Información de tu clase</h3>
                <div style="display: flex; flex-wrap: wrap; gap: 15px;">
                  <div style="background-color: white; padding: 12px 16px; border-radius: 6px; border-left: 4px solid #007bff;">
                    <strong style="color: #007bff;">Grado:</strong> ${student.grado}
                  </div>
                  <div style="background-color: white; padding: 12px 16px; border-radius: 6px; border-left: 4px solid #28a745;">
                    <strong style="color: #28a745;">Grupo:</strong> ${student.grupo}
                  </div>
                  <div style="background-color: white; padding: 12px 16px; border-radius: 6px; border-left: 4px solid #ffc107;">
                    <strong style="color: #e67e22;">Especialidad:</strong> ${student.especialidad}
                  </div>
                </div>
              </div>

              <div style="text-align: center; background-color: #f8f9fa; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
                <h3 style="color: #333; margin-bottom: 20px; font-size: 20px;">📱 Tu Código QR Personal</h3>
                <p style="color: #666; margin-bottom: 20px; line-height: 1.6;">
                  Este código QR es único y personal. Úsalo para registrar tu asistencia de forma rápida y segura.
                </p>
                <div style="background-color: white; padding: 20px; border-radius: 8px; display: inline-block; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                  <p style="margin: 0; color: #28a745; font-weight: bold; font-size: 14px;">✅ Código QR adjunto como imagen</p>
                </div>
              </div>

              <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3;">
                <h4 style="color: #1976d2; margin: 0 0 10px 0; font-size: 16px;">💡 Instrucciones de uso:</h4>
                <ul style="color: #333; margin: 0; padding-left: 20px; line-height: 1.6;">
                  <li>Descarga la imagen del código QR adjunta</li>
                  <li>Muestra el código al profesor cuando se solicite</li>
                  <li>El código registrará automáticamente tu asistencia</li>
                  <li>Mantén el código seguro y no lo compartas</li>
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
        attachments: [
          {
            filename: 'mi-codigo-qr.png',
            content: QRBuffer,
            contentType: 'image/png'
          }
        ]
      });
              


    }
    res.send({response:"true"})
}catch(error){
    res.send(error)
}
}

export const createStudent = async(req,res)=>{
try {
    const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[req.body.emailUser,req.body.password])

    if(row.length > 0){

    const data= await pool.query("INSERT INTO students (nombre,apellidos,correo,especialidad,grado,grupo,user,groupid) VALUES(?,?,?,?,?,?,?,?)",
    [req.body.nombre,req.body.apellidos,req.body.correo,req.body.especialidad,req.body.grado,req.body.grupo,req.body.emailUser,req.body.groupId])
    const group = await pool.query("SELECT * FROM classrooms WHERE especialidad = ? AND grado = ? AND grupo = ? AND user = ?",
        [req.body.especialidad,req.body.grado,req.body.grupo,req.body.emailUser]
    )
    const [rows,info] = await pool.query("SELECT * FROM tasks WHERE groupid = ?",[req.body.groupId,req.body.emailUser])

    if(rows.length > 0){
rows.map((e)=>{
    pool.query("INSERT INTO tasks_students (name,rate,final_rate,task_for,user) VALUES (?,?,0,?,?)",[e.name,e.rate,data[0].insertId,req.body.emailUser])

})
    }

    await pool.query("UPDATE classrooms SET alumnos = ? WHERE especialidad = ? AND grado = ? AND grupo = ?",
        [group[0][0].alumnos+1,req.body.especialidad,req.body.grado,req.body.grupo]
    )

    const QRBuffer = await QRCode.toBuffer(JSON.stringify({ id: data[0].insertId }), {
        errorCorrectionLevel: 'L',
      });

      console.log(QRBuffer)
   

        
    let transporter =  nodeMailer.createTransport({
        host: "smtp.gmail.com",  // Servidor SMTP (por ejemplo: smtp.gmail.com)
        port: 465,                 // Puerto (normalmente 587 o 465 para SSL)
        secure: true,             // True para 465, false para otros puertos
        auth: {
          user: "d628587@gmail.com", // Tu correo
          pass: process.env.EMAIL_PASSWORD,         // Contraseña de tu correo
        },
      });


          // Enviar correo
          let message = await transporter.sendMail({
            from: '"SmartClass" <d628587@gmail.com>',
            to: req.body.correo,
            subject: `¡Bienvenido a SmartClass! - ${req.body.apellidos} ${req.body.nombre}`,
            text: `¡Hola ${req.body.nombre}!\n\n¡Bienvenido a SmartClass! Has sido registrado exitosamente en la clase ${req.body.grado} ${req.body.grupo} ${req.body.especialidad}.\n\nTu código QR personal está adjunto en este correo. Úsalo para registrar tu asistencia de forma rápida y segura.\n\n¡Que tengas un excelente período académico!\n\nSaludos,\nSmartClass`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">SmartClass</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Sistema de Gestión Académica</p>
                </div>
                
                <div style="padding: 40px 30px; background-color: white;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h2 style="color: #28a745; margin-bottom: 10px; font-size: 26px;">🎉 ¡Bienvenido ${req.body.nombre}!</h2>
                    <p style="color: #666; font-size: 16px; margin: 0;">Has sido registrado exitosamente en SmartClass</p>
                  </div>
                  
                  <div style="background-color: #f8f9fa; padding: 25px; border-radius: 12px; margin-bottom: 30px;">
                    <h3 style="color: #495057; margin: 0 0 20px 0; font-size: 18px; text-align: center;">📚 Tu información académica</h3>
                    <div style="display: grid; gap: 15px;">
                      <div style="background-color: white; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff;">
                        <strong style="color: #007bff;">👤 Nombre completo:</strong> ${req.body.nombre} ${req.body.apellidos}
                      </div>
                      <div style="background-color: white; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
                        <strong style="color: #28a745;">📧 Email:</strong> ${req.body.correo}
                      </div>
                      <div style="background-color: white; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
                        <strong style="color: #e67e22;">🎓 Clase:</strong> ${req.body.grado} ${req.body.grupo} - ${req.body.especialidad}
                      </div>
                    </div>
                  </div>

                  <div style="text-align: center; background-color: #e8f5e8; padding: 30px; border-radius: 12px; margin-bottom: 30px; border: 2px solid #28a745;">
                    <h3 style="color: #155724; margin-bottom: 15px; font-size: 20px;">📱 Tu Código QR Personal</h3>
                    <p style="color: #155724; margin-bottom: 20px; line-height: 1.6; font-weight: 500;">
                      ¡Tu código QR está listo! Este código es único y personal.
                    </p>
                    <div style="background-color: white; padding: 20px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.2);">
                      <p style="margin: 0; color: #28a745; font-weight: bold; font-size: 16px;">✅ Código QR adjunto como imagen</p>
                    </div>
                  </div>

                  <div style="background-color: #fff3cd; padding: 25px; border-radius: 8px; border-left: 4px solid #ffc107; margin-bottom: 20px;">
                    <h4 style="color: #856404; margin: 0 0 15px 0; font-size: 18px;">🚀 Primeros pasos:</h4>
                    <ol style="color: #856404; margin: 0; padding-left: 20px; line-height: 1.8;">
                      <li><strong>Descarga</strong> la imagen del código QR adjunta</li>
                      <li><strong>Guárdala</strong> en tu teléfono para fácil acceso</li>
                      <li><strong>Muestra el código</strong> al profesor para registrar asistencia</li>
                      <li><strong>Mantén el código seguro</strong> y no lo compartas con otros</li>
                    </ol>
                  </div>

                  <div style="background-color: #d1ecf1; padding: 20px; border-radius: 8px; border-left: 4px solid #17a2b8;">
                    <h4 style="color: #0c5460; margin: 0 0 10px 0; font-size: 16px;">💡 Consejos importantes:</h4>
                    <ul style="color: #0c5460; margin: 0; padding-left: 20px; line-height: 1.6;">
                      <li>El código QR es personal e intransferible</li>
                      <li>Asegúrate de tener buena iluminación al mostrar el código</li>
                      <li>Si pierdes el código, contacta a tu profesor</li>
                    </ul>
                  </div>
                </div>

                <div style="background-color: #343a40; padding: 25px; text-align: center;">
                  <h3 style="color: #28a745; margin: 0 0 10px 0; font-size: 18px;">¡Que tengas un excelente período académico! 🌟</h3>
                  <p style="color: #adb5bd; margin: 0; font-size: 14px;">
                    Este correo fue enviado automáticamente por SmartClass<br>
                    Si tienes alguna pregunta, contacta a tu profesor
                  </p>
                </div>
              </div>
            `,
            attachments: [
              {
                filename: 'mi-codigo-qr-smartclass.png',
                content: QRBuffer,
                contentType: 'image/png'
              }
            ]
          });
                  



    
    res.send(data[0])
    }
} catch (error) {
    res.send(error)
}
}

export const getStudents = async(req,res)=>{
    const authHeader = req.headers['authorization'];
    const base64Credentials = authHeader.split(' ')[1]; // Obtener la parte después de "Basic"
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [emailUser, password] = credentials.split(':');
    console.log(password)
    try{
        const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[emailUser,password])

        if(row.length > 0){
        const data = await pool.query("SELECT * FROM students WHERE groupId = ? AND user = ? ORDER BY apellidos ASC",[req.params.groupId,emailUser])
        if(data[0].length > 0){
            console.log(data[0])
            res.send(data[0])


        }
        }else{
            res.send([])
            console.log(data[0])
        }
        
    }catch(error){
res.send(error)
    }
    
    
    
}

export const getStudent = async(req,res)=>{
    const authHeader = req.headers['authorization'];
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [emailUser, password] = credentials.split(':');
    try{
        const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[emailUser,password])

        if(row.length > 0){
            const data = await pool.query("SELECT * FROM students WHERE id = ? AND user = ?",[req.params.id,emailUser])
            res.send(data[0])
        }
    }catch(error){
        res.send(error)
    }
} 


    export const getStudentByName = async(req,res)=>{
    const authHeader = req.headers['authorization'];
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [emailUser, password] = credentials.split(':');
    try{
        const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[emailUser,password])
        if(row.length > 0){
            const data = await pool.query("SELECT * FROM students WHERE apellidos LIKE CONCAT('%', ?, '%') AND groupid = ? AND user = ?",[req.params.name,req.params.groupid,emailUser])
            res.send(data[0])
        }
    }catch(error){
        res.send(error)
    }
}
export const deleteStudent = async(req,res)=>{
    try{
        const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[req.body.emailUser,req.body.password])

        if(row.length > 0){
        await pool.query("SET FOREIGN_KEY_CHECKS=0")
        const group = await pool.query("SELECT * FROM classrooms WHERE id = ?",
            [req.body.groupId]
        )
        const data = await pool.query("DELETE FROM students WHERE id = ? ",[req.params.id])
        await pool.query("UPDATE classrooms SET alumnos = ? WHERE id = ?",
            [group[0][0].alumnos-1,req.body.groupId]
        )
        await pool.query("SET FOREIGN_KEY_CHECKS=1")
        res.send(data[0])
        }
    }catch(error){
res.send(error)
    }
    
    
    
}


export const updateStudent = async(req,res)=>{
    try{
        const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[req.body.emailUser,req.body.password])

    if(row.length > 0){
        const data = await pool.query("UPDATE students SET nombre = ?, apellidos = ?, correo = ? WHERE id = ?",[req.body.nombre,req.body.apellidos,req.body.correo,req.params.id])
        res.send(data[0])
    }
    }catch(error){
res.send(error)
    }
    
    
    
}

export const attendenceStudent = async(req,res)=>{
    
    try{
        const authHeader = req.headers['authorization'];
        const base64Credentials = authHeader.split(' ')[1]; // Obtener la parte después de "Basic"
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        const [emailUser, password] = credentials.split(':');
        const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[emailUser,password])

        if(row.length > 0){
            console.log("ddd")
const [student,info] = await pool.query("SELECT * FROM students WHERE id = ? AND user = ?",[req.body.id,emailUser])

       if(student.length > 0){
        const data = await pool.query("INSERT INTO attendence (name,lastname,grade,groupStudent,area,user,attendance,studentid) VALUES(?,?,?,?,?,?,?,?) "
            ,[student[0].nombre,student[0].apellidos,student[0].grado,student[0].grupo,student[0].especialidad,emailUser,1,student[0].id])
        res.send({response:true})
       }else{
        res.send({response:false})
       }
      
        }
        console.log("aaa")
    }catch(error){
res.send(error)
console.log(error)
    }
    
    
    
}


export const getAttendenceStudent = async(req,res)=>{
    
    try{
        const authHeader = req.headers['authorization'];
        const base64Credentials = authHeader.split(' ')[1]; // Obtener la parte después de "Basic"
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        const [emailUser, password] = credentials.split(':');
        const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[emailUser,password])
        console.log("ddd")

        if(row.length > 0){
            console.log("ddd")

        const [rows,info] = await pool.query(
            "WITH RECURSIVE DateRange AS ( SELECT CURDATE() - INTERVAL 29 DAY AS `date` UNION ALL SELECT `date` + INTERVAL 1 DAY FROM DateRange WHERE `date` + INTERVAL 1 DAY <= CURDATE() ) SELECT d.`date`, COALESCE(a.`attendance`, 0) AS `attendance`, a.`name`, a.`lastname`, a.`grade`, a.`groupStudent`, a.`area`, a.`user`, a.`studentid` FROM DateRange d LEFT JOIN `attendence` a ON DATE(a.`created_at`) = d.`date` AND a.`studentid` = ? ORDER BY d.`date` DESC;"
            ,[req.params.id])
        res.send(rows)
        console.log(rows)

        }
        console.log("aa")
    }catch(error){
res.send(error)
console.log(error)
    }
    
    
    
}

export const createPermission = async(req,res)=>{
    
    try{
        const authHeader = req.headers['authorization'];
        const base64Credentials = authHeader.split(' ')[1]; // Obtener la parte después de "Basic"
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        const [emailUser, password] = credentials.split(':');
        const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[emailUser,password])
        console.log("ddd")

        if(row.length > 0){
const [rows,info] = await pool.query("INSERT INTO attendence (name,lastname,grade,groupStudent,area,user,attendance,ispermission,reason,created_at,studentid) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
    [req.body.name,req.body.lastName,req.body.grade,req.body.group,req.body.area,emailUser,1,1,req.body.reason,req.body.date,req.body.id]
)
console.log(rows)
res.send({response:true})
        }
    }catch(err){
res.send(err)
console.log(err)
    }
    }

    export const createAttendance = async(req,res)=>{
    
        try{
            const authHeader = req.headers['authorization'];
            const base64Credentials = authHeader.split(' ')[1]; // Obtener la parte después de "Basic"
            const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
            const [emailUser, password] = credentials.split(':');
            const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[emailUser,password])
            console.log("ddd")
    
            if(row.length > 0){
    const [rows,info] = await pool.query("INSERT INTO attendence (name,lastname,grade,groupStudent,area,user,attendance,created_at,studentid,ispermission) VALUES(?,?,?,?,?,?,?,?,?,?)",
        [req.body.name,req.body.lastName,req.body.grade,req.body.group,req.body.area,emailUser,1,req.body.date,req.body.id,0]
    )
    console.log(rows)
    res.send({response:true})
            }
        }catch(err){
    res.send(err)
    console.log(err)
        }
        }
    

    export const getPermissions = async(req,res)=>{
    
        try{
            const authHeader = req.headers['authorization'];
            const base64Credentials = authHeader.split(' ')[1]; // Obtener la parte después de "Basic"
            const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
            const [emailUser, password] = credentials.split(':');
            const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[emailUser,password])
            console.log("ddd")
    
            if(row.length > 0){
                console.log("ddd")
    
            const [rows,info] = await pool.query("SELECT * FROM permissions WHERE studentid = ? AND user = ?"
                ,[req.params.id,emailUser])
            res.send(rows)
            console.log(rows)
    
            }
            console.log("aa")
        }catch(error){
    res.send(error)
    console.log(error)
        }
        
        
        
    }


    export const registerFaceStudent = async(req,res)=>{
        try{
            const authHeader = req.headers['authorization'];
            const base64Credentials = authHeader.split(' ')[1]; // Obtener la parte después de "Basic"
            const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
            const [emailUser, password] = credentials.split(':');
            const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[emailUser,password])
    
            if(row.length > 0){
              const[student,info] = await pool.query("SELECT * FROM students WHERE id = ? AND user = ?",[req.body.user_id,emailUser])
              if(student.length > 0){
                
                await fetch(`https://long-badger-k1rie-6758ceec.koyeb.app/register`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        user_id: req.body.user_id,
                        embedding: req.body.embedding
                    })
                })
                .then(data => data.json())
                .then(async(data) => {
                    const [face,infoFace] = await pool.query("INSERT INTO facial_data (student_id,faiss_index_position) VALUES (?,?)",[req.body.user_id,data.new_index_position])
                    console.log(data)
                    res.send(data);
                })
                .catch(error => {
                    console.error("Error registrando cara:", error);
                })


              }else{
                res.send({response:false})
              }
            }
    
        }catch(error){
            res.send(error)
            console.log(error)
        }
    }

    export const searchFaceStudent = async(req,res)=>{
        try{
            const authHeader = req.headers['authorization'];
            const base64Credentials = authHeader.split(' ')[1]; // Obtener la parte después de "Basic"
            const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
            const [emailUser, password] = credentials.split(':');
            const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[emailUser,password])
            let filteredResults = []
            let results = null
            let match = {
                distance: null,
                studentId: null
            }
            if(row.length > 0){
    
                await fetch(`https://long-badger-k1rie-6758ceec.koyeb.app/search`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        embedding: req.body.embedding,
                        k: req.body.k
                    })
                })
                .then(data => data.json())
                .then(data => {
                    results = data.results
                    console.log(results)
                  
                })
                .catch(error => {
                    console.error("Error buscando cara:", error);
                })

                // Build dynamic query based on FAISS results
                if (results && results.length > 0) {
                    // Extract index positions from FAISS results
                    const indexPositions = results.map(result => result.index_position);
                    
                    // Create placeholders for the IN clause
                    const placeholders = indexPositions.map(() => '?').join(',');
                    
                    // Build the query with dynamic placeholders
                    const query = `SELECT s.id, s.nombre, s.apellidos, s.correo, s.especialidad, s.grado, s.grupo, s.user, s.groupid, fd.faiss_index_position 
                                   FROM facial_data AS fd 
                                   INNER JOIN students AS s ON fd.student_id = s.id 
                                   WHERE s.groupid = ? AND s.user = ? AND fd.faiss_index_position IN (${placeholders})`;
                    
                    // Prepare parameters: groupId, user, and all index positions
                    const params = [req.body.groupId, emailUser, ...indexPositions];
                    
                    const [face, infoFace] = await pool.query(query, params);
                    
                    console.log("Query results:", face);
                    
                    // Process results and find best match
                    if (face.length > 0) {
                        // Find the student with the best (lowest) distance
                        let bestMatch = null;
                        let bestDistance = Infinity;
                        
                        face.forEach(student => {
                            const faissResult = results.find(r => r.index_position === student.faiss_index_position);
                            if (faissResult && faissResult.distance < bestDistance) {
                                bestDistance = faissResult.distance;
                                bestMatch = student;
                            }
                        });
                        
                        if (bestMatch && bestDistance < 0.3) {
                            console.log("Best match found:", bestMatch);
                            res.json(bestMatch);
                        } else {
                            res.json({ message: "No student found" });
                        }
                    } else {
                        res.json({ message: "No student found" });
                    }
                } else {
                    res.json({ message: "No FAISS results" });
                }
             

            }
    
        }catch(error){
            res.send(error)
            console.log(error)
        }
    }

    export const deleteFaceStudent = async(req,res)=>{
        try{
            const [face,infoFace] = await pool.query("DELETE FROM facial_data WHERE student_id = ?",[req.body.user_id])
            console.log(face)
            res.send({response:true})
        }catch(error){
            res.send({response:false})
        }
    }

    export const getAllStudentsGrades = async(req,res)=>{
        try{
            const authHeader = req.headers['authorization'];
            const base64Credentials = authHeader.split(' ')[1];
            const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
            const [emailUser, password] = credentials.split(':');
            
            const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[emailUser,password])

            if(row.length > 0){
                // Get all students with their grades for a specific group
                const [grades,info] = await pool.query(`
                    SELECT 
                        s.id as student_id,
                        s.nombre,
                        s.apellidos,
                        s.especialidad,
                        s.grado,
                        s.grupo,
                        ts.name as task_name,
                        ts.rate as task_rate,
                        ts.final_rate as final_grade,
                        ts.created_at as grade_date
                    FROM students s
                    LEFT JOIN tasks_students ts ON s.id = ts.task_for
                    WHERE s.groupid = ? AND s.user = ?
                    ORDER BY s.apellidos, s.nombre, ts.name
                `, [req.params.groupId, emailUser])
                
                // Group grades by student for better organization
                const studentsWithGrades = {};
                
                grades.forEach(grade => {
                    const studentId = grade.student_id;
                    
                    if (!studentsWithGrades[studentId]) {
                        studentsWithGrades[studentId] = {
                            student_id: grade.student_id,
                            nombre: grade.nombre,
                            apellidos: grade.apellidos,
                            especialidad: grade.especialidad,
                            grado: grade.grado,
                            grupo: grade.grupo,
                            grades: []
                        };
                    }
                    
                    if (grade.task_name) {
                        studentsWithGrades[studentId].grades.push({
                            task_name: grade.task_name,
                            task_rate: grade.task_rate,
                            final_grade: grade.final_grade,
                            grade_date: grade.grade_date
                        });
                    }
                });
                
                // Convert to array format
                const result = Object.values(studentsWithGrades);
                
                res.send(result);
            } else {
                res.send([]);
            }
        } catch(error) {
            res.send(error);
        }
    }

    export const sendMessageToStudent = async(req,res)=>{
        try{
            const authHeader = req.headers['authorization'];
            const base64Credentials = authHeader.split(' ')[1];
            const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
            const [emailUser, password] = credentials.split(':');
            
            const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[emailUser,password])

            if(row.length > 0){
                // Get student and classroom information
                const [studentData] = await pool.query("SELECT * FROM students WHERE id = ? AND user = ?",[req.body.studentId, emailUser])
                
                if(studentData.length > 0){
                    const student = studentData[0];
                    const [classroomData] = await pool.query("SELECT * FROM classrooms WHERE id = ? AND user = ?",[student.groupid, emailUser])
                    
                    if(classroomData.length > 0){
                        const classroom = classroomData[0];
                        
                        // Configure email transporter
                        let transporter = nodeMailer.createTransport({
                            host: "smtp.gmail.com",
                            port: 465,
                            secure: true,
                            auth: {
                                user: "d628587@gmail.com",
                                pass: process.env.EMAIL_PASSWORD,
                            },
                        });

                        // Format the email subject and body according to requirements
                        const classInfo = `${classroom.grado} ${classroom.grupo} ${classroom.especialidad}`;
                        const emailSubject = `Mensaje de la clase ${classInfo}`;
                        const emailBody = `De la clase ${classInfo}: ${req.body.message}`;

                        // Send email
                        await transporter.sendMail({
                            from: '"SmartClass" <d628587@gmail.com>',
                            to: student.correo,
                            subject: emailSubject,
                            text: emailBody,
                            html: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                                        <h2 style="color: #333; margin-bottom: 20px;">Mensaje de tu clase</h2>
                                        <div style="background-color: white; padding: 20px; border-radius: 6px; border-left: 4px solid #007bff;">
                                            <p style="margin: 0; color: #666; font-size: 14px; margin-bottom: 10px;">
                                                <strong>De la clase:</strong> ${classInfo}
                                            </p>
                                            <div style="color: #333; font-size: 16px; line-height: 1.5;">
                                                ${req.body.message.replace(/\n/g, '<br>')}
                                            </div>
                                        </div>
                                        <p style="color: #888; font-size: 12px; margin-top: 20px; text-align: center;">
                                            Este mensaje fue enviado desde SmartClass
                                        </p>
                                    </div>
                                </div>
                            `
                        });

                        res.send({success: true, message: "Mensaje enviado correctamente"});
                    } else {
                        res.status(404).send({success: false, message: "Aula no encontrada"});
                    }
                } else {
                    res.status(404).send({success: false, message: "Estudiante no encontrado"});
                }
            } else {
                res.status(401).send({success: false, message: "Credenciales inválidas"});
            }
        } catch(error) {
            console.error('Error sending message:', error);
            res.status(500).send({success: false, message: "Error al enviar mensaje", error: error.message});
        }
    }