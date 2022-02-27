import faker from "@withshepherd/faker";
import { testConn } from "./test-utils/testConn";
import { Connection, getConnection } from "typeorm";
import { gCall } from "./test-utils/gCall";
import { User } from "../entities/User";
import { createUser } from "./helpers/createUser";

let conn: Connection;
let admin_user: User;
let provider_user:User;
let regular_user:User;

beforeAll(async () => {
    conn = await testConn();
    admin_user = await createUser(["ADMIN"]);
    provider_user = await createUser(["PROVIDER"]);
    regular_user = await createUser(["REGULAR"]);
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
            id
            email
            username
         }
    }
}`

const usersQuery = 
`query Users($limit: Int!, $cursor: String) {
    users(limit: $limit, cursor: $cursor) {
        users {
            username
        }
        hasMore
    }
}`

const userQuery = 
`query User($id: Int!){
    user(id:$id){
        user{
            username
        }
        errors{
            field
            message
        }
    }
}`

const updateProfileMutation =
`mutation UpdateProfile($id: Int!, $input: UserProfileUpdateInput!) {
    updateProfile(id: $id, input: $input) {
        user{
            username
        }
        errors{
            field
            message
        }
    }
}`

const addRoleMutation = 
`mutation AddProviderRole($id: Int!) {
    addProviderRole(id: $id) {
        user{
            username
            roles
        }
        errors{
            field
            message
        }
    }
}`

const removeRoleMutation = 
`mutation RemoveRole($id: Int!) {
    removeProviderRole(id: $id) {
        user{
            username
            roles
        }
        errors{
            field
            message
        }
    }
}`

const deleteUserMutation = 
`mutation DeleteUser($id: Int!) {
    deleteUser(id: $id)
}`
const password = faker.internet.password();
const options = {
    email: faker.internet.email(),
    username: faker.internet.userName(),
    phone: faker.phone.phoneNumber(),
    password: password,
    confirmation: password,
};

describe("Create User", () => {
  it("accept CREATE(register) user", async () => {    
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
  });

  it("reject CREATE when duplicate user", async () => {
    await getConnection()
    .createQueryBuilder()
    .delete()
    .from(User)
    .where('"username" = :username',{username: options.username});

    const response = await gCall({
        source: registerMutation,
        variableValues: { options },
    });
 
    expect(response).toMatchObject({
        data: {
            register: {
                errors: [{
                    field: "username",
                    message: "nombre de usuario ya existe"
                }],
                user:null
            }
        }
    });
  });

  it("reject CREATE user because invalid fields", async () => {
    const password = faker.internet.password();
    const options2 = {
        email: "example&mail.com",
        username: "a",
        phone: "",
        password: password,
        confirmation: password,
    };
    const response = await gCall({
        source: registerMutation,
        variableValues: {
            options:options2
        },
    });
    expect(response).toMatchObject({
        data: {
            register: {
                errors: [{
                    field: "email",
                    message: "Email invalido"
                },{
                    field: "username",
                    message: "El tamaño debe de ser mayor a 2"
                }],
                user: null
            }
        }
    });

  });

  it("reject CREATE user non-matching password and confirmation", async () => {
    let new_options = options;
    new_options.password = "87654321"
    new_options.confirmation = "12345678"
    const response = await gCall({
        source: registerMutation,
        variableValues: {
            options
        },
    });
    expect(response).toMatchObject({
        data: {
            register: {
                errors: [{
                    field: "confirmation",
                    message: "Las contraseñas no son iguales"
                }],
                user:null
            }
        }
    });
  });
});


describe("READ user", () => {
    it("accept READ user list only if admin", async () => {
        const response_admin = await gCall({
          source: usersQuery,
          variableValues:{ limit:50, cursor:null },
          user:admin_user
        });
        expect(response_admin?.data?.users.users.length >= 1).toBeTruthy();
        
        const response_provider = await gCall({
            source: usersQuery,
            variableValues:{ limit:50, cursor:null },
            user:provider_user
        });
        expect(response_provider?.data?.users === null).toBeTruthy();
          
        const response_regular = await gCall({
            source: usersQuery,
            variableValues:{ limit:50, cursor:null },
            user:regular_user
        });
        expect(response_regular?.data?.users).toBeNull();
    });

    it("accept READ user by id", async () => {
        const response_regular = await gCall({
            source: userQuery,
            variableValues:{ id:regular_user.id },
            user: regular_user
        });
        expect(response_regular?.data?.user.user.username === regular_user.username).toBeTruthy();
    });

    it("accept READ on unconfirmed user only by admin and owner", async () => {
        let unconfirmed_user = await createUser(["REGULAR"]);
        unconfirmed_user.confirmed = false;
        const response_regular = await gCall({
            source: userQuery,
            variableValues:{ id: unconfirmed_user.id },
            user: regular_user
        });
        expect(response_regular?.data?.user.errors[0].message === "usuario sin cuenta activada").toBeTruthy();
        const response_admin = await gCall({
            source: userQuery,
            variableValues:{ id: unconfirmed_user.id },
            user: admin_user
        });
        expect(response_admin?.data?.user.user.username === unconfirmed_user.username).toBeTruthy();
        const response_owner = await gCall({
            source: userQuery,
            variableValues:{ id: unconfirmed_user.id },
            user: unconfirmed_user
        });
        expect(response_owner?.data?.user.user.username === unconfirmed_user.username).toBeTruthy();
    });

    it("reject READ on user by id for non-existing user", async () => {
        const response_regular = await gCall({
            source: userQuery,
            variableValues:{ id:-1},
            user: regular_user
        });
        expect(response_regular?.data?.user.errors[0].message == "usuario no encontrado").toBeTruthy();
    });
});

describe("UPDATE user", () => {
    it("accept UPDATE on profile by owner and admin", async () => {
        const new_profile = {
            username: faker.internet.userName(),
            email: faker.internet.email(),
            phone: faker.phone.phoneNumber()
        }
        const response_regular = await gCall({
            source: updateProfileMutation,
            variableValues:{ id: regular_user.id, input: new_profile},
            user: regular_user
        });
        expect(response_regular.data?.updateProfile.user.username === new_profile.username).toBeTruthy();
        const new_profile2 = {
            username: faker.internet.userName(),
            email: faker.internet.email(),
            phone: faker.phone.phoneNumber()  
        }
        const response_admin = await gCall({
            source: updateProfileMutation,
            variableValues:{ id: regular_user.id, input: new_profile2},
            user: admin_user
        });
        expect(response_admin.data?.updateProfile.user.username == new_profile2.username).toBeTruthy();
        const response_provider = await gCall({
            source: updateProfileMutation,
            variableValues:{ id: regular_user.id, input: new_profile},
            user: provider_user
        });        
        expect(response_provider.data?.updateProfile.errors[0].message === "Operacion invalida").toBeTruthy();
    });
    it("accept UPDATE role by admin only", async () => {
        let normal_user = await createUser(["REGULAR"]);
        const response1 = await gCall({
            source: addRoleMutation,
            variableValues:{ id: normal_user.id, role: "PROVIDER"},
            user: admin_user
        });
        expect(response1.data?.addProviderRole.user.roles.includes("PROVIDER")).toBeTruthy();
        const response2 = await gCall({
            source: removeRoleMutation,
            variableValues:{ id: normal_user.id, role: "PROVIDER"},
            user: admin_user
        });
        expect(response2.data?.removeProviderRole.user.roles.includes("PROVIDER")).toBeFalsy();
        const response3 = await gCall({
            source: addRoleMutation,
            variableValues:{ id: normal_user.id, role: "PROVIDER"},
            user: provider_user
        });
        expect(response3.data).toBeNull();
    });
});

describe("DELETE user", () => {
    it("accept DELETE profile by admin user", async () => {
        let normal_user = await createUser(["REGULAR"]);
        const response = await gCall({
            source: deleteUserMutation,
            variableValues:{ id: normal_user.id},
            user: admin_user
        });
        expect(response.data?.deleteUser).toBeTruthy();
    });
    it("accept DELETE profile by owner user", async () => {
        let normal_user = await createUser(["REGULAR"]);
        const response = await gCall({
            source: deleteUserMutation,
            variableValues:{ id: normal_user.id},
            user: normal_user
        });
        console.log(response)
        expect(response.data?.deleteUser).toBeTruthy();
    });
    it("reject DELETE profile by non-owner user", async () => {
        let normal_user = await createUser(["REGULAR"]);
        const response = await gCall({
            source: deleteUserMutation,
            variableValues:{ id: normal_user.id},
            user: regular_user
        });
        expect(response.data?.deleteUser).toBeFalsy();
    });
    it("reject DELETE non-existing profile by admin", async () => {
        const response = await gCall({
            source: deleteUserMutation,
            variableValues:{ id: -1},
            user: admin_user
        });
        expect(response.data?.deleteUser).toBeFalsy();
    });
});