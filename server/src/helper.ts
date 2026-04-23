import { createHash } from "crypto";

export function celsiusToFahrenheit(celsius: number | string): string {
    const degress = Number(celsius);
    if (isNaN(degress)) return '';
    return (degress * 9.0 / 5.0 + 32.0).toFixed(2);
}

export function hashPassword(password: string): string {
    const hasher = createHash('sha256');
    return hasher.update(password).digest('hex');
}