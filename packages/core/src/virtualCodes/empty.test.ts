import { GitHubScriptVirtualCode } from "./githubScript";
import * as ts from "typescript";

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
