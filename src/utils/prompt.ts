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
  const modifiedObj = modifiedQuestion as unknown as Record<string, unknown>;
  for (const key in questionObj) {
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

// Searchable checkbox prompt with escape handling
export async function searchableCheckboxPromptWithEscape(
  question: {
    message: string;
    choices: Array<{
      name: string;
      value: string;
      disabled?: boolean | string;
      checked?: boolean;
    } | { type: 'separator'; separator: string }>;
    pageSize?: number;
  }
): Promise<{ selectedServers: string[] } | null> {
  try {
    const selectedServers: string[] = [];
    let continueSelecting = true;

    // Convert choices to a flat array for searching
    const allChoices = question.choices.filter(choice => !('type' in choice && choice.type === 'separator')) as Array<{
      name: string;
      value: string;
      disabled?: boolean | string;
      checked?: boolean;
    }>;

    // Track which servers are pre-selected
    const preSelectedServers = allChoices
      .filter(choice => choice.checked && !choice.disabled)
      .map(choice => choice.value);
    
    selectedServers.push(...preSelectedServers);

    while (continueSelecting) {
      // First, ask if they want to search or browse
      const actionResult = await promptWithEscape([
        {
          type: 'list',
          name: 'action',
          message: `${chalk.cyan(`Currently selected: ${selectedServers.length} server(s)`)}. What would you like to do?`,
          choices: [
            { name: '🔍 Search for servers by name', value: 'search' },
            { name: '📋 Browse all servers', value: 'browse' },
            selectedServers.length > 0 
              ? { name: chalk.green(`✓ Done selecting (${selectedServers.length} selected)`), value: 'done' }
              : { name: chalk.gray('✓ Done selecting (nothing selected)'), value: 'done', disabled: true },
            new inquirer.Separator(),
            { name: '← Back to previous menu', value: '__BACK__' }
          ],
        }
      ]);

      if (!actionResult || actionResult.action === '__BACK__') {
        return null;
      }

      if (actionResult.action === 'done') {
        break;
      }

      let choicesToShow = allChoices;
      let searchTerm = '';

      if (actionResult.action === 'search') {
        // Get search term
        const searchResult = await promptWithEscape([
          {
            type: 'input',
            name: 'searchTerm',
            message: 'Enter search term (partial server name):',
            validate: (input: string) => input.trim().length > 0 || 'Please enter a search term',
          }
        ]);

        if (!searchResult) {
          continue;
        }

        searchTerm = searchResult.searchTerm.toLowerCase();
        choicesToShow = allChoices.filter(choice => 
          choice.name.toLowerCase().includes(searchTerm)
        );

        if (choicesToShow.length === 0) {
          console.log(chalk.yellow(`\nNo servers found matching "${searchResult.searchTerm}"`));
          await promptWithEscape([
            {
              type: 'confirm',
              name: 'continue',
              message: 'Press enter to continue',
              default: true,
            }
          ]);
          continue;
        }
      }

      // Show filtered/all choices with current selection status
      const displayChoices = choicesToShow.map(choice => {
        const isSelected = selectedServers.includes(choice.value);
        const prefix = isSelected ? chalk.green('✓ ') : '  ';
        const suffix = choice.disabled ? '' : isSelected ? chalk.gray(' (selected)') : '';
        
        return {
          name: `${prefix}${choice.name}${suffix}`,
          value: choice.value,
          disabled: choice.disabled,
        };
      });

      // Add header
      if (searchTerm) {
        displayChoices.unshift(
          new inquirer.Separator(chalk.yellow(`=== Search results for "${searchTerm}" ===`)) as any
        );
      }

      // Show selection prompt
      const selectionResult = await checkboxPromptWithEscape({
        type: 'checkbox',
        name: 'selected',
        message: 'Select/deselect servers (space to toggle, enter to confirm):',
        choices: displayChoices,
        pageSize: question.pageSize || 20,
      });

      if (!selectionResult) {
        continue;
      }

      // Update selected servers
      // Remove all servers that were shown (in case they were deselected)
      const shownServerIds = choicesToShow.map(c => c.value);
      const newSelectedServers = selectedServers.filter(id => !shownServerIds.includes(id));
      
      // Add newly selected servers
      selectionResult.selected.forEach((id: string) => {
        if (!newSelectedServers.includes(id)) {
          newSelectedServers.push(id);
        }
      });
      
      // Update the selectedServers array
      selectedServers.length = 0;
      selectedServers.push(...newSelectedServers);
    }

    return { selectedServers };
  } catch (error) {
    // Handle Ctrl+C
    if (error && typeof error === 'object' && 'isTtyError' in error) {
      process.exit(0);
    }
    throw error;
  }
}