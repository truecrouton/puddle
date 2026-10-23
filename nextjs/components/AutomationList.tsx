'use client';

import { QueryRef, useReadQuery } from '@apollo/client/react';
import { Plus, Split } from "lucide-react";
import { Automation, Expression } from 'puddle-graphql';
import ExpressionItem from './ExpressionItem';
import { useState } from 'react';
import ExpressionModal from './ExpressionModal';

interface AutomationListProps {
    queryRef: QueryRef<any>;
}

export default function AutomationList({ queryRef }: AutomationListProps) {
    const [selectedConditional, setSelectedConditional] = useState<Expression | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data } = useReadQuery(queryRef);
    const automation = data.automation as Automation;

    const handleExpressionClick = (expression: Expression) => {
        setSelectedConditional(expression);
        setIsModalOpen(true);
    };

    return (
        <>
            <h3 className="text-2xl font-normal mb-6">You're setting up an automation named <strong>{automation?.name}</strong>.</h3>
            <ul className="list bg-base-100">
                {automation?.expressions.filter((e) => (!e.conditionalExpressionId)).map((expression) => (
                    <li className="list-row px-0" key={expression.id}>
                        <div><Split className="w-10 h-10 mr-2" /></div>
                        <div>
                            <ExpressionItem conditional={expression} onClick={() => handleExpressionClick(expression)} key={expression.id} />
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
                        </div>
                    </li>
                ))}
            </ul>
            <button className="btn btn-primary btn-sm btn-circle mb-3" onClick={() => handleExpressionClick({ id: 0, automationId: automation.id, conditionalExpressionId: 0, isElseStep: false } as Expression)}>
                <Plus />
            </button>

            {selectedConditional && <ExpressionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => setIsModalOpen(false)} expression={selectedConditional} />}
        </>
    );
}