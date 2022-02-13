import { graphql, GraphQLSchema } from "graphql"
import { Maybe } from "graphql/jsutils/Maybe"
import { createSchema } from "../utils/createSchema"

interface Options {
    source: string;
    variableValues?: Maybe<{
        [key: string]: any
    }>;
    userId?: number;
}

let schema: GraphQLSchema;

export const gCall = async ({source, variableValues, userId }: Options) => {
    if(!schema){
        schema = await createSchema();
    }

    const response = await graphql({
        schema, 
        source,
        variableValues,
        contextValue: {
            req: {
                session: {
                    userId
                }
            },
            res: {
                clearCookie: jest.fn()
            }
        }
    })

    return response;
}