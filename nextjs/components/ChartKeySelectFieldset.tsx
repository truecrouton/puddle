import { Controller } from "react-hook-form";
import { GET_TOPIC_STATUS } from "@/lib/queries";
import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { sortArray } from "@/lib/utilities";

export interface ChartKeySelectFieldsetProps {
    label: string;
    className?: string;
    control: any;
    name: string;
    topicId: number;
}

export const ChartKeySelectFieldset = ({ label, className = '', control, name, topicId }: ChartKeySelectFieldsetProps) => {
    const { data, loading, error: queryError } = useQuery(GET_TOPIC_STATUS, { variables: { id: topicId } });

    const sortedKeys = useMemo(() => {
        return sortArray(data?.topic?.status, 'name');
    }, [data]);

    return (
        <fieldset className={`fieldset ${className}`}>
            <legend className="fieldset-legend">{label}</legend>
            <Controller name={name} control={control} render={({ field, fieldState: { error } }) => (<>
                <select className="select w-full" {...field}>
                    <option value="0">
                        {loading ? "Loading keys..." : "Select a Key"}
                    </option>
                    {sortedKeys?.map((key) => (
                        <option key={key.name} value={key.name}>
                            {key.name}
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
