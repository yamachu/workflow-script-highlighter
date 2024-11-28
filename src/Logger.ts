import * as vscode from "vscode";

export const logger = vscode.window.createOutputChannel(
  "Workflow Script Highlighter",
  { log: true }
);
