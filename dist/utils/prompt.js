import inquirer from 'inquirer';
import chalk from 'chalk';
export async function promptWithEscape(questions, _options) {
    try {
        const modifiedQuestions = Array.isArray(questions) ? questions : [questions];
        const enhancedQuestions = modifiedQuestions.map((q) => {
            if (q.type === 'list' && q.choices) {
                const choices = [
                    ...q.choices
                ];
                choices.push(new inquirer.Separator());
                choices.push({ name: '← Back to previous menu', value: '__BACK__' });
                return {
                    ...q,
                    choices,
                };
            }
            return q;
        });
        const answers = await inquirer.prompt(enhancedQuestions);
        for (const key in answers) {
            if (answers[key] === '__BACK__') {
                return null;
            }
        }
        return answers;
    }
    catch (error) {
        if (error && typeof error === 'object' && 'isTtyError' in error) {
            process.exit(0);
        }
        throw error;
    }
}
export async function checkboxPromptWithEscape(question) {
    const backOption = {
        name: chalk.gray('← Back to previous menu'),
        value: '__BACK__',
        checked: false,
    };
    const separator = new inquirer.Separator();
    const processedChoices = [];
    processedChoices.push(backOption);
    processedChoices.push(separator);
    if (question.choices && Array.isArray(question.choices)) {
        for (const choice of question.choices) {
            processedChoices.push(choice);
        }
    }
    const modifiedQuestion = {
        type: question.type,
        name: question.name,
        message: question.message,
        choices: processedChoices,
        pageSize: question.pageSize || 20,
        validate: () => true,
    };
    const questionObj = question;
    const modifiedObj = modifiedQuestion;
    for (const key in questionObj) {
        if (key !== 'validate' &&
            key !== 'type' &&
            key !== 'name' &&
            key !== 'message' &&
            key !== 'choices' &&
            key !== 'pageSize') {
            modifiedObj[key] = questionObj[key];
        }
    }
    try {
        const answers = await inquirer.prompt([modifiedQuestion]);
        const selectedItems = answers[question.name];
        if (selectedItems && selectedItems.includes('__BACK__')) {
            return null;
        }
        if (!selectedItems || selectedItems.length === 0) {
            const { confirmBack } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirmBack',
                    message: 'No items selected. Go back to previous menu?',
                    default: true,
                },
            ]);
            if (confirmBack) {
                return null;
            }
            return checkboxPromptWithEscape(question);
        }
        const filteredResults = {
            ...answers,
            [question.name]: selectedItems.filter((item) => item !== '__BACK__'),
        };
        return filteredResults;
    }
    catch (error) {
        console.error(chalk.red('Debug: Error in checkboxPromptWithEscape:'), error);
        if (error instanceof Error) {
            console.error(chalk.red('Debug: Error message:'), error.message);
            console.error(chalk.red('Debug: Error stack:'), error.stack);
        }
        if (error && typeof error === 'object' && 'isTtyError' in error) {
            process.exit(0);
        }
        throw error;
    }
}
//# sourceMappingURL=prompt.js.map