import * as ts from "typescript";
import * as vscode from "vscode";
import {
  postInsertedScript,
  preInsertedScript,
  triggerTextTsToYaml,
  triggerTextYamlToTs,
} from "./Contract";
import { logger } from "./Logger";
import { createLanguageService, updateScript } from "./LanguageService";
import { asCompletionItemKind } from "./Platform";

// For debugging
logger.hide();

let languageService: ts.LanguageService;

function extractTsCodeBlock(
  text: string,
  offset: number
): { content: string; offset: number } | null {
  const tsBlockStart = text.lastIndexOf(triggerTextYamlToTs, offset);
  const tsBlockEnd = text.indexOf(
    triggerTextTsToYaml,
    tsBlockStart + triggerTextYamlToTs.length
  );

  if (tsBlockStart === -1 || tsBlockEnd === -1 || tsBlockEnd < offset) {
    return null;
  }

  const content = text.substring(
    tsBlockStart + triggerTextYamlToTs.length,
    tsBlockEnd - postInsertedScript.length
  );
  const tsOffset = offset - (tsBlockStart + triggerTextYamlToTs.length);

  return { content, offset: tsOffset };
}

export function activate(context: vscode.ExtensionContext) {
  languageService = createLanguageService();

  const completionItemProvider: vscode.CompletionItemProvider = {
    provideCompletionItems(
      document: vscode.TextDocument,
      position: vscode.Position
    ) {
      const text = document.getText();
      const offset = document.offsetAt(position);

      const tsCodeBlock = extractTsCodeBlock(text, offset);
      if (!tsCodeBlock) {
        return [];
      }

      const scriptFileName = document.uri.fsPath + ".ts";
      const augmentedContent = `${preInsertedScript}${tsCodeBlock.content}${postInsertedScript}`;
      updateScript(scriptFileName, augmentedContent);

      const updatedPosition = tsCodeBlock.offset + preInsertedScript.length;

      const completions = languageService.getCompletionsAtPosition(
        scriptFileName,
        updatedPosition,
        {}
      );
      if (!completions) {
        return [];
      }

      // TODO: More powerful completion
      const mapped = completions.entries.map((entry) => {
        const item = new vscode.CompletionItem(
          entry.name,
          asCompletionItemKind(entry.kind)
        );
        item.sortText = entry.sortText;

        return item;
      });

      return mapped;
    },
  };

  const githubActionsWorkflowProvider =
    vscode.languages.registerCompletionItemProvider(
      { language: "github-actions-workflow", scheme: "file" },
      completionItemProvider,
      "."
    );

  context.subscriptions.push(githubActionsWorkflowProvider);
}

export function deactivate() {
  if (languageService) {
    languageService.dispose();
  }
}
