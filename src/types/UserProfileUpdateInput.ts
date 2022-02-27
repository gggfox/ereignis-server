import { Field, InputType } from "type-graphql";

@InputType()
export class UserProfileUpdateInput {
    @Field()
    email?: string;
    @Field()
    username?: string;
    @Field()
    phone?: string;
}