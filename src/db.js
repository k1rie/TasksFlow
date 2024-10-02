import {createPool} from "mysql2/promise"

export const pool = createPool({
    host: "b5bbderx1w6nxltmr3y9-mysql.services.clever-cloud.com",
    user: "ujg2y3mzkj0qmsme",
    password: "9alWrdrJPvt11fetJtQZ",
    port: 3306,
    database: "b5bbderx1w6nxltmr3y9"
})