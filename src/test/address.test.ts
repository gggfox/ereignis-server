import faker from "@withshepherd/faker";
import { gCall } from "./test-utils/gCall";
import { testConn } from "./test-utils/testConn"
import { Connection, getConnection } from "typeorm";
import { User } from "../entities/User";



let conn: Connection;
let user: User;
const createUser = async (roles:string[]) => {
  const result = await getConnection()
  .createQueryBuilder()
  .insert()
  .into(User)
  .values({
      username: faker.internet.userName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      phone: faker.phone.phoneNumber()
  })
  .returning('*')
  .execute();

  user = result.raw[0];
  user = await User.findOne(user.id) as User;
  user.roles = roles
  user.save()
  return user
}
let user_regular:User;
let user_admin:User;
let user_provider:User;
beforeAll(async () => {
    conn = await testConn();
    user_regular = await createUser(["REGULAR"]);
    user_admin = await createUser(["ADMIN"]);
    user_provider = await createUser(["PROVIDER"]);
  });

afterAll(async () => {
    await conn.close();
});

const createAddressMutation = 
`mutation createAddress($input: AddressInput!){
  createAddress(input: $input){
    errors{
      field
      message
    }
    address{
      country
      state
      city
      street
      exteriorNumber
      interiorNumber
      zip
      }
    }
  }`

describe("Address", () => {
  it("create address", async () => {
    const input = {
      country: faker.address.country(),
      state: faker.address.state(),
      city: faker.address.city(),
      street: faker.address.streetName(),
      exteriorNumber: "1234",
      interiorNumber: "1234",
      zip: "12345"
    };

    const response_admin = await gCall({
      source: createAddressMutation,
      variableValues: {
        input: input
      },
      user: user_admin,
    });

    expect(response_admin).toMatchObject({
      data: {
        createAddress: { address: input }              
      }
    });

    const response_provider = await gCall({
      source: createAddressMutation,
      variableValues: {
        input: input
      },
      user: user_provider,
    });

    expect(response_provider).toMatchObject({
      data: {
        createAddress: { address: input }              
      }
    });

    const response_regular = await gCall({
      source: createAddressMutation,
      variableValues: {
        input: input
      },
      user: user_regular,
    });

    expect(response_regular).toMatchObject({
      data: null
    });

  });

  it("Rejet missing fields", async () => {
    const input = {
      country: faker.address.country(),
      state: faker.address.state(),
      city: faker.address.city(),
      street: "",
      exteriorNumber: "",
      interiorNumber: "",
      zip: ""
    };

    const response = await gCall({
      source: createAddressMutation,
      variableValues: {
        input: input
      },
      user: user_provider
    });

    expect(response).toMatchObject({
      data: {
        errors: [{
          field:"",
          message:""
          },{
            field:"",
            message:""
          }
        ],
        createAddress: { address: input }
      }              
    });
  });

  });