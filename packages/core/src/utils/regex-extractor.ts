const scriptRegexp = /#```typescript([\s\S]*?)\s*#```/gs;

export const extractByRegex = (
  documents: string
): { code: string; startOffset: number; endOffset: number }[] => {
  const matched = [...documents.matchAll(scriptRegexp)];
  const scripts = matched.map((match) => {
    return {
      code: match[1],
      startOffset: match.index + "#```typescript".length,
      endOffset: match.index + match[0].length - "#```".length,
    };
  });

  return scripts;
};
