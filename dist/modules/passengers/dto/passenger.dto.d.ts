export declare class CreatePassengerDto {
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    gender?: string;
    nationality?: string;
    passportNumber?: string;
    passportExpiry?: string;
    passportCountry?: string;
    email?: string;
    phone?: string;
    type?: string;
}
export declare class UpdatePassengerDto extends CreatePassengerDto {
}
