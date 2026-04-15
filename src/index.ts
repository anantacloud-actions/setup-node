import * as core from "@actions/core";
import * as tc from "@actions/tool-cache";
import * as exec from "@actions/exec";
import * as cache from "@actions/cache";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as semver from "semver";

async function run() {
  try {
    const debug = core.getBooleanInput("debug");

    function log(msg: string) {
      core.info(debug ? `🐛 ${msg}` : msg);
    }

    let version = core.getInput("node-version");

    if (!version) {
      if (fs.existsSync(".nvmrc")) {
        version = fs.readFileSync(".nvmrc", "utf-8").trim();
        log(`Using .nvmrc: ${version}`);
      } else if (fs.existsSync(".node-version")) {
        version = fs.readFileSync(".node-version", "utf-8").trim();
        log(`Using .node-version: ${version}`);
      } else {
        throw new Error("No node-version provided or version file found");
      }
    }

    const checkLatest = core.getBooleanInput("check-latest");

    log(`Resolving version: ${version}`);

    const manifest = await tc.getManifestFromRepo(
      "actions",
      "node-versions",
      "main"
    );

    const resolved = tc.findFromManifest(version, false, manifest);

    if (!resolved) {
      throw new Error(`Version not found: ${version}`);
    }

    const finalVersion = resolved.version;
    log(`Resolved to: ${finalVersion}`);

    const platform = os.platform();
    const arch = os.arch();

    let ext = "tar.gz";
    let binPath = "bin";

    if (platform === "win32") {
      ext = "zip";
      binPath = "";
    }

    const url = `https://nodejs.org/dist/v${finalVersion}/node-v${finalVersion}-${platform}-${arch}.${ext}`;

    log(`Downloading from: ${url}`);

    let toolPath = tc.find("node", finalVersion, arch);

    if (!toolPath) {
      const download = await tc.downloadTool(url);

      const extracted =
        platform === "win32"
          ? await tc.extractZip(download)
          : await tc.extractTar(download);

      toolPath = await tc.cacheDir(extracted, "node", finalVersion, arch);
    }

    core.addPath(path.join(toolPath, binPath));

    let nodeVersionOutput = "";
    await exec.exec("node", ["-v"], {
      listeners: {
        stdout: (data) => (nodeVersionOutput += data.toString())
      }
    });

    core.setOutput("node-version", nodeVersionOutput.trim());
    log(`Node installed: ${nodeVersionOutput}`);

    let pkgManager = "npm";

    if (fs.existsSync("pnpm-lock.yaml")) pkgManager = "pnpm";
    else if (fs.existsSync("yarn.lock")) pkgManager = "yarn";

    log(`Detected package manager: ${pkgManager}`);

    if (core.getBooleanInput("cache")) {
      const key = `${pkgManager}-${platform}-${arch}-${finalVersion}-${process.env.GITHUB_SHA}`;

      let cacheDir = "";

      if (pkgManager === "npm") cacheDir = path.join(os.homedir(), ".npm");
      if (pkgManager === "yarn") cacheDir = path.join(os.homedir(), ".cache/yarn");
      if (pkgManager === "pnpm") cacheDir = path.join(os.homedir(), ".pnpm-store");

      log(`Restoring cache: ${key}`);

      await cache.restoreCache([cacheDir], key);

      core.saveState("cache-dir", cacheDir);
      core.saveState("cache-key", key);
    }

    if (core.getBooleanInput("install")) {
      log("Installing dependencies...");

      if (pkgManager === "npm") {
        await exec.exec("npm", ["ci"]);
      } else if (pkgManager === "yarn") {
        await exec.exec("yarn", ["install", "--frozen-lockfile"]);
      } else if (pkgManager === "pnpm") {
        await exec.exec("pnpm", ["install", "--frozen-lockfile"]);
      }
    }

  } catch (err: any) {
    core.setFailed(err.message);
  }
}

run();
