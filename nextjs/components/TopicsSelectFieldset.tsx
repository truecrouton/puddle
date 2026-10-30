import { Controller } from "react-hook-form";
import { GET_TOPICS } from "@/lib/queries";
import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { sortArray } from "@/lib/utilities";

export interface TopicSelectFieldsetProps {
    label: string;
    control: any;
    name: string;
}

export const TopicSelectFieldset = ({ label, control, name }: TopicSelectFieldsetProps) => {
    const { data, loading, error: queryError } = useQuery(GET_TOPICS);

    const sortedTopics = useMemo(() => {
        return sortArray(data?.topics, 'topic');
    }, [data]);

    return (
        <fieldset className="fieldset">
            <legend className="fieldset-legend">{label}</legend>
            <Controller name={name} control={control} render={({ field, fieldState: { error } }) => (<>
                <select className="select w-full" {...field}>
                    <option value="0">
                        {loading ? "Loading topics..." : "Select a Topic"}
                    </option>
                    {sortedTopics?.map((topic) => (
                        <option key={topic.id} value={topic.id}>
                            {topic.topic}
                        </option>
                    ))}
                </select>
                <p className="label">{error?.message}</p>
            </>
            )}
            />
        </fieldset>
    );
};
