export interface Expression {
    expression_id: number;
    kind: "if" | "notify" | "publish" | "wait";
    kind_is_if?: boolean;
    kind_is_notify?: boolean;
    kind_is_publish?: boolean;
    kind_is_wait?: boolean;
    is_else_step?: boolean;
    topic_id?: number;
    topic?: string;
    message?: string;
    expression?: string;
    nested_expressions?: Expression[];
}

export type ConditionOperandKind = "preset" | "topic" | "value";

const expressions: Expression[] = [];

export function deleteExpression(expressionId: number) {
    const index = expressions.findIndex((a) => a.expression_id === expressionId);
    if (index > -1) {
        expressions.splice(index, 1);
    }
}

export function deleteConditional(conditionalId: number) {
    for (const automation of expressions) {
        let index = automation.nested_expressions?.findIndex((s) => s.expression_id === conditionalId);
        if (index > -1) {
            automation.nested_expressions.splice(index, 1);
            break;
        }
    }
}

export function getExpressions(savable: boolean = false) {
    if (!savable) return expressions;

    const keysToSave = ["kind", "topic_id", "message", "nested_expressions", "expression", "is_else_step"];
    const valuesToDelete = [undefined, null];

    const allExprs = Object.assign([], expressions);
    const exprs = allExprs.map((e) => {
        const expression = Object.assign({}, e);

        Object.keys(expression).forEach((key) => {
            if (!keysToSave.includes(key)) delete expression[key];
            if (valuesToDelete.includes(expression[key])) delete expression[key];
        });

        return {
            ...expression,
            topic_id: expression.topic_id || 0,
            nested_expressions: expression.nested_expressions.map((e) => {
                const nexpr = Object.assign({}, e);
                Object.keys(nexpr).forEach((key) => {
                    if (!keysToSave.includes(key)) delete nexpr[key];
                    if (!nexpr[key]) delete nexpr[key];
                });
                return nexpr;
            })
        };
    });

    return exprs;
}

export function getExpression(expressionId: number) {
    return expressions.find((a) => a.expression_id === expressionId);
}

export function getConditional(conditionalId: number) {
    let conditional: Expression;

    for (const automation of expressions) {
        conditional = automation.nested_expressions?.find((s) => s.expression_id === conditionalId);
        if (conditional) break;
    }

    return conditional;
}

function nextExpressionId(): number {
    return Math.max(0, ...expressions.map((e) => e.expression_id)) + 1;
}

function nextConditionalId(): number {
    const ids: number[] = [];
    for (const expr of expressions) {
        if (expr.nested_expressions) {
            ids.push(...expr.nested_expressions.map((ne) => ne.expression_id));
        }
    }
    return Math.max(0, ...ids) + 1;
}

export function upsertExpression(expression: Expression) {
    const stepIndex = expressions.findIndex((a) => a.expression_id === expression.expression_id);

    if (expression.expression_id > 0 && stepIndex > -1) {
        expressions[stepIndex] = expression;
    }
    else {
        expressions.push(<Expression>{
            ...expression,
            expression_id: nextExpressionId(),
            expression: expression.expression,
            nested_expressions: expression.nested_expressions ?? [],
            else_steps: [],
        });
    }
}

export function upsertConditional(expressionId: number, conditional: Partial<Expression>) {
    if (expressionId > 0) {
        const automation = expressions.find((a) => a.expression_id === expressionId);
        if (!automation) return;

        automation.nested_expressions.push(<Expression>{ ...conditional, expression_id: nextConditionalId() });
    }
    else if (conditional.expression_id > 0) {
        for (const automation of expressions) {
            let index = automation.nested_expressions?.findIndex((s) => s.expression_id === conditional.expression_id);
            if (index > -1) {
                automation.nested_expressions[index] = <Expression>conditional;
                break;
            }
        }
    }
}