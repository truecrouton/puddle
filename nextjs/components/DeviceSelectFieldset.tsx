import { Controller, useController } from "react-hook-form";
import { GET_DEVICE_STUBS } from "@/lib/queries";
import { useQuery, } from "@apollo/client/react";
import { Device } from "puddle-graphql";
import { useMemo } from "react";
import { sortArray } from "@/lib/utilities";

export interface DeviceSelectFieldsetProps {
    label: string;
    control: any;
    name: string;
}

export const DeviceSelectFieldset = ({ label, control, name }: DeviceSelectFieldsetProps) => {
    const { data, loading, error: queryError } = useQuery(GET_DEVICE_STUBS);

    const sortedDevices = useMemo(() => {
        return sortArray(data?.devices, 'name');
    }, [data]);

    return (
        <fieldset className="fieldset">
            <legend className="fieldset-legend">{label}</legend>
            <Controller name={name} control={control} render={({ field, fieldState: { error } }) => (<>
                <select className="select w-full" {...field}>
                    <option value="0">
                        {loading ? "Loading devices..." : "Select a Device"}
                    </option>
                    {sortedDevices?.map((device) => (
                        <option key={device.id} value={device.id}>
                            {device.name}
                        </option>
                    ))}
                </select>
                <p className="label">{error?.message}</p>
            </>
            )}
            />
        </fieldset >
    );
};
