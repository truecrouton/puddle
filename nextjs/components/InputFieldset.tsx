import { forwardRef, InputHTMLAttributes } from "react";
import { FieldError } from "react-hook-form";

export interface InputFieldsetProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    type?: string;
    error?: FieldError;
    hidden?: boolean;
    className?: string;
}

export const InputFieldset = forwardRef<HTMLInputElement, InputFieldsetProps>(({ label, type = 'text', error, className = '', hidden = false, ...rest }, ref) => {
    return (
        <fieldset className={`fieldset ${className} ${hidden ? 'hidden' : ''}`}>
            <legend className="fieldset-legend">{label}</legend>
            <input type={type} className="input w-full" ref={ref} {...rest} />
            <p className="label">{error?.message}</p>
        </fieldset>
    );
});