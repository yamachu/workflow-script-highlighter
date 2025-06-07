import { CodeMapping, VirtualCode } from "@volar/language-core";
import type * as ts from "typescript";
import { extractByYaml } from "../utils/yaml-extractor";

export class GitHubScriptVirtualCode implements VirtualCode {
  id = "root";
  mappings: CodeMapping[];
  embeddedCodes: VirtualCode[] = [];

  constructor(public snapshot: ts.IScriptSnapshot, public languageId: string) {
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

function* getGitHubScriptEmbeddedCodes(
  snapshot: ts.IScriptSnapshot
): Generator<VirtualCode> {
  const documents = snapshot.getText(0, snapshot.getLength());
  const scripts = extractByYaml(documents);

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
