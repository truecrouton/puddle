import { Sun, Clock, Hand, BookType, CircleQuestionMark, LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import Link from "next/link";
import { Automation } from "puddle-graphql";

export const iconMap: Record<string, LucideIcon> = {
    sun: Sun,
    time: Clock,
    topic: BookType,
    user: Hand,
};

interface AutomationPillProps {
    automation: Automation;
}

export default function AutomationPill({ automation }: AutomationPillProps) {
    const IconComponent = iconMap[automation.trigger] || CircleQuestionMark;

    return (
        <Link className="inline-flex items-center rounded-full w-fit bg-warning text-warning-content hover:bg-accent hover:text-accent-content transition-colors duration-200 cursor-pointer px-5 py-2" href={`/automations/${automation.id}`}>
            <IconComponent className="w-5 h-5 mr-2" />
            <div className="text-left">
                <h3 className="font-bold">{automation.name}</h3>
                <div className="text-xs justify-start">{automation.trigger}</div>
            </div>
        </Link>
    );
}