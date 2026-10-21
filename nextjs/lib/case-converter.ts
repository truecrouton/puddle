// utils/caseConverter.ts
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