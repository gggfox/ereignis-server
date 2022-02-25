import { graphql, GraphQLSchema } from "graphql"
import { Maybe } from "graphql/jsutils/Maybe"
import { User } from "../../entities/User";
import { createSchema } from "../../utils/createSchema"
import { testAuthChecker } from "./testAuthChecker";

interface Options {
    source: string;
    variableValues?: Maybe<{
        [key: string]: any
    }>;
    user?: User;
}

let schema: GraphQLSchema;

export const gCall = async ({source, variableValues, user }: Options) => {
    if(!schema){
        schema = await createSchema(testAuthChecker);
    }
    let userId = undefined;
    if(user?.id){
        userId = user.id;
    }
    const response = await graphql({
        schema, 
        source,
        variableValues,
        contextValue: {
            req: {
                session: {
                    userId,
                    user,
                }
            },
            res: {
                clearCookie: jest.fn()
            }
        }
    });
    return response;
}