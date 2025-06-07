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

const t = test.extend<{
  withAnnotate: ts.IScriptSnapshot;
  withoutAnnotate: ts.IScriptSnapshot;
}>({
  withAnnotate: async ({}, use) => {
    const workflowFile = resolve(githubRoot, "workflows", "sample.yml");
    const workflow = await readFile(workflowFile, "utf8");
    const snapshot = {
      getText: (start: number, end: number) => workflow.substring(start, end),
      getLength: () => workflow.length,
    } as unknown as ts.IScriptSnapshot;

    await use(snapshot);
  },
  withoutAnnotate: async ({}, use) => {
    const workflowFile = resolve(githubRoot, "actions", "sample.yaml");
    const workflow = await readFile(workflowFile, "utf8");
    const snapshot = {
      getText: (start: number, end: number) => workflow.substring(start, end),
      getLength: () => workflow.length,
    } as unknown as ts.IScriptSnapshot;

    await use(snapshot);
  },
});

t(
  "typescriptアノテーションがついているコードをvirtualCodeに変換出来る",
  ({ withAnnotate }) => {
    const virtualCode = new GitHubScriptVirtualCode(withAnnotate, "yaml");

    expect(virtualCode.id).toBe("root");
    expect(
      virtualCode.embeddedCodes.map((v) => ({
        // length: v.mappings[0].lengths[0], // parserの実装によって前後のスペースなどが含まれたりするので無視する, regexでのマッチングだと今のexpected
        sourceOffsets: v.mappings[0].sourceOffsets[0],
      }))
    ).toEqual([
      {
        // length: 286,
        sourceOffsets: 188,
      },
      {
        // length: 110,
        sourceOffsets: 589,
      },
    ]);
  }
);

t.todo("typescriptアノテーションがついていないコードをvirtualCodeに変換出来る");
