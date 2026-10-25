'use client';

import { QueryRef, useReadQuery } from '@apollo/client/react';
import { CornerDownRight, Plus, Settings, Split } from "lucide-react";
import { Automation, Expression } from 'puddle-graphql';
import ExpressionItem from './ExpressionItem';
import { useState } from 'react';
import ExpressionModal from './ExpressionModal';
import AutomationModal from './AutomationModal';

interface AutomationListProps {
    queryRef: QueryRef<any>;
}

export default function AutomationList({ queryRef }: AutomationListProps) {
    const [selectedConditional, setSelectedConditional] = useState<Expression | null>(null);
    const [isExpressionModalOpen, setIsExpressionModalOpen] = useState(false);
    const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);

    const { data } = useReadQuery(queryRef);
    const automation = data.automation as Automation;

    const handleAutomationClick = () => {
        setIsAutomationModalOpen(true);
    };

    const handleExpressionClick = (expression: Expression) => {
        setSelectedConditional(expression);
        setIsExpressionModalOpen(true);
    };

    return (
        <>
            <h3 className="text-2xl font-normal mb-6">
                You're setting up an automation named <strong>{automation?.name}</strong>.
                <button className="btn btn-primary btn-sm btn-circle ml-3" onClick={() => handleAutomationClick()}>
                    <Settings />
                </button>
            </h3>
            <ul className="list bg-base-100">
                {automation?.expressions.filter((e) => (!e.conditionalExpressionId)).map((expression) => (
                    <li className="list-row px-0" key={expression.id}>
                        <div>{expression.kind == 'if' ? <Split className="w-6 h-6 mr-2" /> : <CornerDownRight className="w-6 h-6 mr-2" />}</div>
                        <div>
                            <ExpressionItem conditional={expression} onClick={() => handleExpressionClick(expression)} key={expression.id} />
                            {expression.kind == 'if' && <>
                                {
                                    automation.expressions.filter((e) => !e.isElseStep && e.conditionalExpressionId == expression.id).map((conditional) => (
                                        <ExpressionItem conditional={conditional} onClick={() => handleExpressionClick(conditional)} key={conditional.id} />
                                    ))
                                }
                                <button className="btn btn-primary btn-sm btn-circle mb-3" onClick={() => handleExpressionClick({ ...expression, id: 0, conditionalExpressionId: expression.id, isElseStep: false })}>
                                    <Plus />
                                </button>
                                <div className="flex gap-2 mb-3">
                                    <span className="text-xl text-primary font-semibold shrink-0">ELSE</span>
                                </div>
                                {
                                    automation.expressions.filter((e) => e.isElseStep && e.conditionalExpressionId == expression.id).map((conditional) => (
                                        <ExpressionItem conditional={conditional} onClick={() => handleExpressionClick(conditional)} key={conditional.id} />
                                    ))
                                }
                                <button className="btn btn-primary btn-sm btn-circle mb-3" onClick={() => handleExpressionClick({ ...expression, id: 0, conditionalExpressionId: expression.id, isElseStep: true })}>
                                    <Plus />
                                </button>
                            </>}
                        </div>
                    </li>
                ))}
            </ul>
            <button className="btn btn-primary btn-sm btn-circle mb-3" onClick={() => handleExpressionClick({ id: 0, automationId: automation.id, conditionalExpressionId: 0, isElseStep: false } as Expression)}>
                <Plus />
            </button>

            {selectedConditional && <ExpressionModal isOpen={isExpressionModalOpen} onClose={() => setIsExpressionModalOpen(false)} onSuccess={() => setIsExpressionModalOpen(false)} expression={selectedConditional} />}
            <AutomationModal isOpen={isAutomationModalOpen} onClose={() => setIsAutomationModalOpen(false)} onSuccess={() => setIsAutomationModalOpen(false)} automation={automation} />
        </>
    );
}