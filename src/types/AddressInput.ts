import { Field, InputType } from "type-graphql";

@InputType()
export class AddressInput {
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