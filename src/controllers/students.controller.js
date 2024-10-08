import {pool} from "../db.js"
import nodeMailer from "nodemailer"
import QRCode from "qrcode"

export const createStudent = async(req,res)=>{
try {
    const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[req.body.emailUser,req.body.password])

    if(row.length > 0){

    const data = await pool.query("INSERT INTO students (nombre,apellidos,correo,especialidad,grado,grupo,user) VALUES(?,?,?,?,?,?,?)",
    [req.body.nombre,req.body.apellidos,req.body.correo,req.body.especialidad,req.body.grado,req.body.grupo,req.body.emailUser])
    const group = await pool.query("SELECT * FROM classrooms WHERE especialidad = ? AND grado = ? AND grupo = ? AND user = ?",
        [req.body.especialidad,req.body.grado,req.body.grupo,req.body.emailUser]
    )
    const [rows,info] = await pool.query("SELECT * FROM tasks WHERE area = ? AND grade = ? AND groupTask = ? AND user = ?",[req.body.especialidad,req.body.grado,req.body.grupo,req.body.emailUser])

    if(rows.length > 0){
rows.map((e)=>{
    pool.query("INSERT INTO tasks_students (name,rate,final_rate,task_for,user) VALUES (?,?,0,?,?)",[e.name,e.rate,data[0].insertId,req.body.emailUser])

})
    }

    await pool.query("UPDATE classrooms SET alumnos = ? WHERE especialidad = ? AND grado = ? AND grupo = ?",
        [group[0][0].alumnos+1,req.body.especialidad,req.body.grado,req.body.grupo]
    )

     
          const QRDataUri = await QRCode.toDataURL(`https://tasksflow-backend.onrender.com/attendence/${req.body.nombre}/${req.body.apellidos}/${req.body.grado}/${req.body.grupo}/${req.body.area}/${req.body.correo}`);
       
       
      
   

        
    let transporter =  nodeMailer.createTransport({
        host: "smtp.gmail.com",  // Servidor SMTP (por ejemplo: smtp.gmail.com)
        port: 465,                 // Puerto (normalmente 587 o 465 para SSL)
        secure: true,             // True para 465, false para otros puertos
        auth: {
          user: "d628587@gmail.com", // Tu correo
          pass: "yxtg ahpk nzur wdcd",         // Contraseña de tu correo
        },
      });


          // Enviar correo
          let message = await transporter.sendMail({
            from: '"Remitente" <d628587@gmail.com>', // Remitente
            to: req.body.correo,                            // Lista de destinatarios
            subject: "QR",
            text: "Aqui está tu QR"      ,
            html: `<img src="${QRDataUri}"/>`                                          // Cuerpo del correo en HTML
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
        const data = await pool.query("SELECT * FROM students WHERE especialidad = ? AND grado = ? AND grupo = ? AND user = ?",[req.params.especialidad,req.params.grado,req.params.grupo,emailUser])
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
        const data = await pool.query("DELETE FROM students WHERE id = ? ",[req.params.id])
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