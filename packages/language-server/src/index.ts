import {
  createConnection,
  createServer,
  createTypeScriptProject,
  loadTsdkByPath,
} from "@volar/language-server/node";
import { gitHubScriptLanguagePlugin } from "@yamachu/workflow-script-highlighter-core/src/plugins/github-workflow-script";
import { yamlLanguagePlugin } from "@yamachu/workflow-script-highlighter-core/src/plugins/yaml";
import { create as createTypeScriptServices } from "volar-service-typescript";

const connection = createConnection();
const server = createServer(connection);

connection.listen();

connection.onInitialize((params) => {
  const tsdk = loadTsdkByPath(
    params.initializationOptions.typescript.tsdk,
    params.locale
  );
  return server.initialize(
    params,
    createTypeScriptProject(tsdk.typescript, tsdk.diagnosticMessages, () => ({
      languagePlugins: [gitHubScriptLanguagePlugin, yamlLanguagePlugin],
      setup(options) {
        options.project.typescript!.languageServiceHost.getCompilationSettings().typeRoots =
          params.initializationOptions.typeRoots;
      },
    })),
    [...createTypeScriptServices(tsdk.typescript)]
  );
});

connection.onInitialized(server.initialized);

connection.onShutdown(server.shutdown);
