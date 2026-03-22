// src/modules/dmgt/utils/predicateEvaluator.ts

export interface SandboxObject {
    id: string;
    shape: 'circle' | 'square' | 'triangle' | 'pentagon';
    color: 'blue' | 'red' | 'green' | 'yellow';
    size: 'small' | 'medium' | 'large';
}

export type PredicateType =
    | 'isBlue' | 'isRed' | 'isGreen' | 'isYellow'
    | 'isCircle' | 'isSquare' | 'isTriangle'
    | 'isSmall' | 'isMedium' | 'isLarge';

export interface PredicateAST {
    type: 'forall' | 'exists' | 'not' | 'and' | 'or' | 'implies' | 'iff' | 'predicate';
    predicateName?: PredicateType;
    variable?: string;
    children?: PredicateAST[];
}

export interface EvaluationResult {
    truthValue: boolean;
    witnesses: SandboxObject[];
    counterExamples: SandboxObject[];
    evaluationTrace: EvalStep[];
}

export interface EvalStep {
    objectId: string;
    predicateName: string;
    result: boolean;
    description: string;
}

function evaluatePredicateOnObject(predName: PredicateType, obj: SandboxObject): boolean {
    switch (predName) {
        case 'isBlue': return obj.color === 'blue';
        case 'isRed': return obj.color === 'red';
        case 'isGreen': return obj.color === 'green';
        case 'isYellow': return obj.color === 'yellow';
        case 'isCircle': return obj.shape === 'circle';
        case 'isSquare': return obj.shape === 'square';
        case 'isTriangle': return obj.shape === 'triangle';
        case 'isSmall': return obj.size === 'small';
        case 'isMedium': return obj.size === 'medium';
        case 'isLarge': return obj.size === 'large';
        default: return false;
    }
}

function evaluateAST(ast: PredicateAST, obj: SandboxObject): boolean {
    switch (ast.type) {
        case 'predicate':
            return evaluatePredicateOnObject(ast.predicateName!, obj);
        case 'not':
            return !evaluateAST(ast.children![0], obj);
        case 'and':
            return ast.children!.every((c) => evaluateAST(c, obj));
        case 'or':
            return ast.children!.some((c) => evaluateAST(c, obj));
        case 'implies':
            return !evaluateAST(ast.children![0], obj) || evaluateAST(ast.children![1], obj);
        case 'iff':
            return evaluateAST(ast.children![0], obj) === evaluateAST(ast.children![1], obj);
        default:
            return false;
    }
}

export function evaluatePredicate(
    expression: PredicateAST,
    objects: SandboxObject[]
): EvaluationResult {
    const witnesses: SandboxObject[] = [];
    const counterExamples: SandboxObject[] = [];
    const evaluationTrace: EvalStep[] = [];

    if (expression.type === 'forall') {
        const innerPred = expression.children![0];
        let allTrue = true;

        for (const obj of objects) {
            const result = evaluateAST(innerPred, obj);
            evaluationTrace.push({
                objectId: obj.id,
                predicateName: expression.children![0]?.predicateName || 'compound',
                result,
                description: `∀: Testing object ${obj.id} (${obj.color} ${obj.shape}) → ${result}`,
            });
            if (result) {
                witnesses.push(obj);
            } else {
                counterExamples.push(obj);
                allTrue = false;
            }
        }

        return { truthValue: allTrue, witnesses, counterExamples, evaluationTrace };
    }

    if (expression.type === 'exists') {
        const innerPred = expression.children![0];
        let anyTrue = false;

        for (const obj of objects) {
            const result = evaluateAST(innerPred, obj);
            evaluationTrace.push({
                objectId: obj.id,
                predicateName: expression.children![0]?.predicateName || 'compound',
                result,
                description: `∃: Testing object ${obj.id} (${obj.color} ${obj.shape}) → ${result}`,
            });
            if (result) {
                witnesses.push(obj);
                anyTrue = true;
            } else {
                counterExamples.push(obj);
            }
        }

        return { truthValue: anyTrue, witnesses, counterExamples, evaluationTrace };
    }

    // Single predicate without quantifier — evaluate on all objects
    for (const obj of objects) {
        const result = evaluateAST(expression, obj);
        evaluationTrace.push({
            objectId: obj.id,
            predicateName: expression.predicateName || 'compound',
            result,
            description: `Testing ${obj.id} → ${result}`,
        });
        if (result) witnesses.push(obj);
        else counterExamples.push(obj);
    }

    return { truthValue: witnesses.length > 0, witnesses, counterExamples, evaluationTrace };
}
