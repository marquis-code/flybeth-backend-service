// src/common/utils/crypto.util.ts
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
}

export async function comparePassword(
    password: string,
    hash: string,
): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export function generateOTP(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
}

export function generatePNR(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let pnr = '';
    for (let i = 0; i < 6; i++) {
        pnr += characters[Math.floor(Math.random() * characters.length)];
    }
    return pnr;
}

export function generateReference(): string {
    return `REF-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;
}
