import { useController } from "react-hook-form";
import { GET_TOPICS } from "@/lib/queries";
import { useQuery } from "@apollo/client/react";

export interface TopicSelectFieldsetProps {
    label: string;
    error?: string;
    control: any;
    name: string;
}

export const TopicSelectFieldset = ({ label, error, control, name }: TopicSelectFieldsetProps) => {
    const { data, loading, error: queryError } = useQuery(GET_TOPICS);

    const {
        field: { value, onChange, onBlur, ref },
    } = useController({ name, control });

    return (
        <fieldset className="fieldset">
            <legend className="fieldset-legend">{label}</legend>
            <select className="select w-full" ref={ref} value={value ?? ""} onChange={(e) => onChange(e.target.value)} onBlur={onBlur}>
                <option value="0">
                    {loading ? "Loading topics..." : "Select a Topic"}
                </option>
                {data?.topics?.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                        {topic.topic}
                    </option>
                ))}
            </select>
            <p className="label">{error}</p>
        </fieldset>
    );
};
