export const preInsertedScript =
  `export default async ({ context, core, exec, github, glob, io, require }: import('github-script').AsyncFunctionArguments) => {
` as const;
export const postInsertedScript = `}` as const;

export const triggerTextYamlToTs = "#```typescript" as const;
export const triggerTextTsToYaml = "#```" as const;
