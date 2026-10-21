'use client';

import { GET_AUTOMATION } from "@/lib/queries";
import { ResultOf } from '@graphql-typed-document-node/core';
import { QueryRef, useReadQuery } from '@apollo/client/react';
import { PencilSparkles, RotateCwFadingClock, SatelliteDish, Split, SquarePlay } from "lucide-react";
import { ReactNode } from "react";
import { Expression } from "@/generated/resolvers-types";

type GetAutomationResult = ResultOf<typeof GET_AUTOMATION>;
type Automation = GetAutomationResult['automation'];

const iconMap: Record<string, ReactNode> = {
    publish: <PencilSparkles className="w-5 h-5 shrink-0" />,
    notify: <SatelliteDish className="w-5 h-5 shrink-0" />,
    device: <SquarePlay className="w-5 h-5 shrink-0" />,
    wait: <RotateCwFadingClock className="w-5 h-5 shrink-0" />,
};

function transformState(expression: Expression) {
    const middleDevices = ['dimmable', 'positionable'];

    if (middleDevices.includes(expression.deviceKind || '') && !isNaN(Number(expression.state))) return `(${expression.state}%)`;
    if (expression.deviceKind == 'toggleable') return expression.state == '0' ? '(Off)' : '(On)';
    else return expression.state || '?';
};

interface AutomationListProps {
    queryRef: QueryRef<any>;
}

export default function AutomationList({ queryRef }: AutomationListProps) {
    const { data } = useReadQuery(queryRef);
    const automation = data.automation as Automation;

    return (
        <>
            <h3 className="text-2xl font-normal mb-6">You're setting up an automation named <strong>{automation?.name}</strong>.</h3>
            <ul className="list bg-base-100 rounded-box shadow-md">
                {automation?.expressions.filter((e) => (!e.conditionalExpressionId)).map((expression) => (
                    <li className="list-row px-0" key={expression.id}>
                        <div><Split className="w-10 h-10 mr-2" /></div>
                        <div>
                            <div className="flex gap-2 mb-3">
                                <span className="text-xl text-primary font-semibold shrink-0">IF</span>
                                <span className="text-xl opacity-80">{expression.expression}</span>
                            </div>
                            {
                                automation.expressions.filter((e) => !e.isElseStep && e.conditionalExpressionId == expression.id).map((conditional) => (
                                    conditional.kind == 'device' ? (
                                        <div className="text-xl flex items-center gap-2 opacity-80 mb-3" key={conditional.id}>
                                            {iconMap[conditional.kind]}
                                            <span className="text-primary shrink-0">{conditional.kind}</span>
                                            <span className="text-accent">{conditional.deviceName}</span>
                                            <span className="text-secondary">{transformState(conditional)}</span>
                                        </div>
                                    ) : (
                                        <div className="text-xl flex items-center gap-2 opacity-80 mb-3" key={conditional.id}>
                                            {iconMap[conditional.kind]}
                                            <span className="text-primary shrink-0">{conditional.kind}</span>
                                            <span className="text-accent">{conditional.topic}</span>
                                            <span className="text-secondary">{conditional.message}</span>
                                        </div>)
                                ))
                            }
                            <div className="flex gap-2 mb-3">
                                <span className="text-xl text-primary font-semibold shrink-0">ELSE</span>
                            </div>
                            {
                                automation.expressions.filter((e) => e.isElseStep && e.conditionalExpressionId == expression.id).map((conditional) => (
                                    conditional.kind == 'device' ? (
                                        <div className="text-xl flex items-center gap-2 opacity-80 mb-3" key={conditional.id}>
                                            {iconMap[conditional.kind]}
                                            <span className="text-primary shrink-0">{conditional.kind}</span>
                                            <span className="text-accent">{conditional.deviceName}</span>
                                            <span className="text-secondary">{transformState(conditional)}</span>
                                        </div>
                                    ) : (
                                        <div className="text-xl flex items-center gap-2 opacity-80 mb-3" key={conditional.id}>
                                            {iconMap[conditional.kind]}
                                            <span className="text-primary shrink-0">{conditional.kind}</span>
                                            <span className="text-accent">{conditional.topic}</span>
                                            <span className="text-secondary">{conditional.message}</span>
                                        </div>)
                                ))
                            }
                        </div>
                    </li>
                ))}
            </ul>
        </>
    );
}