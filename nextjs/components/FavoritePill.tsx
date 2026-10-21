import { BatteryCharging, ThermometerSun, WavesVertical } from "lucide-react";
import { ReactNode } from "react";
import { ResultOf } from '@graphql-typed-document-node/core';
import { GET_FAVORITES } from "@/lib/queries";

type GetFavoritesResult = ResultOf<typeof GET_FAVORITES>;
type Favorite = GetFavoritesResult['favorites'][number];

const iconMap: Record<string, ReactNode> = {
    temperature: <ThermometerSun className="w-5 h-5 mr-2" />,
    humidity: <WavesVertical className="w-5 h-5 mr-2" />,
    battery: <BatteryCharging className="w-5 h-5 mr-2" />,
};

interface FavoritePillProps {
    favorite: Favorite;
    onClick: () => void;
}

export default function FavoritePill({ favorite, onClick }: FavoritePillProps) {
    return (
        <button className="inline-flex items-center rounded-full w-fit bg-base-300 text-base-content hover:bg-accent hover:text-accent-content transition-colors duration-200 cursor-pointer px-5 py-2" onClick={onClick}>
            {iconMap[favorite.stateKey]}
            <div className="text-left">
                <h3 className="font-bold">{favorite.name}</h3>
                <div className="text-xs justify-start">{favorite.stateKey}</div>
            </div>
            <div className="w-5 ml-2">
                <h1 className="font-bold">
                    {favorite.state}
                </h1>
            </div>
        </button>
    );
}