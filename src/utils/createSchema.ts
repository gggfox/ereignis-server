import { HelloResolver } from "../resolvers/hello";
import { buildSchema } from "type-graphql";
import { authChecker } from "./auth-checker";
import { UserResolver } from "../resolvers/user";
import { AddressResolver } from "../resolvers/address";

export const createSchema = () => buildSchema({
    resolvers: [HelloResolver, UserResolver, AddressResolver],
    validate: false,
    authChecker
})