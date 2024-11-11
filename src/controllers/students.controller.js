
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

const QRBuffer = await QRCode.toBuffer(`https://tasks-flow-b44f6.web.app/attendance/${student.id}/${student.nombre}/${student.apellidos}/${student.grado}/${student.grupo}/${student.especialidad}/${student.correo}`, {
    errorCorrectionLevel: 'L', // Nivel de corrección de errores
  });



    
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
        to: student.correo,
        subject: `${student.apellidos} ${student.nombre} QR`,
        text: `Aquí está tu código QR en formato PNG para la clase ${student.grado} ${student.grupo} ${student.especialidad}`,
        attachments: [
          {
            filename: 'qrcode.png', // Nombre del archivo adjunto
            content: QRBuffer,      // Contenido del archivo como buffer
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
            ,[student[0].nombre,student[0].apellidos,student[0].grado,student[0].grupo,student[0].area,emailUser,1,student[0].id])
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


    