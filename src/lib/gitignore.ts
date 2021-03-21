import { readFile } from 'fs/promises';

export async function readGitignoreToAnymatch(
  gitignorePath: string
): Promise<any[]> {
  const content = await readFile(gitignorePath);
  return gitignoreToAnymatch(content.toString());
}

export function gitignoreToAnymatch(gitignoreContent: string): any[] {
  return gitignoreContent
    .split(/\r?\n/)
    .map((line: string) => {
      return line;
    })
    .filter(Boolean);
}
