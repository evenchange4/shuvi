import path from "path";
import webpack from "webpack";
import {
  app,
  Application,
  ApplicationConfig,
  RouterService,
  Runtime
} from "@shuvi/core";
import { getProjectInfo } from "@shuvi/toolpack/lib/utils/typeScript";
import ReactRuntime from "@shuvi/runtime-react";
import Express from "express";
import FsRouterService from "./services/fsRouterService";
import { getClientEntries } from "./helpers/getEntries";
import { getBuildPath } from "./helpers/paths";
import { getWebpackConfig } from "./helpers/getWebpackConfig";
import {
  CLIENT_ENTRY_PATH,
  BUILD_MANIFEST_PATH,
  BUILD_CLIENT_RUNTIME_MAIN,
  BUILD_SERVER_DOCUMENT,
  ResourceType
} from "./constants";
import Server from "./server";

const defaultConfig: ApplicationConfig = {
  cwd: process.cwd(),
  outputPath: "dist",
  publicPath: "/"
};

export default class Service {
  private _app: Application;
  private _routerService: RouterService.RouterService;

  constructor({ config }: { config: Partial<ApplicationConfig> }) {
    this._app = app({ config: { ...defaultConfig, ...config } });

    this._routerService = new FsRouterService();
  }

  async start() {
    this._setupRuntime();

    const clientConfig = getWebpackConfig(this._app, { node: false });
    clientConfig.name = "client";
    clientConfig.entry = {
      [BUILD_CLIENT_RUNTIME_MAIN]: getClientEntries(this._app)
    };
    console.log("client webpack config:");
    console.dir(clientConfig, { depth: null });

    const { useTypeScript } = getProjectInfo(this._paths.projectDir);
    const serverConfig = getWebpackConfig(this._app, { node: true });
    serverConfig.name = "server";
    serverConfig.entry = {
      [BUILD_SERVER_DOCUMENT]: ["@shuvi-app/document"]
    };
    console.log("client webpack config:");
    console.dir(serverConfig, { depth: null });

    const compiler = webpack([clientConfig, serverConfig]);
    const server = new Server(compiler, {
      port: 4000,
      host: "0.0.0.0",
      publicPath: this._config.publicPath
    });
    server.watchCompiler(compiler.compilers[0], {
      useTypeScript,
      log: console.log.bind(console)
    });
    server.watchCompiler(compiler.compilers[1], {
      useTypeScript: false,
      log: console.log.bind(console)
    });

    server.use(this._handlePage.bind(this));

    await this._app.build({
      bootstrapSrc: ReactRuntime.getBootstrapFilePath()
    });
    server.start();
  }

  private _setupRuntime() {
    this._app.addGatewayFile("document.js", [
      this._app.getSrcPath("document.js"),
      ReactRuntime.getDocumentFilePath()
    ]);
  }

  private get _paths() {
    return this._app.paths;
  }

  private get _config() {
    return this._app.config;
  }

  private _handlePage(
    req: Express.Request,
    res: Express.Response,
    next: Express.NextFunction
  ) {
    if (req.method.toLowerCase() !== "get") {
      return next();
    }

    const tags = this._getDocumentTags();
    console.log("tags", tags);
    const Document = require(ReactRuntime.getDocumentFilePath());
    const html = ReactRuntime.renderDocument(Document.default || Document, {
      appData: {},
      documentProps: {
        appHtml: "",
        bodyTags: tags.bodyTags,
        headTags: tags.headTags
      }
    });
    res.end(html);
  }

  private _getDocumentTags(): {
    bodyTags: Runtime.DocumentProps["bodyTags"];
    headTags: Runtime.DocumentProps["headTags"];
  } {
    const assetsMap = require(getBuildPath(
      this._paths.buildDir,
      BUILD_MANIFEST_PATH
    ));

    const entrypoints = assetsMap[BUILD_CLIENT_RUNTIME_MAIN];
    const bodyTags: Runtime.DocumentProps["bodyTags"] = [];
    const headTags: Runtime.DocumentProps["headTags"] = [];
    entrypoints.forEach((asset: string) => {
      if (/\.js$/.test(asset)) {
        bodyTags.push({
          tagName: "script",
          attrs: {
            src: this._app.getPublicPath(asset)
          }
        });
      } else if (/\.css$/.test(asset)) {
        headTags.push({
          tagName: "link",
          attrs: {
            rel: "stylesheet",
            href: this._app.getPublicPath(asset)
          }
        });
      }
    });

    return {
      bodyTags,
      headTags
    };
  }

  private async _startServer() {}
}
