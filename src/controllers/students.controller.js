import {pool} from "../db.js"

export const createStudent = async(req,res)=>{
try {
    const data = await pool.query("INSERT INTO students (nombre,apellidos,correo,especialidad,grado,grupo) VALUES(?,?,?,?,?,?)",
    [req.body.nombre,req.body.apellidos,req.body.correo,req.body.especialidad,req.body.grado,req.body.grupo])
    res.send(data[0])
    const group = await pool.query("SELECT * FROM classrooms WHERE especialidad = ? AND grado = ? AND grupo = ?",
        [req.body.especialidad,req.body.grado,req.body.grupo]
    )

    await pool.query("UPDATE classrooms SET alumnos = ? WHERE especialidad = ? AND grado = ? AND grupo = ?",
        [group[0][0].alumnos+1,req.body.especialidad,req.body.grado,req.body.grupo]
    )
} catch (error) {
    res.send(error)
}
}

export const getStudents = async(req,res)=>{
    try{
        const data = await pool.query("SELECT * FROM students WHERE especialidad = ? AND grado = ? AND grupo = ?",[req.params.especialidad,req.params.grado,req.params.grupo])
        res.send(data[0])
    }catch(error){
res.send(error)
    }
    
    
    
}

export const getStudent = async(req,res)=>{
    try{
        const data = await pool.query("SELECT * FROM students WHERE id = ?",[req.params.id])
        res.send(data[0])
    }catch(error){
res.send(error)
    }
    
    
    
}

export const deleteStudent = async(req,res)=>{
    try{
        await pool.query("SET FOREIGN_KEY_CHECKS=0")
        const data = await pool.query("DELETE FROM students WHERE id = ? ",[req.params.id])
        await pool.query("SET FOREIGN_KEY_CHECKS=1")
        res.send(data[0])
    }catch(error){
res.send(error)
    }
    
    
    
}

export const updateStudent = async(req,res)=>{
    try{
    
        const data = await pool.query("UPDATE students SET nombre = ?, apellidos = ?, correo = ? WHERE id = ?",[req.body.nombre,req.body.apellidos,req.body.correo,req.params.id])
        res.send(data[0])
    }catch(error){
res.send(error)
    }
    
    
    
}