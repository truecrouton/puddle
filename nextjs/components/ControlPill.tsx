import { Eye, EyeClosed, EyeDashed, CircleQuestionMark, LucideIcon } from "lucide-react";
import { Control } from "puddle-graphql";

function getIcon(control: Control): LucideIcon {
    const middleDevices = ['dimmable', 'positionable'];

    if (middleDevices.includes(control.kind) && !isNaN(Number(control.state))) return EyeDashed;
    else if (control.state == control.valueOn) return Eye;
    else if (control.state == control.valueOff) return EyeClosed;
    else return CircleQuestionMark;
}

interface ControlPillProps {
    control: Control;
    onClick: () => void;
}

export default function ModalActions({ control, onClick }: ControlPillProps) {
    const IconComponent = getIcon(control);

    return (
        <button className="inline-flex items-center rounded-full w-fit bg-warning text-warning-content hover:bg-accent hover:text-accent-content transition-colors duration-200 cursor-pointer px-5 py-2" onClick={onClick}>
            <IconComponent className="w-5 h-5 mr-2" />
            <div className="text-left">
                <h3 className="font-bold">{control.name}</h3>
                <div className="text-xs justify-start">{control.kind}</div>
            </div>
        </button>
    );
}