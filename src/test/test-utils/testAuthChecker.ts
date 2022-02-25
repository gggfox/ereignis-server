import { AuthChecker } from "type-graphql";
import { TestContext } from "./testContext";

export const testAuthChecker: AuthChecker<TestContext> = async (
  { context: { req } },
  roles,
) => {
    if(!req?.session?.user?.id){
        return false
    }
    const user = req.session.user

    if (roles.length === 0) {
      // if `@Authorized()`, check only if user exists
      return user !== undefined;
    }

    if (!user) {
        return false;
    }

    if (user.roles.some(role => roles.includes(role))) {
        return true;
    }

    return false; // or false if access is denied
  };