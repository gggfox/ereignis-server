import { Request, Response } from "express"
import { Session, SessionData } from "express-session"
import { Redis } from "ioredis"
import { User } from "../../entities/User"

export type TestContext = {
    req: Request & { session?: Session & Partial<SessionData> & {userId?: number} & {user?: User}};
    res: Response;
    redis: Redis;
}