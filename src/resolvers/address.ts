import { Arg, Authorized, Field, InputType, Int, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import { Address } from "../entities/Address";
import { getConnection } from "typeorm";

@InputType()
class AddressInput {
  @Field()
  country?: string;
  @Field()
  state: string;
  @Field()
  city: string
  @Field()
  street: string;
  @Field()
  exteriorNumber: string;
  @Field()
  interiorNumber?: string;
  @Field()
  zip: string;
}

@ObjectType()
class AddressFieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class AddressResponse {
  @Field(() => [AddressFieldError], {nullable: true})
  errors?: AddressFieldError[];
  @Field(() => Address, {nullable: true})
  address?: Address;
}

@ObjectType()
class PaginatedAddresses {
  @Field(() => [Address])
  addresses: Address[]
  @Field()
  hasMore: boolean;
}

@Resolver(Address)
export class AddressResolver {      

  @Authorized(["ADMIN", "PROVIDER"])
  @Query(() => PaginatedAddresses)
  async addresses(
    @Arg('limit', () => Int) limit: number,
    @Arg('cursor', () => String, {nullable: true}) cursor: string | null,
  ): Promise<PaginatedAddresses> {
    
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;
    const replacements: any[] = [realLimitPlusOne];

    if(cursor){
      replacements.push(new Date(parseInt(cursor)));
    }
    const addresses = await getConnection().query( `
      SELECT a.*
      FROM address a
      ${cursor ? `WHERE a."createdAt < $2`:""}
      ORDER BY a."createdAt" DESC
      LIMIT $1
    `, replacements);

    return {
      addresses: addresses.slice(0,realLimit),
      hasMore: addresses.length === realLimitPlusOne
    }
  }

  @Authorized(["ADMIN", "PROVIDER"])
  @Mutation(() => AddressResponse)
  async createAddress(
    @Arg('input') input: AddressInput,
    // @Ctx() {req}: MyContext
  ): Promise<AddressResponse> {
    //let errors: AddressFieldError = []

    
    const address = await Address.create({
        country: input.country,
        state: input.state,
        city: input.city,
        street: input.street,
        exteriorNumber: input.exteriorNumber,
        interiorNumber: input.interiorNumber,
        zip: input.zip
    }).save();

    return {address, }
  }
}