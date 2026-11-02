import { spawnSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const host = process.env.DEPLOY_HOST || "root@179.197.253.136";
const key = process.env.DEPLOY_KEY || path.join(os.homedir(), ".ssh", "cc-vps");
const appDir = process.env.DEPLOY_DIR || "/opt/comprehensive-cleaning";
const archive = path.join(os.tmpdir(), `cc-app-${Date.now()}.tgz`);
const windowsTar = "C:\\Windows\\System32\\tar.exe";
const windowsSsh = "C:\\Windows\\System32\\OpenSSH\\ssh.exe";
const windowsScp = "C:\\Windows\\System32\\OpenSSH\\scp.exe";
const tar = existsSync(windowsTar) ? windowsTar : "tar";
const sshBin = existsSync(windowsSsh) ? windowsSsh : "ssh";
const scpBin = existsSync(windowsScp) ? windowsScp : "scp";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: ["pipe", "inherit", "inherit"], ...options });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!existsSync(key)) {
  console.error(`SSH key not found: ${key}`);
  process.exit(1);
}

const ssh = ["-i", key, "-o", "IdentitiesOnly=yes", "-o", "StrictHostKeyChecking=accept-new"];

console.log("Packing the site...");
run(tar, [
  "-czf", archive,
  "--exclude=node_modules",
  "--exclude=client/dist",
  "--exclude=server/data",
  "--exclude=.git",
  "--exclude=assets",
  "-C", root,
  ".",
]);

console.log(`Uploading to ${host}...`);
run(scpBin, [...ssh, archive, `${host}:/root/cc-app.tgz`]);

const remote = `
set -euo pipefail
mkdir -p ${appDir}
tar -xzf /root/cc-app.tgz -C ${appDir}
cd ${appDir}
npm install --omit=dev --prefix server
npm install --include=dev --prefix client
npm run build --prefix client
chown -R ccapp:ccapp ${appDir}
systemctl restart comprehensive-cleaning
for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
  if curl -sf http://127.0.0.1:4000/api/health >/dev/null; then
    echo DEPLOY_OK
    exit 0
  fi
  sleep 2
done
echo "The service did not become healthy." >&2
journalctl -u comprehensive-cleaning -n 40 --no-pager >&2
exit 1
`;

console.log("Building on the server and restarting the live site...");
try {
  run(sshBin, [...ssh, host, "bash -s"], { input: remote });
} finally {
  rmSync(archive, { force: true });
}

console.log("Live site updated: https://comprehensivecleaning.au");
