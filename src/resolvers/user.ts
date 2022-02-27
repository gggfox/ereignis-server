import argon2 from "argon2"
import nodemailer from "nodemailer"
import { User } from "../entities/User";
import { UsernamePasswordInput } from "../types/UsernamePasswordInput";
import { validateRegister } from "../utils/validate/validateRegister";
import { Arg, Authorized, Ctx, Field, FieldResolver, Int, Mutation, ObjectType, Query, Resolver, Root } from "type-graphql";
import { getConnection, getManager } from "typeorm";
import { MyContext } from "../types"
import { UserResponse } from "../types/UserResponse";
import { UserProfileUpdateInput } from "../types/UserProfileUpdateInput";

@ObjectType()
class PaginatedUsers {
  @Field(() => [User])
  users: User[]
  @Field()
  hasMore: boolean;
}

@Resolver(User)
export class UserResolver {
    
    /*
        This field resolver makes sure only the logged in user can query 
        his or her own email. Recives a user and returns a string.
    */
    @FieldResolver(() => String)
    email(
        @Root() user: User,
        @Ctx() { req }: MyContext
    ){
        if(req.session.userId === user.id){
            return user.email;
        }
        return "";
    }
    
    @Query(() => User, {nullable:true})
    me(@Ctx() { req }: MyContext){
        if(!req.session.userId){
            return null;
        }
        return User.findOne({where: {id: req.session.userId}})
    }

       /*
        This mutation recives email, username, password and confirmation, 
        validates all data through middleware that returns erros if any are
        found, then it creates a new user in the DB, unless a user with same 
        unique field (username, email) exists, in which case returns error,
        in case no error is found logs the user in. 
    */
    @Mutation(() => UserResponse)
    async register(
        @Arg('options') {email, username,phone, password, confirmation}: UsernamePasswordInput,
        @Ctx() {req}: MyContext
    ): Promise<UserResponse> {
        const errors = validateRegister({email, username, phone, password, confirmation});
        if(errors){
            return {errors};
        }
        const hashedPassword = await argon2.hash(password);
        let user;
        try{
           const result = await getConnection()
             .createQueryBuilder()
             .insert()
             .into(User)
             .values({
                username: username,
                email: email,
                password: hashedPassword,
                phone: phone
            })
            .returning('*')
            .execute();
            user = result.raw[0];
        }catch (err) {
            const duplicateUserErrorCode = "23505"
            if (err.code === duplicateUserErrorCode) {
                return {
                    errors: [{
                        field: "username",
                        message: "nombre de usuario ya existe",
                    }]
                };
            }
        }
        req.session.userId = user.id;
        return {user};
    }

    /*
    Send confirmation email
    */
    @Query(() => String)
    async confirm(){

        const sender = process.env.EMAIL
        const pwd = process.env.EMAIL_PASSWORD
        let transporter = nodemailer.createTransport( {
            service: "gmail",
            auth: {
            type: 'OAUTH2',
              user: sender,
              pass: pwd, // generated ethereal password
              clientId: process.env.OAUTH_CLIENT_ID,
              clientSecret: process.env.OAUTH_CLIENT_SECRET,
              refreshToken: process.env.OAUTH_REFRESH_TOKEN
            },
          });
          const options = {
            from: sender, // sender address
            to: sender, // list of receivers
            subject: "Hello ✔", // Subject line
            text: "Hello world?", // plain text body
            html: "<b>Hello world?</b>", // html body
          }

          const info = await transporter.sendMail(options);
          console.log(transporter.options)

          return info.messageId
    }

    @Authorized(["ADMIN"])
    @Query(() => PaginatedUsers, {nullable:true})
    async users(
        @Arg("limit", () => Int)limit:number,
        @Arg("cursor", () => String, {nullable:true})cursor: string | null
    ):Promise<PaginatedUsers>{
        const realLimit = Math.min(50, limit);
        const realLimitPlusOne = realLimit + 1;
        const replacements: any[] = [realLimitPlusOne];
    
        if(cursor){
          replacements.push(new Date(parseInt(cursor)));
        }
        const users = await getConnection().query( `
          SELECT u.*
          FROM "user" u
          ${cursor ? `WHERE u."createdAt" < $2`:""}
          ORDER BY u."createdAt" DESC
          LIMIT $1
        `, replacements);
        return {
          users: users.slice(0, realLimit),
          hasMore: users.length === realLimitPlusOne
        }
    }

