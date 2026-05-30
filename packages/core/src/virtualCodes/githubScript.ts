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
    // Replace ${{ }} expressions with `undefined` so the TS language server
    // does not try to parse them as template literal interpolations.
    const ghaPattern = /\$\{\{[^}]*\}\}/g;
    const sanitizedCode = script.code.replace(ghaPattern, "undefined");
    const text = pre + sanitizedCode + post;

    // Build segmented mappings that skip over GHA expressions.
    // A single flat mapping would offset everything after the first GHA expression
    // because `undefined` (9 chars) is shorter than `${{ ... }}`.
    const sourceOffsets: number[] = [];
    const generatedOffsets: number[] = [];
    const lengths: number[] = [];
    let lastSourceEnd = 0;
    let genPos = 0;
    let match: RegExpExecArray | null;
    ghaPattern.lastIndex = 0;
    while ((match = ghaPattern.exec(script.code)) !== null) {
      const segLen = match.index - lastSourceEnd;
      if (segLen > 0) {
        sourceOffsets.push(script.startOffset + lastSourceEnd);
        generatedOffsets.push(pre.length + genPos);
        lengths.push(segLen);
        genPos += segLen;
      }
      genPos += "undefined".length;
      lastSourceEnd = match.index + match[0].length;
    }
    const remainingLen = script.code.length - lastSourceEnd;
    if (remainingLen > 0) {
      sourceOffsets.push(script.startOffset + lastSourceEnd);
      generatedOffsets.push(pre.length + genPos);
      lengths.push(remainingLen);
    }
    if (sourceOffsets.length === 0) {
      sourceOffsets.push(script.startOffset);
      generatedOffsets.push(pre.length);
      lengths.push(script.code.length);
    }

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
          sourceOffsets,
          generatedOffsets,
          lengths,
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
