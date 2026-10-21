// lib/validated-action.ts
import { ZodType, flattenError } from "zod";

type ActionResponse<T> = {
    success: boolean;
    errors?: Record<string, string[] | undefined>;
    message: string;
    data?: T;
};

// A reusable wrapper function for any Server Action
export function validatedAction<TInput, TResult>(
    schema: ZodType<TInput>,
    handler: (data: TInput, formData: FormData) => Promise<TResult>
) {
    return async (prevState: any, formData: FormData): Promise<ActionResponse<TResult>> => {
        // 1. Convert FormData into a plain object for Zod to parse
        const rawData = Object.fromEntries(formData.entries());

        const result = schema.safeParse(rawData);

        // 2. If validation fails, return structured field errors automatically
        if (!result.success) {
            const flattened = flattenError(result.error);
            console.error(flattened.fieldErrors);
            return {
                success: false,
                errors: flattened.fieldErrors,
                message: "Please fix the validation errors below.",
            };
        }

        try {
            // 3. If valid, pass the clean, typed data to your actual action handler
            const data = await handler(result.data, formData);
            return { success: true, message: "", data };
        } catch (error: any) {
            return { success: false, message: error.message || "An unexpected error occurred." };
        }
    };
}