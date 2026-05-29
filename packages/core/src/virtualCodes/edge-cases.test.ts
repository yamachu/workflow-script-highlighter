import { GitHubScriptVirtualCode } from "./githubScript";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import * as ts from "typescript";

const githubRoot = resolve(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "sample",
  ".github"
);

test("既存のworkflowファイルが正しく動作する", async () => {
  const workflowFile = resolve(githubRoot, "workflows", "sample.yml");
  const workflow = await readFile(workflowFile, "utf8");
  const snapshot = {
    getText: (start: number, end: number) => workflow.substring(start, end),
    getLength: () => workflow.length,
    getChangeRange: () => undefined,
  } as ts.IScriptSnapshot;

  const virtualCode = new GitHubScriptVirtualCode(snapshot, "yaml");
  
  expect(virtualCode.id).toBe("root");
  expect(virtualCode.embeddedCodes.length).toBeGreaterThan(0);
});

test("空のworkflowファイルでクラッシュしない", () => {
  const emptyWorkflow = "";
  const snapshot = {
    getText: (start: number, end: number) => emptyWorkflow.substring(start, end),
    getLength: () => emptyWorkflow.length,
    getChangeRange: () => undefined,
  } as ts.IScriptSnapshot;

  const virtualCode = new GitHubScriptVirtualCode(snapshot, "yaml");
  
  expect(virtualCode.id).toBe("root");
  expect(virtualCode.embeddedCodes.length).toBe(0);
});

test("スペースのみのworkflowファイルでクラッシュしない", () => {
  const whitespaceWorkflow = "   \n  \n";
  const snapshot = {
    getText: (start: number, end: number) => whitespaceWorkflow.substring(start, end),
    getLength: () => whitespaceWorkflow.length,
    getChangeRange: () => undefined,
  } as ts.IScriptSnapshot;

  const virtualCode = new GitHubScriptVirtualCode(snapshot, "yaml");
  
  expect(virtualCode.id).toBe("root");
  expect(virtualCode.embeddedCodes.length).toBe(0);
});

test("github-scriptがないworkflowファイルでクラッシュしない", () => {
  const noScriptWorkflow = `
name: Test
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
`;
  const snapshot = {
    getText: (start: number, end: number) => noScriptWorkflow.substring(start, end),
    getLength: () => noScriptWorkflow.length,
    getChangeRange: () => undefined,
  } as ts.IScriptSnapshot;

  const virtualCode = new GitHubScriptVirtualCode(snapshot, "yaml");

  expect(virtualCode.id).toBe("root");
  expect(virtualCode.embeddedCodes.length).toBe(0);
});

test("${{ }} expressions in template literals are sanitized to prevent TS parse errors", () => {
  const workflow = `
name: Test
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v9
        with:
          script: |
            const msg = \`Hello \${{ inputs.name }}\`;
            core.info(msg);
`;
  const snapshot = {
    getText: (start: number, end: number) => workflow.substring(start, end),
    getLength: () => workflow.length,
    getChangeRange: () => undefined,
  } as ts.IScriptSnapshot;

  const virtualCode = new GitHubScriptVirtualCode(snapshot, "yaml");

  expect(virtualCode.embeddedCodes.length).toBe(1);
  const generated = virtualCode.embeddedCodes[0].snapshot.getText(
    0,
    virtualCode.embeddedCodes[0].snapshot.getLength()
  );
  expect(generated).not.toContain("${{");
  expect(generated).toContain("undefined");
});
