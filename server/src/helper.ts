import { createHash } from "crypto";

export function celsiusToFahrenheit(celsius: number): number {
    return (celsius * 9.0 / 5.0 + 32.0);
}

export function hashPassword(password: string): string {
    const hasher = createHash('sha256');
    return hasher.update(password).digest('hex');
}

function toCamelCase(str: string): string {
    return str.replace(/([-_][a-z])/g, (group) =>
        group.toUpperCase().replace('-', '').replace('_', '')
    );
}

export function keysToCamelCase<T>(obj: Record<string, any>): T {
    const newObj: Record<string, any> = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const camelKey = toCamelCase(key);
            newObj[camelKey] = obj[key];
        }
    }
    return newObj as T;
}