import { RefreshCcw, ArrowUpDown, CircleQuestionMark, LucideIcon } from "lucide-react";

interface IconPillProps {
    icon: LucideIcon;
    text?: string;
    subText?: string;
    onClick: () => void;
}

export default function IconPill({ icon, text = '', subText = '', onClick }: IconPillProps) {
    const IconComponent = icon;

    return (
        <button className="inline-flex items-center rounded-full w-fit bg-primary text-primary-content hover:bg-accent hover:text-accent-content transition-colors duration-200 cursor-pointer px-5 py-2" onClick={onClick}>
            <IconComponent className="w-5 h-5" />
            {text && <div className="text-left ml-2">
                <h3 className="font-bold">{text}</h3>
                {subText && <div className="text-xs justify-start">{subText}</div>}
            </div>}
        </button>
    );
}