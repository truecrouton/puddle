import { BatteryCharging, CircleQuestionMark, LucideIcon, ThermometerSun, WavesVertical } from "lucide-react";
import { Favorite } from "puddle-graphql";

const iconMap: Record<string, LucideIcon> = {
    temperature: ThermometerSun,
    humidity: WavesVertical,
    battery: BatteryCharging,
};

export const stateMap: Record<string, string> = {
    battery: '%',
    humidity: '%',
    illuminance: '',
    illuminance_lux: 'lx',
    position: '%',
    power: 'w',
    temperature: '°F',
};

interface FavoritePillProps {
    favorite: Favorite;
    onClick: () => void;
}

export default function FavoritePill({ favorite, onClick }: FavoritePillProps) {
    const IconComponent = iconMap[favorite.stateKey] || CircleQuestionMark;
    return (
        <button className="inline-flex items-center rounded-full w-fit bg-base-300 text-base-content hover:bg-accent hover:text-accent-content transition-colors duration-200 cursor-pointer px-5 py-2" onClick={onClick}>
            <IconComponent className="w-5 h-5 mr-2" />
            <div className="text-left">
                <h3 className="font-bold">{favorite.name}</h3>
                <div className="text-xs justify-start">{favorite.stateKey}</div>
            </div>
            <h3 className="font-bold ml-2">
                {`${favorite.state}${stateMap[favorite.stateKey]}`}
            </h3>
        </button>
    );
}