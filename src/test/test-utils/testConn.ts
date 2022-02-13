import { createConnection } from "typeorm"

export const testConn = (drop: boolean = false) => {
    console.log("DIRNAME: ", __dirname)
    return createConnection({
        "type": "postgres",
        "host":"localhost",
        "port": 5432,
        "username": "postgres",
        "password":"postgres",
        "database": "ereignis-test",
        logging: false,
        synchronize: drop,
        dropSchema: drop,
        "entities": [__dirname + "/../../entities/*"],
    })
}