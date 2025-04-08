import {createPool} from "mysql2/promise"
import dotenv from 'dotenv'

dotenv.config()


export const pool = createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    // Añadir estas configuraciones:
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 60000, // Aumentar el tiempo de espera de conexión (en milisegundos)
    acquireTimeout: 60000, // Tiempo de espera para adquirir una conexión
    timeout: 60000, // Timeout general
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
})
