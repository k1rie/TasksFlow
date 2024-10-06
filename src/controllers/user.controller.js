import { pool } from "../db.js";

export const createUser = async (req,res) =>{
    const data = await pool.query("INSERT INTO users (email,password) VALUES (?,?)",[req.body.emailUser,req.body.password])
    res.send({response: true})

}

export const getUser = async (req,res) =>{
    const authHeader = req.headers['authorization'];
    const base64Credentials = authHeader.split(' ')[1]; // Obtener la parte después de "Basic"
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [emailUser, password] = credentials.split(':');
  console.log(emailUser)
    const [row,info] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?",[emailUser,password])
    console.log(row)
    if(row.length > 0){
        
        res.send({response:true,
            data: row[0]
        })
    }else{
        res.send(false)
    }
    
}