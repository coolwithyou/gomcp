import { execa } from 'execa';
const COMMIT_TYPES = {
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
export async function generateChangelog(newVersion, fromTag) {
    const commits = await getCommitsSinceTag(fromTag);
    const categorizedCommits = categorizeCommits(commits);
    const date = new Date().toISOString().split('T')[0];
    let changelog = `## [${newVersion}] - ${date}\n\n`;
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
async function getCommitsSinceTag(fromTag) {
    let range = fromTag ? `${fromTag}..HEAD` : 'HEAD';
    if (!fromTag) {
        try {
            const { stdout: lastTag } = await execa('git', ['describe', '--tags', '--abbrev=0']);
            if (lastTag) {
                range = `${lastTag}..HEAD`;
            }
        }
        catch {
            range = 'HEAD';
        }
    }
    const { stdout } = await execa('git', [
        'log',
        range,
        '--pretty=format:%H|||%s|||%b|||%D',
        '--no-merges'
    ]);
    if (!stdout) {
        return [];
    }
    const commits = [];
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
function parseCommit(hash, subject, body) {
    if (!hash || !subject) {
        return null;
    }
    if (subject.toLowerCase().includes('release') || subject.toLowerCase().includes('version')) {
        return null;
    }
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
    return {
        hash: hash.substring(0, 7),
        type: 'chore',
        subject: subject.trim(),
        body: body?.trim() || undefined,
        breaking: false,
    };
}
function categorizeCommits(commits) {
    const categorized = {};
    for (const commit of commits) {
        if (!categorized[commit.type]) {
            categorized[commit.type] = [];
        }
        categorized[commit.type].push(commit);
    }
    return categorized;
}
//# sourceMappingURL=changelog.js.map