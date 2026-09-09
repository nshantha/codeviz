// Dev orchestrator: starts Vite, waits for it, then launches Electron
// against the dev server. Also watches main/preload with tsc.
import { spawn } from "node:child_process";
import net from "node:net";

const VITE_PORT = 5173;
const ROOT = new URL("..", import.meta.url).pathname;

function waitForPort(port, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tryOnce = () => {
      // "localhost" (not 127.0.0.1): vite may bind IPv6 ::1
      const sock = net.connect(port, "localhost");
      sock.on("connect", () => { sock.end(); resolve(); });
      sock.on("error", () => {
        sock.destroy();
        if (Date.now() - start > timeoutMs) reject(new Error(`timed out waiting for port ${port}`));
        else setTimeout(tryOnce, 250);
      });
    };
    tryOnce();
  });
}

const children = [];
function run(cmd, args, opts = {}) {
  const c = spawn(cmd, args, { cwd: ROOT, stdio: "inherit", shell: process.platform === "win32", ...opts });
  children.push(c);
  c.on("exit", (code) => {
    if (opts.critical) {
      for (const k of children) if (k.exitCode === null) k.kill();
      process.exit(code ?? 1);
    }
  });
  return c;
}

process.on("SIGINT", () => { for (const k of children) k.kill(); process.exit(0); });

// 1. one-off build of main + preload so dist exists
// 2. watch them in the background
// 3. start vite, wait, then launch electron against it
const tsc = process.platform === "win32" ? "npx.cmd" : "npx";
run(tsc, ["tsc", "-p", "tsconfig.main.json", "--watch", "--preserveWatchOutput"], { critical: false });
run(tsc, ["tsc", "-p", "tsconfig.preload.json", "--watch", "--preserveWatchOutput"], { critical: false });
run("npm", ["run", "dev:renderer"], { critical: true });

try {
  await waitForPort(VITE_PORT);
  console.log(`[dev] vite ready, launching electron`);
} catch (e) {
  console.error("[dev]", e.message);
  process.exit(1);
}

const electronBin = `${ROOT}/node_modules/.bin/${process.platform === "win32" ? "electron.cmd" : "electron"}`;
// --no-sandbox is only needed when running as root (containers/CI); real user
// machines must keep the sandbox on.
const noSandbox = typeof process.getuid === "function" && process.getuid() === 0;
run(electronBin, ["dist/main/index.js", ...(noSandbox ? ["--no-sandbox"] : [])], {
  critical: true,
  env: {
    ...process.env,
    ALGOMENTOR_DEV: "1",
    ELECTRON_RENDERER_URL: `http://localhost:${VITE_PORT}`,
  },
});
