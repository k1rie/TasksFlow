import {createPool} from "mysql2/promise"
import dotenv from 'dotenv'

dotenv.config()


export const pool = createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    // Opciones válidas para mysql2
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 60000, // Aumentar el tiempo de espera de conexión (en milisegundos)
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
})
