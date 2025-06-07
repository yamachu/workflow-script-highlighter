import { CST, Parser } from "yaml";

function findScriptsCST(
  node: CST.Token | undefined,
  results: { code: string; startOffset: number; endOffset: number }[] = []
) {
  if (!node) return results;
  if (node.type === "block-map") {
    let uses, withNode;
    for (const item of node.items) {
      if (
        item.key &&
        CST.isScalar(item.key) &&
        item.key.source === "uses" &&
        item.value &&
        CST.isScalar(item.value) &&
        item.value.source.trim().startsWith("actions/github-script")
      ) {
        uses = item.value;
      }
      if (item.key && CST.isScalar(item.key) && item.key.source === "with") {
        withNode = item.value;
      }
    }
    if (uses && withNode && withNode.type === "block-map") {
      for (const item of withNode.items) {
        if (
          item.key &&
          CST.isScalar(item.key) &&
          item.key.source === "script" &&
          item.value &&
          (item.value.type === "block-scalar" || item.value.type === "scalar")
        ) {
          if (item.value.type === "block-scalar") {
            const maybeNewLineToken = item.value.props.at(-1);
            if (
              maybeNewLineToken !== undefined &&
              maybeNewLineToken?.type === "newline"
            ) {
              results.push({
                code: maybeNewLineToken.source + item.value.source,
                startOffset: maybeNewLineToken.offset,
                endOffset: maybeNewLineToken.offset + item.value.source.length,
              });
              continue;
            }

            const offset = item.value.offset;
            results.push({
              code: item.value.source,
              startOffset: offset,
              endOffset: offset + item.value.source.length,
            });
          }
          if (item.value.type === "scalar") {
            results.push({
              code: item.value.source,
              startOffset: item.value.offset,
              endOffset: item.value.offset + item.value.source.length,
            });
          }
        }
      }
    }
    for (const item of node.items) {
      findScriptsCST(item.value, results);
    }
  } else if (node.type === "block-seq") {
    for (const item of node.items) {
      findScriptsCST(item.value, results);
    }
  }
  return results;
}

export const extractByYaml = (
  documents: string
): { code: string; startOffset: number; endOffset: number }[] => {
  const parser = new Parser();
  const parsed = parser.parse(documents).next().value as CST.Document;

  return findScriptsCST(parsed.value);
};
