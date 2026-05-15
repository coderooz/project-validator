import type { FileInfo, DependencyGraph, DependencyNode } from '../types.js';
import { extractImports, resolveImportPath, isExternalImport } from './import-resolver.js';
import { readFileContent } from '../scanner/file-scanner.js';

export async function buildDependencyGraph(
  files: FileInfo[],
  entryPoints: string[],
  rootPath: string,
): Promise<DependencyGraph> {
  const nodes = new Map<string, DependencyNode>();
  const reverseDeps = new Map<string, string[]>();

  for (const file of files) {
    const relativePath = file.relativePath;
    const content = readFileContent(file.path);
    const imports = extractImports(content);
    const resolvedImports: string[] = [];

    for (const imp of imports) {
      if (isExternalImport(imp)) continue;
      const resolved = resolveImportPath(imp, file.path, files, rootPath);
      if (resolved) resolvedImports.push(resolved);
    }

    const isEntryPoint = entryPoints.some((ep) => {
      const normalizedEp = ep.split('\\').join('/');
      const normalizedFile = file.path.split('\\').join('/');
      return normalizedFile.endsWith(normalizedEp) || normalizedFile === normalizedEp;
    });

    nodes.set(relativePath, {
      path: relativePath,
      imports: resolvedImports,
      exportedBy: [],
      isEntryPoint,
    });

    for (const dep of resolvedImports) {
      const existing = reverseDeps.get(dep) ?? [];
      existing.push(relativePath);
      reverseDeps.set(dep, existing);
    }
  }

  for (const [filePath, node] of nodes) {
    const exportedBy = reverseDeps.get(filePath) ?? [];
    node.exportedBy = exportedBy;
  }

  const circularDependencies = findCircularDependencies(nodes);

  return {
    nodes,
    circularDependencies,
    entryPoints,
  };
}

function findCircularDependencies(nodes: Map<string, DependencyNode>): string[][] {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const cycles: string[][] = [];
  const pathMap = new Map<string, string[]>();

  function dfs(nodePath: string, path: string[]) {
    visited.add(nodePath);
    recursionStack.add(nodePath);
    pathMap.set(nodePath, [...path, nodePath]);

    const node = nodes.get(nodePath);
    if (node) {
      for (const imp of node.imports) {
        if (!nodes.has(imp)) continue;
        if (!visited.has(imp)) {
          dfs(imp, pathMap.get(nodePath) ?? []);
        } else if (recursionStack.has(imp)) {
          const cyclePath = (pathMap.get(nodePath) ?? []);
          const cycleStart = cyclePath.indexOf(imp);
          if (cycleStart !== -1) {
            const cycle = [...cyclePath.slice(cycleStart), imp];
            cycles.push(cycle);
          }
        }
      }
    }

    recursionStack.delete(nodePath);
  }

  for (const [nodePath] of nodes) {
    if (!visited.has(nodePath)) {
      dfs(nodePath, []);
    }
  }

  return cycles;
}

export function getModuleDependencies(
  graph: DependencyGraph,
  modulePrefix: string,
): string[] {
  const deps = new Set<string>();
  for (const [filePath, node] of graph.nodes) {
    if (filePath.startsWith(modulePrefix)) {
      for (const imp of node.imports) {
        deps.add(imp);
      }
    }
  }
  return [...deps];
}

export function getUnusedFiles(
  graph: DependencyGraph,
  files: FileInfo[],
  whitelistPrefixes: string[],
): string[] {
  const unused: string[] = [];

  for (const file of files) {
    const relPath = file.relativePath;
    const node = graph.nodes.get(relPath);
    if (!node) continue;

    if (node.isEntryPoint) continue;

    const isWhitelisted = whitelistPrefixes.some((prefix) => relPath.startsWith(prefix));
    if (isWhitelisted) continue;

    if (node.exportedBy.length === 0 && !node.isEntryPoint) {
      unused.push(relPath);
    }
  }

  return unused;
}
