export declare function hashPassword(password: string): Promise<string>;
export declare function comparePassword(password: string, hash: string): Promise<boolean>;
export declare function generateOTP(length?: number): string;
export declare function generatePNR(): string;
export declare function generateReference(): string;
