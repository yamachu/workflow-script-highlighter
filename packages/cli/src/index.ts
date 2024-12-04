import { gitHubScriptLanguagePlugin } from "@yamachu/workflow-script-highlighter-core/src/languagePlugin";
import { readdirSync, statSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { create as createTypeScriptServices } from "volar-service-typescript";

const packageRoot = resolve(__dirname, "..", "resources", "node_modules");
const tsPath = resolve(packageRoot, "typescript");

// @volar/kit require('typescript')...
const Module = require("node:module");
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id: string) {
  if (id === "typescript") {
    return originalRequire.call(this, tsPath);
  }
  return originalRequire.call(this, id);
};

const maybePaths = process.argv.slice(2);

process.on("SIGINT", () => {
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

const main = async () => {
  const createTypeScriptInferredChecker = await import("@volar/kit").then(
    (v) => v.createTypeScriptInferredChecker
  );

  const checker = createTypeScriptInferredChecker(
    [gitHubScriptLanguagePlugin],
    createTypeScriptServices(require(tsPath)),
    () => targetFiles,
    {
      typeRoots: [packageRoot],
      checkJs: true,
      target: 9, // ES2022
      lib: ["ES2022"],
    }
  );

  Promise.all(
    checker.getRootFileNames().map((fileName) => {
      return checker.check(fileName).then((diagnostics) => {
        return [fileName, diagnostics] as const;
      });
    })
  )
    .then((results) => {
      results.forEach(([fileName, diagnostics]) => {
        if (diagnostics.length === 0) {
          return;
        }
        console.log(checker.printErrors(fileName, diagnostics));
      });
    })
    .then(() => {
      process.exit(0);
    })
    .catch((_) => {
      process.exit(1);
    });
};

main();
