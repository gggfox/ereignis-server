import { User } from "../entities/User";
import { MyContext } from "src/types";
import { AuthChecker } from "type-graphql";

export const authChecker: AuthChecker<MyContext> = async (
    { context: { req } },
    roles,
  ) => {
      if(!req.session.userId){
          return false
      }
      const user = await User.findOne({ where: { id: req.session.userId } });

    if (roles.length === 0) {
        // if `@Authorized()`, cehck only if user exists
        return user !== undefined;
    }

    if (!user) {
        return false;
    }

    if (user.roles.some( role => roles.includes(role))) {
        return true;
    }

    return false; // or false if access is denied
  };