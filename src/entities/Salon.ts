import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Field, ObjectType } from "type-graphql"

@ObjectType()
@Entity()
export class Salon extends BaseEntity{
    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @Column()
    title: string;

    @Field()
    @Column()
    description: string;

    @Field()
    @Column()
    basePrice: number;

    @Field()
    @Column()
    discount: number;

    @Field()
    @Column()
    squareMeter: string;

    @Field()
    @Column()
    numberOfTables: number;

    @Field()
    @Column()
    seatsPerTables: number;

    @Field()
    @Column()
    parkingSpaces: number;

    @Field(() => String)
    @CreateDateColumn()
    createdAt: Date;
    
    @Field(() => String)
    @UpdateDateColumn()
    updatedAt: Date;
}