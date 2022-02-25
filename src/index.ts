import "dotenv-safe/config";
import express from "express";
import path from "path";
import session from "express-session";
import connectRedis from "connect-redis";
import Redis from "ioredis";
import cors from "cors";
import { createConnection } from "typeorm";
import { ApolloServer } from "apollo-server-express";
import { User } from "./entities/User";
import { __prod__ } from "./constants";
import { MyContext } from "./types";
import { createSchema } from "./utils/createSchema";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core"
import { Address } from "./entities/Address";
import { authChecker } from "./utils/auth-checker";
// import passport from "passport"


const main = async () => {

    // postgres DB connection
    await createConnection({
        type: "postgres",
        url: process.env.DATABASE_URL,
        logging: true,
        synchronize: true,
        migrations: [path.join(__dirname,"./migrations/*")],
        entities: [User, Address]
    });

    const app = express()
    
    const RedisStore = connectRedis(session);
    const redis = new Redis(process.env.REDIS_URL)
    app.set("trust proxy",1);
    app.use(cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true
    }))

    app.use(
        session({
            name: "qid",
            store: new RedisStore({
                client: redis,
                disableTouch: true,
            }),
            cookie:{
                maxAge: 1000 * 60 * 24 * 365,
                httpOnly: true,
                sameSite: "lax", //crsf
                secure: __prod__,
                domain: __prod__ ? "example.com" : undefined,
            },
            saveUninitialized: false,
            secret: process.env.SESSION_SECRET,
            resave: false
        })
    );

    const schema = await createSchema(authChecker);
    const apolloServer = new ApolloServer({
        schema,
        context: ({ req, res }): MyContext => ({
            req,
            res,
            redis
            // add loaders
        }),
        plugins: [ApolloServerPluginLandingPageGraphQLPlayground],    
    });
    await apolloServer.start()

    apolloServer.applyMiddleware({
        app,
        path: "/graphql",
        cors: false
    })


    app.listen(parseInt(process.env.SERVER_PORT as string), ()=>{
        console.log('server started on localhost:'+ process.env.SERVER_PORT);//
    })
}

main().catch((err) => {
    console.log(err.message);
})


