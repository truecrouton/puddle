export function capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export function celsiusToFahrenheit(celsius: number | string): string {
    const degress = Number(celsius);
    if (isNaN(degress)) return '';
    return (degress * 9.0 / 5.0 + 32.0).toFixed(2);
}

export function sortArray<T>(array: T[] | undefined | null, over: keyof T): T[] {
    if (!array) return [];

    return [...array].sort((a, b) => {
        const valA = a[over];
        const valB = b[over];

        // Handle alphabetical sorting for strings safely
        if (typeof valA === 'string' && typeof valB === 'string') {
            return valA.localeCompare(valB);
        }

        // Fallback comparison for numbers or other types
        if (valA < valB) return -1;
        if (valA > valB) return 1;
        return 0;
    });
}