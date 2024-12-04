import {
  createConnection,
  createServer,
  createTypeScriptProject,
  loadTsdkByPath,
} from "@volar/language-server/node";
import { create as createTypeScriptServices } from "volar-service-typescript";
import { gitHubScriptLanguagePlugin } from "./languagePlugin";

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
      languagePlugins: [gitHubScriptLanguagePlugin],
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
