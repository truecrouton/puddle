import { forwardRef, InputHTMLAttributes } from "react";
import { FieldError } from "react-hook-form";

export interface InputFieldsetProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: FieldError;
    hidden?: boolean;
}

export const InputFieldset = forwardRef<HTMLInputElement, InputFieldsetProps>(({ label, error, hidden = false, ...rest }, ref) => {
    return (
        <fieldset className={`fieldset ${hidden ? 'hidden' : ''}`}>
            <legend className="fieldset-legend">{label}</legend>
            <input type="text" className="input w-full" ref={ref} {...rest} />
            <p className="label text-error-content">{error?.message}</p>
        </fieldset>
    );
});