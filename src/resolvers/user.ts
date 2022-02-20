import argon2 from "argon2"
import nodemailer from "nodemailer"
import { User } from "../entities/User";
import { UsernamePasswordInput } from "../types/UsernamePasswordInput";
import { validateRegister } from "../utils/validate/validateRegister";
import { Arg, Authorized, Ctx, FieldResolver, Mutation, Query, Resolver, Root } from "type-graphql";
import { getConnection, getManager } from "typeorm";
import { MyContext } from "../types"
import { UserResponse } from "../types/UserResponse";


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
        @Arg('options') {email, username, password, confirmation}: UsernamePasswordInput,
        @Ctx() {req}: MyContext
    ): Promise<UserResponse> {
        const errors = validateRegister({email, username, password, confirmation});
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
                password: hashedPassword
            })
            .returning('*')
            .execute();

            user = result.raw[0];
        }catch (err) {
            if (err.code === "23505") {// duplicate username error
                return {
                    errors: [{
                        field: "username",
                        message: "username already taken",
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

    
    @Query(() => [User], {nullable:true})
    users(){
        return User.find()
    }

    @Query(() => User)
    user(
        @Arg("email")email:string
    ){
        return User.findOne({where:{email: email}})
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
    async addRole(
        @Arg('role') role: string,
        @Ctx() { req }: MyContext
    ): Promise<UserResponse> {
        const possibleRoles = ["ADMIN", "REGULAR", "PROVIDER"]
        const entityManager = getManager();
        if(!req.session.userId){
            return {
                errors: [
                    {
                        field: "",
                        message: "porfavor haga login",
                    },
                ],
            };
        }
        if(!possibleRoles.includes(role)){
            return {
                errors: [
                    {
                        field: "",
                        message: "este rol de usuario es invalido",
                    },
                ],
            };
        }
        let user = await User.findOne({where: {id: req.session.userId}});
        if(user?.roles.includes(role)){
            return {user,};
        }
        user?.roles.push(role);
        entityManager.save(user);
        return {user,};
    }

    @Mutation(() => UserResponse)
    async removeRole(
        @Arg('role') role: string,
        @Ctx() { req }: MyContext
    ): Promise<UserResponse> {
        if(!req.session.userId){
            return {
                errors: [
                    {
                        field: "",
                        message: "porfavor haga login",
                    },
                ],
            };
        }
        
        let user = await User.findOne({where: {id: req.session.userId}});
        
        if(user){
            const entityManager = getManager();
            const new_roles = user?.roles.filter((curr_role) => {return curr_role != role});
            user.roles = new_roles as string []
            entityManager.save(user);
        }
        
        return {user,};
    }
}