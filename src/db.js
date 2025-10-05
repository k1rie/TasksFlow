import {createPool} from "mysql2/promise"
import dotenv from 'dotenv'

dotenv.config()


export const pool = createPool({
    host: 'alphatech-labs.com',
    user: 'alphate2_smartclass_admin',
    password: 'HnhOS,,}eVe&',
    database: 'alphate2_smartclass',
    port: 3306,
    // Opciones válidas para mysql2
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 60000, // Aumentar el tiempo de espera de conexión (en milisegundos)
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
})
