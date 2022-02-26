import { AddressInput } from "../../types/AddressInput";

export const validateAddress = (input: AddressInput) => {
    let errors = [];
    if(input.street === ""){
        errors.push(
            {
                field: "street",
                message: "el nombre de calle no puede estar vacio",
            },
        );
    }
    if(input.zip.length !== 5){
        errors.push(
            {
                field: "zip",
                message: "el codigo postal lleva 5 numeros",
            },
        );
    }
    if(errors.length > 0){
        return errors;
    }
    return null;
}