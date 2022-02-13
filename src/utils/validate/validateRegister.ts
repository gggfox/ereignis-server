import { UsernamePasswordInput } from "../../types/UsernamePasswordInput";

export const validateRegister = (options: UsernamePasswordInput) => {
    let errors = [];
    if(!options.email.includes('@')){
        errors.push(
            {
                field: "email",
                message: "Email invalido",
            },
        );
    }
    if(options.username.includes("@")){
        errors.push(
            {
                field: "username",
                message: "El nombre no puede llevar @",
            },
        );
    }
    if(options.username.length <= 2){
        errors.push(
            {
                field: "username",
                message: "El tamaño debe de ser mayor a 2",
            },
        );
    }
    if(options.password.length <= 2){
        errors.push(
            {
                field: "password",
                message: "El tamaño debe de ser mayor a 2",
            },
        );
    }
    if(options.password !== options.confirmation){
        errors.push(
            {
                field: "confirmation",
                message: "Las contraseñas no son iguales",
            },
        );
    }
    if(errors.length > 0){
        return errors;
    }
    return null;
}