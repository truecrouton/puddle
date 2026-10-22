import { RefreshCcw, ArrowUpDown, CircleQuestionMark, LucideIcon } from "lucide-react";
import { Device } from "puddle-graphql";

export const iconMap: Record<string, LucideIcon> = {
    positionable: ArrowUpDown,
    toggleable: RefreshCcw
};

interface DevicePillProps {
    device: Device;
    onClick: () => void;
}

export default function DevicePill({ device, onClick }: DevicePillProps) {
    const IconComponent = iconMap[device.kind] || CircleQuestionMark;

    return (
        <button className="inline-flex items-center rounded-full w-fit bg-warning text-warning-content hover:bg-accent hover:text-accent-content transition-colors duration-200 cursor-pointer px-5 py-2" onClick={onClick}>
            <IconComponent className="w-5 h-5 mr-2" />
            <div className="text-left">
                <h3 className="font-bold">{device.name}</h3>
                <div className="text-xs justify-start">{device.kind}</div>
            </div>
        </button>
    );
}