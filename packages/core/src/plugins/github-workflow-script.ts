import { forEachEmbeddedCode, LanguagePlugin } from "@volar/language-core";
import type { TypeScriptExtraServiceScript } from "@volar/typescript";
import type * as ts from "typescript";
import { URI } from "vscode-uri";
import { GitHubScriptVirtualCode } from "../virtualCodes/githubScript";

const LANGUAGE_ID = "github-actions-workflow";

export const gitHubScriptLanguagePlugin: LanguagePlugin<URI> = {
  getLanguageId(uri) {
    if (uri.path.endsWith(".yml") || uri.path.endsWith(".yaml")) {
      return LANGUAGE_ID;
    }
  },
  createVirtualCode(_uri, languageId, snapshot) {
    if (languageId === LANGUAGE_ID) {
      return new GitHubScriptVirtualCode(snapshot, LANGUAGE_ID);
    }
  },
  typescript: {
    extraFileExtensions: [],
    getServiceScript() {
      return undefined;
    },
    getExtraServiceScripts(fileName, root) {
      const scripts: TypeScriptExtraServiceScript[] = [];
      for (const code of forEachEmbeddedCode(root)) {
        if (code.languageId === "javascript") {
          scripts.push({
            fileName: fileName + "." + code.id + ".js",
            code,
            extension: ".js",
            scriptKind: 1 satisfies ts.ScriptKind.JS,
          });
        } else if (code.languageId === "typescript") {
          scripts.push({
            fileName: fileName + "." + code.id + ".ts",
            code,
            extension: ".ts",
            scriptKind: 3 satisfies ts.ScriptKind.TS,
          });
        }
      }
      return scripts;
    },
  },
};
