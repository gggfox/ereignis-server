import { MyContext } from "../types";
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Resolver } from "type-graphql";
import { Address } from "../entities/Address";

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
  postalCode: string;
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

@Resolver(Address)
export class AddressResolver {      
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
        postalCode: input.postalCode
    }).save();

    return {address, }
  }
}