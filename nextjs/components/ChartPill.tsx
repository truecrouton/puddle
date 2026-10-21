import { BatteryCharging, Sun, ThermometerSun, UserRoundGroup, WavesVertical, Wifi } from "lucide-react";
import { ReactNode } from "react";
import { Chart } from "@/generated/resolvers-types";

const iconMap: Record<string, ReactNode> = {
    temperature: <ThermometerSun className="w-5 h-5 mr-2" />,
    humidity: <WavesVertical className="w-5 h-5 mr-2" />,
    battery: <BatteryCharging className="w-5 h-5 mr-2" />,
    illuminance: <Sun className="w-5 h-5 mr-2" />,
    illuminance_lux: <Sun className="w-5 h-5 mr-2" />,
    linkquality: <Wifi className="w-5 h-5 mr-2" />,
    occupancy: <UserRoundGroup className="w-5 h-5 mr-2" />,
};

interface ChartPillProps {
    chart: Chart;
    onClick: () => void;
}

export default function ChartPill({ chart, onClick }: ChartPillProps) {
    return (
        <button className="inline-flex items-center rounded-full w-fit bg-warning text-warning-content hover:bg-accent hover:text-accent-content transition-colors duration-200 cursor-pointer px-5 py-2" onClick={onClick}>
            {iconMap[chart.key]}
            <div className="text-left">
                <h3 className="font-bold">{chart.name}</h3>
                <div className="text-xs justify-start">{chart.key}</div>
            </div>
        </button>
    );
}