# ⚡ Setup NodeJS

<img width="863" height="485" alt="image" src="https://github.com/user-attachments/assets/ff9b4782-a815-41c3-8f27-ecc3a7391392" />

> The smartest way to set up Node.js in GitHub Actions.  
> Zero guesswork. Maximum speed. Built for modern CI.

<p align="left">
  <img src="https://img.shields.io/github/actions/workflow/status/YOUR_ORG/setup-node-pro/ci.yml?style=for-the-badge" />
  <img src="https://img.shields.io/github/stars/YOUR_ORG/setup-node-pro?style=for-the-badge" />
  <img src="https://img.shields.io/github/license/YOUR_ORG/setup-node-pro?style=for-the-badge" />
  <img src="https://img.shields.io/github/v/release/YOUR_ORG/setup-node-pro?style=for-the-badge" />
</p>

----

**Please note**: We take our GitHub action's security and users' trust
very seriously. If you believe you have found a security issue
in any of our GitHub action, _please responsibly disclose_ by contacting us at
[security@anantacloud.com](mailto:security@anantacloud.com).

----

## 🚀 Why Setup Node.js Pro?

Most Node setup actions stop at installation.  
This one goes further.

- Auto-detects package manager (npm, yarn, pnpm)  
- Supports `.nvmrc`, `.node-version`, `package.json`, `.tool-versions`  
- Semver-aware version resolution  
- Cross-platform (Linux, macOS, Windows)  
- Built-in dependency install  
- Matrix-aware intelligent caching  
- Registry + authentication support  
- Mirror support for Node.js binaries  
- Debug mode for deep CI visibility  

Think of it as **setup-node, but evolved**.

---

## ⚡ Quick Start

```yaml
- name: Setup Node.js
  uses: anantacloud-actions/setup-node@v1
```

---

## 🧩 Usage Examples

### Use specific Node version

```yaml
- uses: anantacloud-actions/setup-node@v1
  with:
    node-version: 20
```

### Use version from file

```yaml
- uses: anantacloud-actions/setup-node@v1
  with:
    node-version-file: .nvmrc
```

### Enable caching

```yaml
- uses: anantacloud-actions/setup-node@v1
  with:
    cache: npm
```

### Configure private registry

```yaml
- uses: anantacloud-actions/setup-node@v1
  with:
    registry-url: https://registry.npmjs.org
    token: ${{ secrets.NPM_TOKEN }}
```

### Disable install step

```yaml
- uses: anantacloud-actions/setup-node@v1
  with:
    install: false
```

---

## 🛠 Inputs

| Name | Description | Required | Default |
|-----|------------|----------|--------|
| `node-version` | Version spec (e.g. 18, 20.x, >=18.0.0) | ❌ | - |
| `node-version-file` | File with version (e.g. .nvmrc, package.json) | ❌ | - |
| `architecture` | Target architecture (x86, x64, arm64) | ❌ | system |
| `check-latest` | Resolve latest matching version | ❌ | false |
| `registry-url` | Registry URL for npm/yarn/pnpm | ❌ | - |
| `scope` | Scope for registry authentication | ❌ | repo owner |
| `token` | Auth token for registry or downloads | ❌ | github token |
| `cache` | Package manager cache (npm, yarn, pnpm) | ❌ | auto |
| `package-manager-cache` | Enable/disable automatic caching | ❌ | true |
| `cache-dependency-path` | Path(s) to dependency files | ❌ | auto |
| `mirror` | Alternative Node.js download mirror | ❌ | nodejs.org |
| `mirror-token` | Token for mirror authentication | ❌ | - |
| `install` | Install dependencies automatically | ❌ | true |
| `debug` | Enable debug logging | ❌ | false |

---

## 📤 Outputs

| Name | Description |
|------|------------|
| `node-version` | Installed Node.js version |

---

## 🧠 Feature Breakdown

### 🔍 Version Resolution Priority

1. `node-version`
2. `node-version-file`
3. Error if none provided

---

### 📦 Auto Package Manager Detection

| File Found        | Manager |
|------------------|--------|
| pnpm-lock.yaml   | pnpm   |
| yarn.lock        | yarn   |
| none             | npm    |

---

### ⚡ Built-in Install

| Manager | Command |
|--------|--------|
| npm    | npm ci |
| yarn   | yarn install --frozen-lockfile |
| pnpm   | pnpm install --frozen-lockfile |

---

### ⚡ Matrix-Aware Caching

Cache key includes:
- OS
- Architecture
- Node version
- Lockfile hash

Result: faster and more reliable CI runs.

---

### 🌐 Registry Authentication

Supports:
- npm registry
- GitHub Packages
- Custom registries

Automatically configures `.npmrc`.

---

### 🌍 Mirror Support

Use custom mirror for faster downloads or internal networks.

---

## 🔥 Comparison

| Feature | setup-node | Setup Node.js Pro |
|--------|-----------|------------------|
| Auto detect package manager | ❌ | ✅ |
| Built-in install | ❌ | ✅ |
| Debug logs | ❌ | ✅ |
| Matrix-aware cache | ⚠️ | ✅ |
| Version file support | ⚠️ | ✅ |
| Mirror support | ❌ | ✅ |

---

## 🎯 Use Cases

- Monorepos (pnpm / yarn workspaces)
- Enterprise CI pipelines
- Multi-version testing
- Air-gapped environments (mirror support)
- Zero-config projects

---

## ⭐ Support

If this project helps you, consider giving it a ⭐  
It helps others discover it.

---

## 🧑‍💻 Contributing

PRs, issues, and suggestions are welcome.

---

## 📄 License

MIT
