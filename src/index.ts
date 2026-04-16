import * as core from "@actions/core";
import * as tc from "@actions/tool-cache";
import * as exec from "@actions/exec";
import * as cache from "@actions/cache";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as crypto from "crypto";

async function run() {
  try {
    const debug = core.getBooleanInput("debug");
    const log = (m: string) => core.info(debug ? `🐛 ${m}` : m);

    // 1. Resolve version
    let version = core.getInput("node-version");
    const versionFile = core.getInput("node-version-file");

    if (!version && versionFile && fs.existsSync(versionFile)) {
      const content = fs.readFileSync(versionFile, "utf-8");
      if (versionFile.includes("package.json")) {
        const pkg = JSON.parse(content);
        version = pkg.engines?.node;
      } else {
        version = content.trim();
      }
      log(`Resolved version from file: ${version}`);
    }

    if (!version) throw new Error("Node version not specified");

    // 2. Platform
    const platform = os.platform();
    const arch = core.getInput("architecture") || os.arch();

    const ext = platform === "win32" ? "zip" : "tar.gz";
    const base = core.getInput("mirror") || "https://nodejs.org/dist";

    const url = `${base}/v${version}/node-v${version}-${platform}-${arch}.${ext}`;
    log(`Download URL: ${url}`);

    // 3. Install Node
    let toolPath = tc.find("node", version, arch);

    if (!toolPath) {
      const dl = await tc.downloadTool(url);
      const extracted =
        platform === "win32"
          ? await tc.extractZip(dl)
          : await tc.extractTar(dl);

      toolPath = await tc.cacheDir(extracted, "node", version, arch);
    }

    core.addPath(path.join(toolPath, platform === "win32" ? "" : "bin"));

    // 4. Verify
    let output = "";
    await exec.exec("node", ["-v"], {
      listeners: { stdout: d => (output += d.toString()) }
    });

    core.setOutput("node-version", output.trim());
    log(`Node installed: ${output}`);

    // 5. Detect package manager
    let pm = core.getInput("cache");
    if (!pm) {
      if (fs.existsSync("pnpm-lock.yaml")) pm = "pnpm";
      else if (fs.existsSync("yarn.lock")) pm = "yarn";
      else pm = "npm";
    }

    log(`Package manager: ${pm}`);

    // 6. Registry config
    const registry = core.getInput("registry-url");
    const token = core.getInput("token");

    if (registry) {
      const npmrc = path.join(os.homedir(), ".npmrc");
      let content = `registry=${registry}\nalways-auth=true\n`;

      if (token) {
        const host = registry.replace(/^https?:/, "");
        content += `${host}:_authToken=${token}\n`;
      }

      fs.writeFileSync(npmrc, content);
    }

    // 7. Cache
    if (core.getBooleanInput("package-manager-cache")) {
      let lockfile = "package-lock.json";
      if (pm === "yarn") lockfile = "yarn.lock";
      if (pm === "pnpm") lockfile = "pnpm-lock.yaml";

      let hash = "nohash";
      if (fs.existsSync(lockfile)) {
        const data = fs.readFileSync(lockfile);
        hash = crypto.createHash("sha256").update(data).digest("hex");
      }

      const key = `${pm}-${platform}-${arch}-${version}-${hash}`;
      let dir = path.join(os.homedir(), ".npm");

      if (pm === "yarn") dir = path.join(os.homedir(), ".cache/yarn");
      if (pm === "pnpm") dir = path.join(os.homedir(), ".pnpm-store");

      await cache.restoreCache([dir], key);

      core.saveState("cache-dir", dir);
      core.saveState("cache-key", key);
    }

    // 8. Install deps
    if (core.getBooleanInput("install")) {
      if (pm === "npm") await exec.exec("npm", ["ci"]);
      if (pm === "yarn") await exec.exec("yarn", ["install", "--frozen-lockfile"]);
      if (pm === "pnpm") await exec.exec("pnpm", ["install", "--frozen-lockfile"]);
    }

  } catch (e: any) {
    core.setFailed(e.message);
  }
}

run();
