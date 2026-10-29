import { forwardRef, InputHTMLAttributes } from "react";
import { FieldError } from "react-hook-form";

export interface EmptySelectFieldsetProps {
    label: string;
}

export interface SelectFieldsetProps extends InputHTMLAttributes<HTMLSelectElement> {
    label: string;
    error?: FieldError;
    children: React.ReactNode;
}

// For use as Suspense fallback
export const EmptySelectFieldset = ({ label }: EmptySelectFieldsetProps) => {
    return (
        <fieldset className="fieldset" disabled>
            <legend className="fieldset-legend">{label}</legend>
            <select className="select w-full">
                <option>Loading options...</option>
            </select>
            <p className="label"></p>
        </fieldset>
    );
};

export const SelectFieldset = forwardRef<HTMLSelectElement, SelectFieldsetProps>(({ label, error, children, ...rest }, ref) => {
    return (
        <fieldset className="fieldset">
            <legend className="fieldset-legend">{label}</legend>
            <select className="select w-full" ref={ref} {...rest}>
                {children}
            </select>
            <p className="label">{error?.message}</p>
        </fieldset>
    );
});