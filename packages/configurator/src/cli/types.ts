export interface ModelFile {
  id: string;           // 'main' or 'components/wheel'
  filePath: string;     // '/absolute/path/to/main.ts'
  importPath: string;   // './main.ts' (relative to project root)
  exportName: string;   // 'mainModel' or 'components_wheelModel'
}

export interface DevCommandOptions {
  port: string;
  verbose?: boolean;
  configuratorDevMode?: boolean;
}

export interface DevModeContext {
  userProjectPath: string;
  isDevelopment: boolean;
  models: ModelFile[];
}
