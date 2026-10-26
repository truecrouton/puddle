import { useController } from "react-hook-form";
import { GET_DEVICE_STUBS } from "@/lib/queries";
import { useQuery, } from "@apollo/client/react";
import { Device } from "puddle-graphql";

export interface DeviceSelectFieldsetProps {
    label: string;
    error?: string;
    control: any;
    name: string;
}

export const DeviceSelectFieldset = ({ label, error, control, name }: DeviceSelectFieldsetProps) => {
    const { data, loading, error: queryError } = useQuery(GET_DEVICE_STUBS);

    const {
        field: { value, onChange, onBlur, ref },
    } = useController({ name, control, });

    return (
        <fieldset className="fieldset">
            <legend className="fieldset-legend">{label}</legend>
            <select className="select w-full" ref={ref} value={value ?? ""} onChange={(e) => onChange(e.target.value)} onBlur={onBlur}>
                <option value="0">
                    {loading ? "Loading devices..." : "Select a Device"}
                </option>
                {data?.devices?.map((device) => (
                    <option key={device.id} value={device.id}>
                        {device.name}
                    </option>
                ))}
            </select>
            <p className="label">{error}</p>
        </fieldset >
    );
};
