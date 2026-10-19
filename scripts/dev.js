import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function preferredNode() {
  const candidates = [
    process.env.NVM_HOME && path.join(process.env.NVM_HOME, "v22.20.0", "node.exe"),
    "C:/Users/Admin/AppData/Roaming/nvm/v22.20.0/node.exe",
  ].filter(Boolean);
  return candidates.find((candidate) => existsSync(candidate));
}

if (Number(process.versions.node.split(".")[0]) < 22 && !process.env.CC_NODE_REEXEC) {
  const next = preferredNode();
  if (!next) {
    console.error("Node.js 22 or newer is required. Run: nvm use 22.20.0");
    process.exit(1);
  }
  const child = spawn(next, [process.argv[1]], {
    stdio: "inherit",
    env: { ...process.env, CC_NODE_REEXEC: "1" },
  });
  child.on("exit", (code) => process.exit(code ?? 0));
} else {
  const server = spawn(process.execPath, ["server/src/index.js"], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  const client = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5173", "--strictPort"], {
    cwd: path.join(root, "client"),
    stdio: "inherit",
    env: process.env,
  });
  const children = [server, client];
  const stop = () => {
    for (const child of children) child.kill();
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  for (const child of children) {
    child.on("exit", (code) => {
      stop();
      process.exit(code ?? 0);
    });
  }
}
