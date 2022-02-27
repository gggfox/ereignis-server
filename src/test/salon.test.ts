// import { testConn } from "./test-utils/testConn"
// import { Connection } from "typeorm";
// import { User } from "../entities/User";
// import { createUser } from "./helpers/createUser";

// let conn: Connection;
// let user_regular:User;
// let user_admin:User;
// let user_provider:User;

beforeAll(async () => {
    // conn = await testConn();
    // user_regular = await createUser(["REGULAR"]);
    // user_admin = await createUser(["ADMIN"]);
    // user_provider = await createUser(["PROVIDER"]);
});

afterAll(async () => {
    //await conn.close();
});

describe("CREATE salon", () => {
  it("accept CREATE salon by provider user", async () => {});
  it("accept CREATE salon by admin user", async () => {});
  it("reject CREATE salon by regular user", async () => {});
  it("reject CREATE salon with invalid fields", async () => {});
});

describe("READ salon", () => {
  it("accept READ salon by id", async () => {});
  it("accept READ salon list", async () => {});
  it("reject READ on non-existing salon", async () => {});
  it("reject READ on hidden salon unless user is admin or owner", async () => {});
  it("reject READ on unaccepted salon unless user is admin or owner", async () => {});
});

describe("UPDATE salon", () => {
  it("accept UPDATE salon if user is owner or admin", async () => {});
  it("reject UPDATE salon on non-existing salon", async () => {});
  it("reject UPDATE salon if user is non-owner", async () => {});
});

describe("DELETE salon", () => {
  it("accept DELETE on salon if user is owner or admin", async () => {});
  it("reject DELETE on non-existing salon", async () => {});
  it("reject DELETE on another user salon", async () => {});
});