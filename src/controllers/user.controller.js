import { pool } from "../db.js";

export const createUser = async (req,res) =>{
    const data = await pool.query("INSERT INTO users (email,password) VALUES (?,?)",[req.body.emailUser,req.body.password])
    res.send({response: true})

}

export const getUser = (req,res) =>{
    const [row,info] = pool.query("SELECT INTO users WHERE email = ? AND password = ?",[req.body.emailUser,req.body.password])
    if(row.lenght > 0){
        res.send({response:true,
            data: row
        })
    }else{
        res.send(false)
    }
    
}