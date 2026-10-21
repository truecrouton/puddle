import { RefreshCcw, ArrowUpDown, ToggleLeft, ToggleRight, Eye, EyeClosed, EyeDashed, CircleQuestionMark } from "lucide-react";
import { ReactNode } from "react";
import { ResultOf } from '@graphql-typed-document-node/core';
import { GET_CONTROLS } from "@/lib/queries";

type GetControlsResult = ResultOf<typeof GET_CONTROLS>;
type Control = GetControlsResult['controls'][number];

function getIcon(control: Control) {
    const middleDevices = ['dimmable', 'positionable'];

    if (middleDevices.includes(control.kind) && !isNaN(Number(control.state))) return <EyeDashed className="w-5 h-5 mr-2" />;
    else if (control.state == control.valueOn) return <Eye className="w-5 h-5 mr-2" />;
    else if (control.state == control.valueOff) return <EyeClosed className="w-5 h-5 mr-2" />;
    else return <CircleQuestionMark className="w-5 h-5 mr-2" />;
}

interface ControlPillProps {
    control: Control;
    onClick: () => void;
}

export default function ModalActions({ control, onClick }: ControlPillProps) {
    return (
        <button className="inline-flex items-center rounded-full w-fit bg-warning text-warning-content hover:bg-accent hover:text-accent-content transition-colors duration-200 cursor-pointer px-5 py-2" onClick={onClick}>
            {getIcon(control)}
            <div className="text-left">
                <h3 className="font-bold">{control.name}</h3>
                <div className="text-xs justify-start">{control.kind}</div>
            </div>
        </button>
    );
}