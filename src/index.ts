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
    const log = (msg: string) => core.info(debug ? `🐛 ${msg}` : msg);

    const cwd = process.cwd();
    log(`Working directory: ${cwd}`);

    // =========================
    // 1. Resolve Node version
    // =========================
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

      log(`Resolved version from ${versionFile}: ${version}`);
    }

    if (!version) {
      throw new Error("Node version not specified");
    }

    // =========================
    // 2. Platform & Download
    // =========================
    const platform = os.platform();
    const arch = core.getInput("architecture") || os.arch();

    const ext = platform === "win32" ? "zip" : "tar.gz";
    const base = core.getInput("mirror") || "https://nodejs.org/dist";

    const url = `${base}/v${version}/node-v${version}-${platform}-${arch}.${ext}`;
    log(`Downloading Node from: ${url}`);

    // =========================
    // 3. Install Node
    // =========================
    let toolPath = tc.find("node", version, arch);

    if (!toolPath) {
      const download = await tc.downloadTool(url);
      const extracted =
        platform === "win32"
          ? await tc.extractZip(download)
          : await tc.extractTar(download);

      toolPath = await tc.cacheDir(extracted, "node", version, arch);
    }

    const binPath = platform === "win32" ? toolPath : path.join(toolPath, "bin");
    core.addPath(binPath);

    // Verify Node
    let nodeVersionOutput = "";
    await exec.exec("node", ["-v"], {
      listeners: {
        stdout: (data) => (nodeVersionOutput += data.toString()),
      },
    });

    core.setOutput("node-version", nodeVersionOutput.trim());
    log(`Node installed: ${nodeVersionOutput.trim()}`);

    // =========================
    // 4. Detect Package Manager
    // =========================
    let pm = core.getInput("cache");

    if (!pm) {
      if (fs.existsSync("pnpm-lock.yaml")) pm = "pnpm";
      else if (fs.existsSync("yarn.lock")) pm = "yarn";
      else pm = "npm";
    }

    log(`Detected package manager: ${pm}`);

    // =========================
    // 5. Registry Config
    // =========================
    const registry = core.getInput("registry-url");
    const token = core.getInput("token");

    if (registry) {
      const npmrcPath = path.join(os.homedir(), ".npmrc");

      let content = `registry=${registry}\n`;

      if (token) {
        const host = registry.replace(/^https?:/, "");
        content += `${host}:_authToken=${token}\n`;
      }

      fs.writeFileSync(npmrcPath, content);
      log(`Configured registry: ${registry}`);
    }

    // =========================
    // 6. Cache (only if project exists)
    // =========================
    const hasPackageJson = fs.existsSync("package.json");

    if (!hasPackageJson) {
      core.info("No package.json found, skipping cache and install steps");
      return;
    }

    if (core.getBooleanInput("package-manager-cache")) {
      let lockfile = "package-lock.json";
      if (pm === "yarn") lockfile = "yarn.lock";
      if (pm === "pnpm") lockfile = "pnpm-lock.yaml";

      let hash = "nohash";

      if (fs.existsSync(lockfile)) {
        const data = fs.readFileSync(lockfile);
        hash = crypto.createHash("sha256").update(data).digest("hex");
      }

      const key = `${pm}-${os.platform()}-${arch}-${version}-${hash}`;

      let cacheDir = path.join(os.homedir(), ".npm");
      if (pm === "yarn") cacheDir = path.join(os.homedir(), ".cache/yarn");
      if (pm === "pnpm") cacheDir = path.join(os.homedir(), ".pnpm-store");

      log(`Restoring cache with key: ${key}`);

      try {
        await cache.restoreCache([cacheDir], key);
      } catch (e: any) {
        core.warning(`Cache restore failed: ${e.message}`);
      }

      core.saveState("cache-dir", cacheDir);
      core.saveState("cache-key", key);
    }

    // =========================
    // 7. Install Dependencies
    // =========================
    if (core.getBooleanInput("install")) {
      core.info(`📦 Installing dependencies using ${pm}`);

      if (pm === "npm") {
        const hasLock = fs.existsSync("package-lock.json");

        if (hasLock) {
          await exec.exec("npm", ["ci"]);
        } else {
          core.warning("No package-lock.json found, using npm install");
          await exec.exec("npm", ["install"]);
        }
      }

      if (pm === "yarn") {
        await exec.exec("yarn", ["install", "--frozen-lockfile"]);
      }

      if (pm === "pnpm") {
        await exec.exec("pnpm", ["install", "--frozen-lockfile"]);
      }
    }

  } catch (err: any) {
    core.setFailed(err.message);
  }
}

run();
