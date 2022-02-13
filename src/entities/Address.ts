import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Field, ObjectType } from "type-graphql"

@ObjectType()
@Entity()
export class Address extends BaseEntity{

    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @Field(() => String)
    @Column({default: "Mexico"})
    country: string

    @Field(() => String)
    @Column({default: "Nuevo Leon"})
    state: string

    @Field(() => String)
    @Column()
    city: string

    @Field(() => String)
    @Column()
    street: string

    @Field(() => String)
    @Column()
    postalCode: string

    @Field(() => String)
    @Column()
    exteriorNumber: string

    @Field(() => String)
    @Column()
    interiorNumber: string

    @Field(() => String)
    @CreateDateColumn()
    createdAt: Date;
    
    @Field(() => String)
    @UpdateDateColumn()
    updatedAt: Date;
}