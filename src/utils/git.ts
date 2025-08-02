import { execa } from 'execa';

export async function getCurrentBranch(): Promise<string> {
  const { stdout } = await execa('git', ['branch', '--show-current']);
  return stdout.trim();
}

export async function hasUncommittedChanges(): Promise<boolean> {
  try {
    const { stdout } = await execa('git', ['status', '--porcelain']);
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

export async function getLatestTag(): Promise<string | undefined> {
  try {
    const { stdout } = await execa('git', ['describe', '--tags', '--abbrev=0']);
    return stdout.trim();
  } catch {
    // No tags found
    return undefined;
  }
}

export async function pushWithTags(): Promise<void> {
  await execa('git', ['push', 'origin', 'main', '--tags']);
}

export async function isRepositoryClean(): Promise<boolean> {
  try {
    const { stdout: status } = await execa('git', ['status', '--porcelain']);
    const { stdout: unpushed } = await execa('git', ['cherry', '-v']);
    
    return status.trim() === '' && unpushed.trim() === '';
  } catch {
    return false;
  }
}

export async function fetchRemote(): Promise<void> {
  await execa('git', ['fetch', 'origin']);
}

export async function isUpToDate(): Promise<boolean> {
  try {
    await fetchRemote();
    const { stdout: local } = await execa('git', ['rev-parse', 'HEAD']);
    const { stdout: remote } = await execa('git', ['rev-parse', 'origin/main']);
    
    return local.trim() === remote.trim();
  } catch {
    return false;
  }
}