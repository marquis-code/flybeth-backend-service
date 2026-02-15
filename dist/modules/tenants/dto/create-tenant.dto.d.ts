export declare class CreateTenantDto {
    name: string;
    slug: string;
    domain?: string;
    contactEmail: string;
    contactPhone?: string;
    address?: string;
    description?: string;
    logo?: string;
    defaultCurrency?: string;
    supportedCurrencies?: string[];
    markupPercentage?: number;
    commissionPercentage?: number;
}
export declare class UpdateTenantDto {
    name?: string;
    domain?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    description?: string;
    logo?: string;
    defaultCurrency?: string;
    supportedCurrencies?: string[];
    markupPercentage?: number;
    commissionPercentage?: number;
    allowB2C?: boolean;
    allowB2B?: boolean;
}
export declare class UpdateTenantStatusDto {
    status: string;
}
