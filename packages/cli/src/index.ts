import * as kit from "@volar/kit";
import { gitHubScriptLanguagePlugin } from "@yamachu/workflow-script-highlighter-core/src/languagePlugin";
import { readdirSync, statSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { ScriptTarget } from "typescript";
import { create as createTypeScriptServices } from "volar-service-typescript";

const maybePaths = process.argv.slice(2);

const abortController = new AbortController();

process.on("SIGINT", () => {
  abortController.abort();
  process.exit(1);
});

const getScripts = (paths: string[]) =>
  paths
    .map((path) => {
      if (isAbsolute(path)) {
        return path;
      }

      return resolve(path);
    })
    .reduce<string[]>((prev, curr) => {
      const stat = statSync(curr);
      if (stat.isFile()) {
        return [...prev, curr];
      }
      return [...prev, ...findYamlFiles(curr)];
    }, []);

const findYamlFiles = (dir: string, fileList: string[] = []): string[] => {
  const files = readdirSync(dir);
  files.forEach((file) => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      findYamlFiles(filePath, fileList);
    } else if (file.endsWith(".yaml") || file.endsWith(".yml")) {
      fileList.push(filePath);
    }
  });
  return fileList;
};

const targetFiles = getScripts(maybePaths);

const packageRoot = resolve(__dirname, "..", "resources", "node_modules");
const tsPath = resolve(packageRoot, "typescript");

const checker = kit.createTypeScriptInferredChecker(
  [gitHubScriptLanguagePlugin],
  createTypeScriptServices(require(tsPath)),
  () => targetFiles,
  {
    typeRoots: [packageRoot],
    checkJs: true,
    target: ScriptTarget.ES2022,
    lib: ["ES2022"],
  }
);

Promise.all(
  checker.getRootFileNames().map((fileName) => {
    return Promise.race([
      new Promise((_, reject) => {
        abortController.signal.addEventListener("abort", () => {
          reject();
        });
      }),
      checker.check(fileName).then((diagnostics) => {
        return [fileName, diagnostics] as const;
      }),
    ] as const);
  })
)
  .then((results: any[]) => {
    results.forEach(([fileName, diagnostics]: [string, kit.Diagnostic[]]) => {
      console.log(checker.printErrors(fileName, diagnostics));
    });
  })
  .then(() => {
    process.exit(0);
  })
  .catch((_) => {
    process.exit(1);
  });
