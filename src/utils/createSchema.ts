import { AuthChecker, buildSchema } from "type-graphql";
import { UserResolver } from "../resolvers/user";
import { AddressResolver } from "../resolvers/address";
import { MyContext } from "../types";

export const createSchema = (authChecker?:AuthChecker<MyContext>) => buildSchema({
    resolvers: [UserResolver, AddressResolver],
    validate: false,
    authChecker
})