    @Query(() => UserResponse)
    async user(
        @Arg("id", () => Int) id:number,
        @Ctx() {req}: MyContext
    ):Promise<UserResponse>{
        const curr_user = await User.findOne({where:{id:req.session.userId}});
        const user = await User.findOne({where:{id: id}});
        if(!user){
            return {errors: [{
                field:"", 
                message:"usuario no encontrado"
            }]}  
        }
        if(!user?.confirmed && req.session.userId != id && !curr_user?.roles.includes("ADMIN")){
            return {errors: [{
                field:"", 
                message:"usuario sin cuenta activada"
            }]}
        }
        return {user,}
    }


@Mutation(() => UserResponse)
    async login(
        @Arg('usernameOrEmail') usernameOrEmail: string,
        @Arg('password') password: string,
        @Ctx() {req}: MyContext
    ): Promise<UserResponse> {
        let user = null
         
        user = await User.findOne(
            usernameOrEmail.includes('@') 
            ? { where: {email: usernameOrEmail }} 
            : { where: {username: usernameOrEmail}}
        );
              
        if(!user){
            return {
                errors: [
                    {
                        field: "usernameOrEmail",
                        message: "El usuario no existe",
                    },
                ],
            };
        }
        const valid = await argon2.verify(user.password, password);
        if(!valid){
            return {
                errors: [
                    {
                        field: "password",
                        message: "Contraseña incorrecta",
                    },
                ],
            };
        }
        req.session.userId = user.id;
        return {user,};
    }

    @Authorized(["ADMIN"])
    @Mutation(() => UserResponse)
    async addProviderRole(
        @Arg('id',() => Int)id:number
    ): Promise<UserResponse> {
        const entityManager = getManager();      
        let user = await User.findOne({where: {id: id}});
        if(!user){
            return {
                errors: [
                    {
                        field: "",
                        message: "usuario no encontrado",
                    },
                ],
            };
        }
        if(user?.roles.includes("PROVIDER")){
            return {user,};
        }
        user?.roles.push("PROVIDER");
        await entityManager.save(user);
        return {user,};
    }

    @Authorized(["ADMIN"])
    @Mutation(() => UserResponse)
    async removeProviderRole(
        @Arg('id', () => Int) id: number,
    ): Promise<UserResponse> {       
        let user = await User.findOne({where: {id: id}});
        if(!user){
            return {
                errors: [
                    {
                        field: "",
                        message: "usuario no encontrado",
                    },
                ],
            };
        }
        if(user){
            const entityManager = getManager();
            const new_roles = user?.roles.filter((curr_role) => {return curr_role != "PROVIDER"});
            user.roles = new_roles as string []
            entityManager.save(user);
        }
        
        return {user,};
    }

    @Authorized()
    @Mutation(() => UserResponse)
    async updateProfile(
        @Arg("id", () => Int) id: number,
        @Arg("input")input: UserProfileUpdateInput,
        @Ctx() {req}:MyContext
    ):Promise<UserResponse>{        
        const curr_user = await User.findOne({where: {id: req.session.userId}});
        const notAdmin = !curr_user?.roles.includes("ADMIN");
        if(notAdmin && req.session.userId !== id){
            return {errors:[{
                field:"",
                message:"Operacion invalida"
            }]}
        }
        let user = await User.findOne({where:{id:id}});
        
        if(!user){
            return {errors:[{
                field:"",
                message:"Operacion invalida"
            }]}
        }

        const result = await getConnection()
        .createQueryBuilder()
        .update(User)
        .set({username:input.username, email:input.email, phone:input.phone})
        .where('id = :id',{id})
        .returning("*")
        .execute()

        user = result.raw[0];
        return {user,}
    }

    @Authorized()
    @Mutation(() => Boolean)
    async deleteUser(
        @Arg("id", () => Int)id: number,
        @Ctx() {req}:MyContext
    ): Promise<boolean> {
        const curr_user = await User.findOne({where:{id:req.session.userId}});
        const notAdmin = !curr_user?.roles.includes("ADMIN");
        if(notAdmin && req.session.userId !== id){
            return false;
        }
        let user = await User.findOne({where:{id:id}});
        if(!user){
            return false;
        }
        User.delete({id});
        return true;
    }

}