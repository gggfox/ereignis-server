import faker from "@withshepherd/faker";
import { gCall } from "./test-utils/gCall";
import { testConn } from "./test-utils/testConn"
import { Connection } from "typeorm";

let conn: Connection;
beforeAll(async () => {
    conn = await testConn();
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
      postalCode
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
      postalCode: "12345"
    };

    const response = await gCall({
      source: createAddressMutation,
      variableValues: {
        input: input
      }
    });

    expect(response).toMatchObject({
      data: {
        createAddress: { address: input }              
      }
    });
  });

  // it("Rejet empty address", async () => {
  //   const input = {
  //     country: "",
  //     state: "",
  //     city: "",
  //     street: "",
  //     exteriorNumber: "",
  //     interiorNumber: "",
  //     postalCode: ""
  //   };

  //   const response = await gCall({
  //     source: createAddressMutation,
  //     variableValues: {
  //       input: input
  //     }
  //   });

  //   expect(response).toMatchObject({
  //     data: {
  //       createAddress: { address: input }              
  //     }
  //   });
  // });

  });