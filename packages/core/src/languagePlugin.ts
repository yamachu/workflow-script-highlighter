import {
  CodeMapping,
  forEachEmbeddedCode,
  LanguagePlugin,
  VirtualCode,
} from "@volar/language-core";
import type { TypeScriptExtraServiceScript } from "@volar/typescript";
import type * as ts from "typescript";
import { URI } from "vscode-uri";

const LANGUAGE_ID = "github-actions-workflow";

export const gitHubScriptLanguagePlugin: LanguagePlugin<URI> = {
  getLanguageId(uri) {
    if (uri.path.endsWith(".yml") || uri.path.endsWith(".yaml")) {
      return LANGUAGE_ID;
    }
  },
  createVirtualCode(_uri, languageId, snapshot) {
    if (languageId === LANGUAGE_ID) {
      return new GitHubScriptVirtualCode(snapshot);
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

export class GitHubScriptVirtualCode implements VirtualCode {
  id = "root";
  languageId = LANGUAGE_ID;
  mappings: CodeMapping[];
  embeddedCodes: VirtualCode[] = [];

  constructor(public snapshot: ts.IScriptSnapshot) {
    this.mappings = [
      {
        sourceOffsets: [0],
        generatedOffsets: [0],
        lengths: [snapshot.getLength()],
        data: {
          completion: true,
          format: true,
          navigation: true,
          semantic: true,
          structure: true,
          verification: true,
        },
      },
    ];
    this.embeddedCodes = [...getGitHubScriptEmbeddedCodes(snapshot)];
  }
}

const scriptRegexp = /#```typescript([\s\S]*?)\s*#```/gs;

function* getGitHubScriptEmbeddedCodes(
  snapshot: ts.IScriptSnapshot
): Generator<VirtualCode> {
  const documents = snapshot.getText(0, snapshot.getLength());
  const matched = [...documents.matchAll(scriptRegexp)];
  const scripts = matched.map((match) => {
    return {
      code: match[1],
      startOffset: match.index + "#```typescript".length,
      endOffset: match.index + match[0].length - "#```".length,
    };
  });

  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i];
    const pre = `export default async ({ context, core, exec, github, glob, io, require }: import('@types/github-script').AsyncFunctionArguments) => {`;
    const post = `}`;
    const text = pre + script.code + post;
    yield {
      id: "script_" + i,
      languageId: "javascript", // github-scripts not supporting TypeScript
      snapshot: {
        getText: (start, end) => text.substring(start, end),
        getLength: () => text.length,
        getChangeRange: () => undefined,
      },
      mappings: [
        {
          sourceOffsets: [script.startOffset],
          generatedOffsets: [pre.length],
          lengths: [script.code.length],
          data: {
            completion: true,
            format: true,
            navigation: true,
            semantic: true,
            structure: true,
            verification: true,
          },
        },
      ],
      embeddedCodes: [],
    };
  }
}
