import type { ValidatorModule } from '../types.js';
import { tsconfigValidator, eslintValidator, circularDependencyValidator, unusedExportValidator, architectureValidator, envValidator } from './static/index.js';
import { typescriptCompileValidator, buildValidator } from './compile/index.js';
import { serverValidator, routeValidator, apiValidator } from './runtime/index.js';

export function getDefaultValidators(): ValidatorModule[] {
  return [
    tsconfigValidator,
    eslintValidator,
    circularDependencyValidator,
    unusedExportValidator,
    architectureValidator,
    envValidator,
    typescriptCompileValidator,
    buildValidator,
    serverValidator,
    routeValidator,
    apiValidator,
  ];
}

export {
  tsconfigValidator,
  eslintValidator,
  circularDependencyValidator,
  unusedExportValidator,
  architectureValidator,
  envValidator,
  typescriptCompileValidator,
  buildValidator,
  serverValidator,
  routeValidator,
  apiValidator,
};
