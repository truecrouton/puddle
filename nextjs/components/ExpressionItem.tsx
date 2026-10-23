import { LucideIcon, PencilSparkles, RotateCwFadingClock, SatelliteDish, Split, SquarePlay } from "lucide-react";
import { Expression } from "puddle-graphql";

interface ExpressionItemProps {
    conditional: Expression;
    onClick: () => void;
}

const iconMap: Record<string, LucideIcon> = {
    publish: PencilSparkles,
    notify: SatelliteDish,
    device: SquarePlay,
    wait: RotateCwFadingClock,
};

function transformState(expression: Expression) {
    const middleDevices = ['dimmable', 'positionable'];

    if (middleDevices.includes(expression.deviceKind || '') && !isNaN(Number(expression.state))) return `(${expression.state}%)`;
    if (expression.deviceKind == 'toggleable') return expression.state == '0' ? '(Off)' : '(On)';
    else return expression.state || '?';
};

export default function ExpressionItem({ conditional, onClick }: ExpressionItemProps) {
    const IconComponent = iconMap[conditional.kind];
    return (
        <button className="text-xl flex items-center gap-2 opacity-80 cursor-pointer mb-3" onClick={onClick} >
            {conditional.kind == 'if' ? (
                <>
                    <span className="text-xl text-primary font-semibold shrink-0">IF</span>
                    <span className="text-secondary">{conditional.expression}</span>
                </>
            ) :
                conditional.kind == 'device' ? (
                    <>
                        <IconComponent className="w-5 h-5 shrink-0" />
                        <span className="text-primary shrink-0">{conditional.kind}</span >
                        <span className="text-accent">{conditional.deviceName}</span>
                        <span className="text-secondary">{transformState(conditional)}</span>
                    </>
                ) : (
                    <>
                        <IconComponent className="w-5 h-5 shrink-0" />
                        <span className="text-primary shrink-0">{conditional.kind}</span >
                        <span className="text-accent">{conditional.topic}</span>
                        <span className="text-secondary">{conditional.message}</span>
                    </>
                )}
        </button >
    );
}