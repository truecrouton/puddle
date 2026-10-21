import { RefreshCcw, ArrowUpDown } from "lucide-react";
import { ReactNode } from "react";
import { ResultOf } from '@graphql-typed-document-node/core';
import { GET_DEVICE_STUBS } from "@/lib/queries";

type GetDevicesResult = ResultOf<typeof GET_DEVICE_STUBS>;
type Device = GetDevicesResult['devices'][number];

export const iconMap: Record<string, ReactNode> = {
    positionable: <ArrowUpDown className="w-5 h-5 mr-2" />,
    toggleable: <RefreshCcw className="w-5 h-5 mr-2" />
};

interface DevicePillProps {
    device: Device;
    onClick: () => void;
}

export default function DevicePill({ device, onClick }: DevicePillProps) {
    return (
        <button className="inline-flex items-center rounded-full w-fit bg-warning text-warning-content hover:bg-accent hover:text-accent-content transition-colors duration-200 cursor-pointer px-5 py-2" onClick={onClick}>
            {iconMap[device.kind]}
            <div className="text-left">
                <h3 className="font-bold">{device.name}</h3>
                <div className="text-xs justify-start">{device.kind}</div>
            </div>
        </button>
    );
}