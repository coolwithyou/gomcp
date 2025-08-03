import { execa } from 'execa';

interface CommitInfo {
  hash: string;
  type: string;
  scope?: string;
  subject: string;
  body?: string;
  breaking?: boolean;
}

const COMMIT_TYPES: Record<string, string> = {
  feat: 'Features',
  fix: 'Bug Fixes',
  docs: 'Documentation',
  style: 'Code Style',
  refactor: 'Code Refactoring',
  test: 'Tests',
  chore: 'Chores',
  perf: 'Performance Improvements',
  build: 'Build System',
  ci: 'Continuous Integration',
};

export async function generateChangelog(newVersion: string, fromTag?: string): Promise<string> {
  const commits = await getCommitsSinceTag(fromTag);
  const categorizedCommits = categorizeCommits(commits);

  const date = new Date().toISOString().split('T')[0];
  let changelog = `## [${newVersion}] - ${date}\n\n`;

  // Add breaking changes first if any
  const breakingChanges = commits.filter(c => c.breaking);
  if (breakingChanges.length > 0) {
    changelog += '### ⚠️ BREAKING CHANGES\n\n';
    for (const commit of breakingChanges) {
      changelog += `- ${commit.subject}\n`;
      if (commit.body) {
        changelog += `  ${commit.body.replace(/\n/g, '\n  ')}\n`;
      }
    }
    changelog += '\n';
  }

  // Add categorized commits
  for (const [type, title] of Object.entries(COMMIT_TYPES)) {
    const typeCommits = categorizedCommits[type];
    if (typeCommits && typeCommits.length > 0) {
      changelog += `### ${title}\n\n`;
      for (const commit of typeCommits) {
        const scope = commit.scope ? `**${commit.scope}:** ` : '';
        changelog += `- ${scope}${commit.subject}\n`;
      }
      changelog += '\n';
    }
  }

  return changelog;
}

async function getCommitsSinceTag(fromTag?: string): Promise<CommitInfo[]> {
  let range = fromTag ? `${fromTag}..HEAD` : 'HEAD';

  // If no tag specified, get commits since last tag
  if (!fromTag) {
    try {
      const { stdout: lastTag } = await execa('git', ['describe', '--tags', '--abbrev=0']);
      if (lastTag) {
        range = `${lastTag}..HEAD`;
      }
    } catch {
      // No tags found, get all commits
      range = 'HEAD';
    }
  }

  // Get commit messages
  const { stdout } = await execa('git', [
    'log',
    range,
    '--pretty=format:%H|||%s|||%b|||%D',
    '--no-merges'
  ]);

  if (!stdout) {
    return [];
  }

  const commits: CommitInfo[] = [];
  const commitLines = stdout.split('\n').filter(line => line.trim());

  for (const line of commitLines) {
    const [hash, subject, body] = line.split('|||');
    const commit = parseCommit(hash, subject, body);
    if (commit) {
      commits.push(commit);
    }
  }

  return commits;
}

function parseCommit(hash: string, subject: string, body?: string): CommitInfo | null {
  // Validate required parameters
  if (!hash || !subject) {
    return null;
  }
  
  // Skip release commits
  if (subject.toLowerCase().includes('release') || subject.toLowerCase().includes('version')) {
    return null;
  }

  // Parse conventional commit format
  const conventionalMatch = subject.match(/^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/);

  if (conventionalMatch) {
    const [, type, scope, breaking, description] = conventionalMatch;
    return {
      hash: hash.substring(0, 7),
      type: type.toLowerCase(),
      scope: scope || undefined,
      subject: description.trim(),
      body: body?.trim() || undefined,
      breaking: !!breaking || (body?.includes('BREAKING CHANGE:') ?? false),
    };
  }

  // If not conventional format, categorize as chore
  return {
    hash: hash.substring(0, 7),
    type: 'chore',
    subject: subject.trim(),
    body: body?.trim() || undefined,
    breaking: false,
  };
}

function categorizeCommits(commits: CommitInfo[]): Record<string, CommitInfo[]> {
  const categorized: Record<string, CommitInfo[]> = {};

  for (const commit of commits) {
    if (!categorized[commit.type]) {
      categorized[commit.type] = [];
    }
    categorized[commit.type].push(commit);
  }

  return categorized;
}
