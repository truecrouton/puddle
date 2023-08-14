export interface Automation {
    step_id: number;
    kind: "if" | "notify" | "publish" | "wait";
    kind_is_if?: boolean;
    kind_is_notify?: boolean;
    kind_is_publish?: boolean;
    kind_is_wait?: boolean;
    is_else_step?: boolean;
    topic_id?: number;
    topic?: string;
    message?: string;
    conditions?: Condition[];
    steps?: Automation[];
}

export type ConditionOperandKind = "preset" | "topic" | "value";
export type ConditionPreset = "date" | "time" | "month" | "day" | "season_northern" | "season_southern" | "sun_position";
export interface Condition {
    condition_id?: number;
    kind: "and" | "eq" | "or" | "gt" | "gte" | "lt" | "lte" | "neq";
    left_operand_kind: ConditionOperandKind;
    left_preset?: ConditionPreset;
    left_topic_id?: number;
    left_topic_key?: string;
    left_value?: string;
    right_operand_kind: ConditionOperandKind;
    right_preset?: ConditionPreset;
    right_topic_id?: number;
    right_topic_key?: string;
    right_value?: string;
}

const automations: Automation[] = [];

export function deleteAutomationStep(automationStepId: number) {
    const index = automations.findIndex((a) => a.step_id === automationStepId);
    if (index > -1) {
        automations.splice(index, 1);
    }
}

export function deleteConditionalStep(conditionalStepId: number) {
    for (const automation of automations) {
        let index = automation.steps?.findIndex((s) => s.step_id === conditionalStepId);
        if (index > -1) {
            automation.steps.splice(index, 1);
            break;
        }
    }
}

export function deleteCondition(conditionId: number) {
    for (const automation of automations) {
        let index = automation.conditions?.findIndex((c) => c.condition_id === conditionId);
        if (index > -1) {
            automation.conditions.splice(index, 1);
            break;
        }
    }
}

export function getAutomations(savable: boolean = false) {
    if (!savable) return automations;

    const stepKeys = ["kind", "topic_id", "message", "conditions", "steps", "is_else_step"];
    const conditionKeys = ["kind", "left_operand_kind", "left_preset", "left_topic_id", "left_topic_key", "left_value", "right_operand_kind", "right_preset", "right_topic_id", "right_topic_key", "right_value"];

    const allSteps = Object.assign([], automations);
    return allSteps.map((a) => {
        const automation = Object.assign({}, a);
        Object.keys(automation).forEach((key) => {
            if (!stepKeys.includes(key)) delete automation[key];
        });

        return {
            ...automation,
            conditions: automation.conditions.map((c) => {
                const condition = Object.assign({}, c);
                Object.keys(condition).forEach((key) => {
                    if (!conditionKeys.includes(key)) delete condition[key];
                });
                return condition;
            }),
            steps: automation.steps.map((s) => {
                const step = Object.assign({}, s);
                Object.keys(step).forEach((key) => {
                    if (!stepKeys.includes(key)) delete step[key];
                });
                return step;
            })
        };
    });
}

export function getAutomationStep(automationStepId: number) {
    return automations.find((a) => a.step_id === automationStepId);
}

export function getCondition(conditionId: number) {
    let condition: Condition;

    for (const automation of automations) {
        condition = automation.conditions?.find((c) => c.condition_id === conditionId);
        if (condition) break;
    }

    return condition;
}

export function getConditionalStep(conditionalStepId: number) {
    let conditional: Automation;

    for (const automation of automations) {
        conditional = automation.steps?.find((s) => s.step_id === conditionalStepId);
        if (conditional) break;
    }

    return conditional;
}

function nextAutomationStepId(): number {
    return Math.max(0, ...automations.map((a) => a.step_id)) + 1;
}

function nextConditionId(): number {
    const ids: number[] = [];
    for (const automation of automations) {
        if (automation.conditions) {
            ids.push(...automation.conditions.map((c) => c.condition_id));
        }
    }
    return Math.max(0, ...ids) + 1;
}

function nextConditionalStepId(): number {
    const ids: number[] = [];
    for (const automation of automations) {
        if (automation.steps) {
            ids.push(...automation.steps.map((s) => s.step_id));
        }
    }
    return Math.max(0, ...ids) + 1;
}

export function upsertCondition(automationId: number, condition: Condition) {
    const automation = automations.find((a) => a.step_id === automationId);
    if (!automation) return;

    if (condition.condition_id > 0) {
        const conditionIndex = automation.conditions?.findIndex((c) => c.condition_id === condition.condition_id);
        if (conditionIndex > -1) {
            automation.conditions[conditionIndex] = condition;
        }
    }
    else {
        automation.conditions.push({ ...condition, condition_id: nextConditionId() });
    }
}

export function upsertAutomationStep(automation: Automation) {
    const stepIndex = automations.findIndex((a) => a.step_id === automation.step_id);

    if (automation.step_id > 0 && stepIndex > -1) {
        automations[stepIndex] = automation;
    }
    else {
        automations.push(<Automation>{
            ...automation,
            steps: automation.steps ?? [],
            else_steps: [],
            conditions: automation.conditions ?? [],
            step_id: nextAutomationStepId()
        });
    }
}

export function upsertConditionalStep(automationId: number, step: Partial<Automation>) {
    if (automationId > 0) {
        const automation = automations.find((a) => a.step_id === automationId);
        if (!automation) return;

        automation.steps.push(<Automation>{ ...step, step_id: nextConditionalStepId() });
    }
    else if (step.step_id > 0) {
        for (const automation of automations) {
            let index = automation.steps?.findIndex((s) => s.step_id === step.step_id);
            if (index > -1) {
                automation.steps[index] = <Automation>step;
                break;
            }
        }
    }
}