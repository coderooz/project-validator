import { execa } from 'execa';
import treeKill from 'tree-kill';
import { promisify } from 'node:util';
import type { ValidatorModule, ValidationContext, ValidationResult } from '../../types.js';

const kill = promisify(treeKill);

interface DevServerProcess {
  pid: number;
  kill: () => Promise<void>;
  stdout: NodeJS.ReadableStream | null;
  stderr: NodeJS.ReadableStream | null;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
}

interface DevServerHandle {
  process: DevServerProcess;
  url: string;
  port: number;
}

async function tryFindAvailablePort(startPort: number): Promise<number> {
  const { createServer } = await import('node:net');
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.on('error', () => {
      resolve(tryFindAvailablePort(startPort + 1));
    });
    server.listen(startPort, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        server.close(() => resolve(addr.port));
      } else {
        server.close(() => resolve(startPort));
      }
    });
    setTimeout(() => reject(new Error('Port detection timed out')), 5000);
  });
}

type ServerCommand = { cmd: string; args: string[]; readyPattern: RegExp };

const DEFAULT_COMMANDS: Record<string, ServerCommand> = {
  nextjs: {
    cmd: 'npx',
    args: ['next', 'dev', '--port', '3000'],
    readyPattern: /ready|started|localhost/,
  },
  react: {
    cmd: 'npx',
    args: ['react-scripts', 'start'],
    readyPattern: /localhost/,
  },
  node: {
    cmd: 'npx',
    args: ['tsx', 'src/index.ts'],
    readyPattern: /listening|started|localhost/,
  },
  express: {
    cmd: 'npx',
    args: ['tsx', 'src/index.ts'],
    readyPattern: /listening|started/,
  },
};

async function startDevServer(
  rootPath: string,
  framework: string,
  timeout: number,
): Promise<DevServerHandle> {
  const port = await tryFindAvailablePort(3000);
  const serverCommand: ServerCommand = DEFAULT_COMMANDS[framework] ?? DEFAULT_COMMANDS['node']!;

  const proc = execa(serverCommand.cmd, serverCommand.args.map(a => a === '3000' ? String(port) : a), {
    cwd: rootPath,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { PORT: String(port), ...process.env },
    timeout,
  });

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      if (proc.pid !== undefined) {
        kill(proc.pid).catch(() => {});
      }
      reject(new Error(`Dev server did not start within ${timeout}ms`));
    }, timeout);

    const onData = (data: string) => {
      const text = data.toString();
      if (serverCommand.readyPattern.test(text)) {
        clearTimeout(timeoutId);
        const pid = proc.pid ?? 0;
        resolve({
          process: { pid, kill: () => kill(pid), stdout: proc.stdout, stderr: proc.stderr, on: proc.on.bind(proc) },
          url: `http://localhost:${port}`,
          port,
        });
      }
    };

    proc.stdout?.on('data', onData);
    proc.stderr?.on('data', onData);

    proc.on('exit', (code) => {
      clearTimeout(timeoutId);
      reject(new Error(`Dev server exited with code ${code} before becoming ready`));
    });

    proc.on('error', (err) => {
      clearTimeout(timeoutId);
      reject(err);
    });
  });
}

export const serverValidator: ValidatorModule = {
  name: 'server-validator',
  phase: 'runtime',
  async validate(context: ValidationContext): Promise<ValidationResult> {
    const issues: ValidationResult['issues'] = [];
    const rootPath = context.project.rootPath;
    const framework = context.project.framework.type;
    let server: DevServerHandle | null = null;

    try {
      server = await startDevServer(rootPath, framework, context.config.timeout);
    } catch (error) {
      issues.push({
        id: 'server-start-failed',
        category: 'BUILD_SYSTEM',
        severity: 'high',
        phase: 'runtime',
        message: `Failed to start dev server: ${error instanceof Error ? error.message : String(error)}`,
        recommendation: 'Check if the application can start without errors.',
      });

      return {
        phase: 'runtime',
        name: 'server-validator',
        passed: false,
        issues,
        duration: 0,
      };
    }

    const passed = issues.length === 0;

    if (server) {
      try {
        await server.process.kill();
      } catch {
        // ignore cleanup errors
      }
    }

    return {
      phase: 'runtime',
      name: 'server-validator',
      passed,
      issues,
      duration: 0,
    };
  },
};
