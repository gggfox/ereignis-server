import faker from "@withshepherd/faker";
import { getConnection } from "typeorm";
import { User } from "../../entities/User";

export const createUser = async (roles:string[]) => {
  const result = await getConnection()
  .createQueryBuilder()
  .insert()
  .into(User)
  .values({
      username: faker.internet.userName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      phone: faker.phone.phoneNumber()
  })
  .returning('*')
  .execute();

  let user:User = await User.findOne(result.raw[0].id);
  user.roles = roles;
  user.confirmed = true;
  user.save()
  return user
}