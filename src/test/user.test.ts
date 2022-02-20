import { testConn } from "./test-utils/testConn";
import { Connection } from "typeorm";

let conn: Connection;
beforeAll(async () => {
    conn = await testConn();
});

afterAll(async () => {
    await conn.close();
});

//const registerUserMutation = ``

describe("User Authentication", () => {
  
})