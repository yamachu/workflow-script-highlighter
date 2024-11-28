import * as fs from "fs";
import path from "path";
import * as ts from "typescript";

const scriptSnapshots: { [fileName: string]: ts.IScriptSnapshot } = {};
const scriptVersions: { [fileName: string]: string } = {};

const extensionRootDir = path.join(__dirname, "..");

export function createLanguageService() {
  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    lib: ["esnext"],
    typeRoots: [
      path.join(extensionRootDir, "node_modules", "@types"),
      path.join(extensionRootDir, "node_modules"),
    ],
  };

  const host: ts.LanguageServiceHost = {
    getScriptFileNames: () => Object.keys(scriptSnapshots),
    getScriptVersion: (fileName) => scriptVersions[fileName],
    getScriptSnapshot: (fileName) => {
      if (scriptSnapshots[fileName]) {
        return scriptSnapshots[fileName];
      }
      if (fs.existsSync(fileName)) {
        const content = fs.readFileSync(fileName, "utf8");
        const snapshot = ts.ScriptSnapshot.fromString(content);
        scriptSnapshots[fileName] = snapshot;
        scriptVersions[fileName] = "1";
        return snapshot;
      }
      return undefined;
    },
    getCurrentDirectory: () => process.cwd(),
    getCompilationSettings: () => compilerOptions,
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    readFile: (fileName) => {
      if (scriptSnapshots[fileName]) {
        return scriptSnapshots[fileName].getText(
          0,
          scriptSnapshots[fileName].getLength()
        );
      }
      return fs.readFileSync(fileName, "utf8");
    },
    fileExists: (fileName) => {
      return !!scriptSnapshots[fileName] || fs.existsSync(fileName);
    },
  };

  return ts.createLanguageService(host);
}

export function updateScript(fileName: string, content: string) {
  scriptSnapshots[fileName] = ts.ScriptSnapshot.fromString(content);
  scriptVersions[fileName] = (
    parseInt(scriptVersions[fileName] || "0", 10) + 1
  ).toString();
}
