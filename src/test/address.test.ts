import faker from "@withshepherd/faker";
import { gCall } from "./test-utils/gCall";
import { testConn } from "./test-utils/testConn"
import { Connection } from "typeorm";
import { User } from "../entities/User";
import { createUser } from "./helpers/createUser";

let conn: Connection;
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
      id
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

const valid_input = {
  country: faker.address.country(),
  state: faker.address.state(),
  city: faker.address.city(),
  street: faker.address.streetName(),
  exteriorNumber: "1234",
  interiorNumber: "1234",
  zip: "12345"
};

describe("CREATE Address", () => {

  it("accept CREATE address by admin user", async () => {
    const response_admin = await gCall({
      source: createAddressMutation,
      variableValues: {
        input: valid_input
      },
      user: user_admin,
    });

    expect(response_admin).toMatchObject({
      data: {
        createAddress: { address: valid_input }              
      }
    });
  });

  it("accept CREATE address by provider user", async () => {
    const response_provider = await gCall({
      source: createAddressMutation,
      variableValues: {
        input: valid_input
      },
      user: user_provider,
    });

    expect(response_provider).toMatchObject({
      data: {
        createAddress: { address: valid_input }              
      }
    });
  });

  it("reject CREATE address by regular user", async () => {
    const response_regular = await gCall({
      source: createAddressMutation,
      variableValues: {
        input: valid_input
      },
      user: user_regular,
    });

    expect(response_regular).toMatchObject({
      data: null
    });
  });

  it("reject CREATE address with invalid fields", async () => {
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
        createAddress: { 
          errors: [{
            field:"street",
            message:"el nombre de calle no puede estar vacio"
            },{
              field:"zip",
              message:"el codigo postal lleva 5 numeros"
            }
          ],
          address: null 
        }
      }              
    });
  });


});

describe("READ Address", () => {
  it("accept READ on one address", async () => {});
  it("accept READ on address list", async () => {});
  it("reject READ non existing address", async () => {})
});

describe("UPDATE Address", () => {
  it("accept UPDATE on address by owner", async () => {});
  it("accept UPDATE on address by admin", async () => {});
  it("reject UPDATE on address by non-owner", async () => {})
  it("reject UPDATE on non-existing address", async () => {});
  it("reject UPDATE with invalid values", async () => {});
});

describe("DELETE Address", () => {
  it("accept DELETE on address by owner", async () => {});
  it("accept DELETE on address by admin", async () => {});
  it("reject DELETE on address by non-owner", async () => {});
  it("reject DELETE on non-existing address", async () => {});
});