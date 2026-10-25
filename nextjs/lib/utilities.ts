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