import { ArrowUpDown, Sun, Clock, Hand, BookType } from "lucide-react";
import { ReactNode } from "react";
import { ResultOf } from '@graphql-typed-document-node/core';
import { GET_AUTOMATIONS } from "@/lib/queries";
import Link from "next/link";

type GetAutomationsResult = ResultOf<typeof GET_AUTOMATIONS>;
type Automation = GetAutomationsResult['automations'][number];

export const iconMap: Record<string, ReactNode> = {
    sun: <Sun className="w-5 h-5 mr-2" />,
    time: <Clock className="w-5 h-5 mr-2" />,
    topic: <BookType className="w-5 h-5 mr-2" />,
    user: <Hand className="w-5 h-5 mr-2" />,
};

interface AutomationPillProps {
    automation: Automation;
}

export default function AutomationPill({ automation }: AutomationPillProps) {
    return (
        <Link className="inline-flex items-center rounded-full w-fit bg-warning text-warning-content hover:bg-accent hover:text-accent-content transition-colors duration-200 cursor-pointer px-5 py-2" href={`/automations/${automation.id}`}>
            {iconMap[automation.trigger]}
            <div className="text-left">
                <h3 className="font-bold">{automation.name}</h3>
                <div className="text-xs justify-start">{automation.trigger}</div>
            </div>
        </Link>
    );
}