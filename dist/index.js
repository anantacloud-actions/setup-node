"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const tc = __importStar(require("@actions/tool-cache"));
const exec = __importStar(require("@actions/exec"));
const cache = __importStar(require("@actions/cache"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
async function run() {
    try {
        const debug = core.getBooleanInput("debug");
        const log = (m) => core.info(debug ? `🐛 ${m}` : m);
        // 1. Resolve version
        let version = core.getInput("node-version");
        const versionFile = core.getInput("node-version-file");
        if (!version && versionFile && fs.existsSync(versionFile)) {
            const content = fs.readFileSync(versionFile, "utf-8");
            if (versionFile.includes("package.json")) {
                const pkg = JSON.parse(content);
                version = pkg.engines?.node;
            }
            else {
                version = content.trim();
            }
            log(`Resolved version from file: ${version}`);
        }
        if (!version)
            throw new Error("Node version not specified");
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
            const extracted = platform === "win32"
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
            if (fs.existsSync("pnpm-lock.yaml"))
                pm = "pnpm";
            else if (fs.existsSync("yarn.lock"))
                pm = "yarn";
            else
                pm = "npm";
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
            if (pm === "yarn")
                lockfile = "yarn.lock";
            if (pm === "pnpm")
                lockfile = "pnpm-lock.yaml";
            let hash = "nohash";
            if (fs.existsSync(lockfile)) {
                const data = fs.readFileSync(lockfile);
                hash = crypto.createHash("sha256").update(data).digest("hex");
            }
            const key = `${pm}-${platform}-${arch}-${version}-${hash}`;
            let dir = path.join(os.homedir(), ".npm");
            if (pm === "yarn")
                dir = path.join(os.homedir(), ".cache/yarn");
            if (pm === "pnpm")
                dir = path.join(os.homedir(), ".pnpm-store");
            await cache.restoreCache([dir], key);
            core.saveState("cache-dir", dir);
            core.saveState("cache-key", key);
        }
        // 8. Install deps
        if (core.getBooleanInput("install")) {
            if (pm === "npm")
                await exec.exec("npm", ["ci"]);
            if (pm === "yarn")
                await exec.exec("yarn", ["install", "--frozen-lockfile"]);
            if (pm === "pnpm")
                await exec.exec("pnpm", ["install", "--frozen-lockfile"]);
        }
    }
    catch (e) {
        core.setFailed(e.message);
    }
}
run();
