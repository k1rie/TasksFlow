
import {pool} from "../db.js"
import nodeMailer from "nodemailer"
import QRCode from "qrcode"

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

    const QRBuffer = await QRCode.toBuffer(`https://tasks-flow-b44f6.web.app/attendance/${data[0].insertId}/${req.body.nombre}/${req.body.apellidos}/${req.body.grado}/${req.body.grupo}/${req.body.especialidad}/${req.body.correo}`, {
        errorCorrectionLevel: 'L', // Nivel de corrección de errores
      });

      console.log(QRBuffer)
   

        
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
          let message = await transporter.sendMail({
            from: '"Remitente" <d628587@gmail.com>',
            to: req.body.correo,
            subject: "QR",
            text: `Aquí está tu código QR en formato PNG para la clase ${req.body.grado} ${req.body.grupo} ${req.body.especialidad}`,
            attachments: [
              {
                filename: 'qrcode.png', // Nombre del archivo adjunto
                content: QRBuffer,      // Contenido del archivo como buffer
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
        const data = await pool.query("SELECT * FROM students WHERE groupId = ? AND user = ?",[req.params.groupId,emailUser])
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
    const base64Credentials = authHeader.split(' ')[1]; // Obtener la parte después de "Basic"
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

        const data = await pool.query("INSERT INTO attendence (name,lastname,grade,groupStudent,area,user,attendance,studentid) VALUES(?,?,?,?,?,?,?,?) "
            ,[req.body.name,req.body.lastName,req.body.grade,req.body.group,req.body.area,emailUser,1,req.body.id])
        res.send({response:true})
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
            "SELECT fechas.dia AS created_at, COALESCE(att.attendance, 0) AS attendance, att.name, att.lastname, att.grade, att.groupStudent, att.area, att.user FROM (SELECT DISTINCT DATE(created_at) AS dia FROM attendence WHERE studentid = ? AND user = ? ORDER BY dia DESC LIMIT 30) AS ultimas_fechas RIGHT JOIN (SELECT CURDATE() - INTERVAL n.n DAY AS dia FROM (SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS nums1 CROSS JOIN (SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS nums2 ORDER BY dia DESC LIMIT 30) AS fechas ON ultimas_fechas.dia = fechas.dia LEFT JOIN attendence AS att ON DATE(att.created_at) = fechas.dia AND att.studentid = ? AND att.name = ? AND att.lastname = ? AND att.grade = ? AND att.groupStudent = ? AND att.area = ? AND att.user = ? ORDER BY fechas.dia DESC; "
            ,[req.params.id,emailUser,req.params.name,req.params.lastName,req.params.grade,req.params.group,req.params.area,emailUser])
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
const [rows,info] = await pool.query("INSERT INTO permissions (name,lastname,grade,groupStudent,area,user,permission,reason,created_at,studentid) VALUES(?,?,?,?,?,?,?,?,?,?)",
    [req.body.name,req.body.lastName,req.body.grade,req.body.group,req.body.area,emailUser,1,req.body.reason,req.body.date,req.body.id]
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
    const [rows,info] = await pool.query("INSERT INTO attendence (name,lastname,grade,groupStudent,area,user,attendance,created_at,studentid) VALUES(?,?,?,?,?,?,?,?,?)",
        [req.body.name,req.body.lastName,req.body.grade,req.body.group,req.body.area,emailUser,1,req.body.date,req.body.id]
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


    
