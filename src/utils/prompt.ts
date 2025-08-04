import inquirer, { QuestionCollection, Answers, DistinctQuestion, CheckboxQuestion } from 'inquirer';
import chalk from 'chalk';

// Custom prompt wrapper that handles ESC key
export async function promptWithEscape<T extends Answers = Answers>(
  questions: QuestionCollection<T>,
  _options?: { showEscapeHint?: boolean }
): Promise<T | null> {
  // ESC hint removed - we'll use explicit back options instead

  try {
    // Inquirer doesn't directly support ESC key handling in a clean way
    // We'll use a workaround by adding a "← Back" option to list prompts
    const modifiedQuestions = Array.isArray(questions) ? questions : [questions];

    const enhancedQuestions = modifiedQuestions.map((q: DistinctQuestion) => {
      if (q.type === 'list' && q.choices) {
        // Add back option to list choices
        const choices: Array<{ name: string; value: string } | inquirer.Separator> = [
          ...(q.choices as Array<{ name: string; value: string }>)
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

    const answers = await inquirer.prompt(enhancedQuestions as QuestionCollection);

    // Check if user selected back option
    for (const key in answers) {
      if (answers[key] === '__BACK__') {
        return null;
      }
    }

    return answers as T;
  } catch (error) {
    // Handle Ctrl+C
    if (error && typeof error === 'object' && 'isTtyError' in error) {
      process.exit(0);
    }
    throw error;
  }
}

// For checkbox prompts, we need a different approach
export async function checkboxPromptWithEscape<T extends Answers = Answers>(
  question: CheckboxQuestion<T>
): Promise<T | null> {
  // Add a special back option at the beginning of checkbox choices
  const backOption = {
    name: chalk.gray('← Back to previous menu'),
    value: '__BACK__',
    checked: false,
  };
  const separator = new inquirer.Separator();

  // Safely process choices array
  const processedChoices = [];
  processedChoices.push(backOption);
  processedChoices.push(separator);

  // Handle existing choices which may include Separator objects
  if (question.choices && Array.isArray(question.choices)) {
    for (const choice of question.choices) {
      processedChoices.push(choice);
    }
  }

  // Create modified question with a safe validate function
  const modifiedQuestion: CheckboxQuestion<T> = {
    type: question.type,
    name: question.name,
    message: question.message,
    choices: processedChoices,
    pageSize: question.pageSize || 20,
    // Always return true to allow any selection (including empty)
    validate: () => true,
  } as CheckboxQuestion<T>;

  // Copy other properties that might exist but exclude the original validate
  const questionObj = question as unknown as Record<string, unknown>;
  const modifiedObj = modifiedQuestion as unknown as Record<string, unknown>;for (const key in questionObj) {
    if (
      key !== 'validate' &&
      key !== 'type' &&
      key !== 'name' &&
      key !== 'message' &&
      key !== 'choices' &&
      key !== 'pageSize'
    ) {
      modifiedObj[key] = questionObj[key];
    }
  }

  try {
    const answers = await inquirer.prompt([modifiedQuestion]);
    const selectedItems = answers[question.name as string];

    // Check if back option was selected
    if (selectedItems && selectedItems.includes('__BACK__')) {
      return null;
    }

    // If nothing selected (including the back option), treat as back
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

      // Re-prompt if they don't want to go back
      return checkboxPromptWithEscape(question);
    }

    // Filter out the back option from results
    const filteredResults = {
      ...answers,
      [question.name as string]: selectedItems.filter((item: string) => item !== '__BACK__'),
    };

    return filteredResults as T;
  } catch (error) {
    console.error(chalk.red('Debug: Error in checkboxPromptWithEscape:'), error);
    if (error instanceof Error) {
      console.error(chalk.red('Debug: Error message:'), error.message);
      console.error(chalk.red('Debug: Error stack:'), error.stack);
    }

    // Handle Ctrl+C
    if (error && typeof error === 'object' && 'isTtyError' in error) {
      process.exit(0);
    }
    throw error;
  }
}
