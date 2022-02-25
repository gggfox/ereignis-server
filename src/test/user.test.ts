import faker from "@withshepherd/faker";
import { testConn } from "./test-utils/testConn";
import { Connection } from "typeorm";
import { gCall } from "./test-utils/gCall";
import { User } from "../entities/User";

let conn: Connection;
beforeAll(async () => {
    conn = await testConn();
});

afterAll(async () => {
    await conn.close();
});

const registerMutation = 
`mutation Register($options: UsernamePasswordInput!){
    register(options: $options) {
        errors {
            field
            message
         }
         user {
            email
            username
         }
    }
}`

describe("User Authentication", () => {
  it("dont allow duplicate user", async () => {

    const password = faker.internet.password();
    const options = {
        email: faker.internet.email(),
        username: faker.internet.userName(),
        phone: faker.phone.phoneNumber(),
        password: password,
        confirmation: password,
    };
    
    const response = await gCall({
        source: registerMutation,
        variableValues: {
            options
        },
    });

    expect(response).toMatchObject({
        data: {
            register: {
                errors: null,
                user:{
                    email: options.email, 
                    username: options.username,
                }
            }
        }
    });

    const dbUser = await User.findOne({ where: { email: options.email } });
    expect(dbUser).toBeDefined();
    expect(dbUser!.username).toBe(options.username);

    const copyResponse = await gCall({
        source: registerMutation,
        variableValues: {
            options
        },
    });

    expect(copyResponse).toMatchObject({
        data: {
            register: {
                errors: [{
                    field: "username",
                    message: "username already taken"
                }],
                user:null
            }
        }
    });
})
})