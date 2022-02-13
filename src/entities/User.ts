import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Field, ObjectType } from "type-graphql"

@ObjectType()
@Entity()
export class User extends BaseEntity{

    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @Column({unique: true})
    username: string

    @Field()
    @Column({unique: true})
    email: string

    @Column()
    password!: string

    @Field()
    @Column({ default: false})
    confirmed!: boolean

    // @Authorized(["ADMIN"])
    // @Column({default: "regular"})
    // roles!: [string];

    @Field(() => String)
    @CreateDateColumn()
    createdAt: Date;
    
    @Field(() => String)
    @UpdateDateColumn()
    updatedAt: Date;

}