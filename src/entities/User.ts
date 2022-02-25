import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Authorized, Field, ObjectType } from "type-graphql"

@ObjectType()
@Entity()
export class User extends BaseEntity{
    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @Column({unique: true})
    username: string;

    @Column()
    password!: string;

    @Field()
    @Column({unique: true})
    email: string;

    @Field()
    @Column({unique: true})
    phone: string;

    @Field()
    @Column({default: false})
    confirmed!: boolean;

    @Authorized(["ADMIN"])
    @Field(() => [String])
    @Column("text", {array:true, default: ["REGULAR"]})
    roles!: string[];

    @Field(() => String)
    @CreateDateColumn()
    createdAt: Date;
    
    @Field(() => String)
    @UpdateDateColumn()
    updatedAt: Date;
}