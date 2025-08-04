import { QuestionCollection, Answers, CheckboxQuestion } from 'inquirer';
export declare function promptWithEscape<T extends Answers = Answers>(questions: QuestionCollection<T>, _options?: {
    showEscapeHint?: boolean;
}): Promise<T | null>;
export declare function checkboxPromptWithEscape<T extends Answers = Answers>(question: CheckboxQuestion<T>): Promise<T | null>;
//# sourceMappingURL=prompt.d.ts.map