import { forwardRef, InputHTMLAttributes } from "react";
import { FieldError } from "react-hook-form";

export interface InputFieldsetProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: FieldError;
}

export const InputFieldset = forwardRef<HTMLInputElement, InputFieldsetProps>(({ label, error, ...rest }, ref) => {
    return (
        <fieldset className="fieldset">
            <legend className="fieldset-legend">{label}</legend>
            <input type="text" className="input w-full" ref={ref} {...rest} />
            <p className="label text-error-content">{error?.message}</p>
        </fieldset>
    );
});