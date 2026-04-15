# ⚡ Setup Node.js Pro

> The smartest way to set up Node.js in GitHub Actions.  
> Zero guesswork. Maximum speed. Built for modern CI.

<p align="center">
  <img src="https://img.shields.io/github/actions/workflow/status/YOUR_ORG/setup-node-pro/ci.yml?style=for-the-badge" />
  <img src="https://img.shields.io/github/stars/YOUR_ORG/setup-node-pro?style=for-the-badge" />
  <img src="https://img.shields.io/github/license/YOUR_ORG/setup-node-pro?style=for-the-badge" />
  <img src="https://img.shields.io/github/v/release/YOUR_ORG/setup-node-pro?style=for-the-badge" />
</p>

## 🚀 Why Setup Node.js Pro?

Most Node setup actions stop at installation.  
This one goes further.

- Auto-detects package manager (npm, yarn, pnpm)  
- Supports `.nvmrc` & `.node-version`  
- Semver-aware version resolution  
- Cross-platform (Linux, macOS, Windows)  
- Built-in dependency install  
- Matrix-aware intelligent caching  
- Debug mode for deep CI visibility  

Think of it as **setup-node, but evolved**.

## ⚡ Quick Start
```yaml
- name: Setup Node.js
  uses: YOUR_ORG/setup-node-pro@v1
```

## 🧩 Usage Examples
### Use specific Node version
```yaml
- uses: YOUR_ORG/setup-node-pro@v1
  with:
    node-version: 20
```

### Use `.nvmrc` automatically
```yaml
- uses: YOUR_ORG/setup-node-pro@v1
```

### Enable debug logs
```yaml
- uses: YOUR_ORG/setup-node-pro@v1
  with:
    debug: true
```

### Skip install step
```yaml
- uses: YOUR_ORG/setup-node-pro@v1
  with:
    install: false
```

## 🧠 Smart Features
### Auto Package Manager Detection

| File Found        | Manager |
|------------------|--------|
| pnpm-lock.yaml   | pnpm   |
| yarn.lock        | yarn   |
| none             | npm    |

### 📦 Built-in Install
| Manager | Command |
|--------|--------|
| npm    | npm ci |
| yarn   | yarn install --frozen-lockfile |
| pnpm   | pnpm install --frozen-lockfile |

### ⚡ Matrix-Aware Caching
Cache key includes:
- OS
- Architecture
- Node version
- Commit SHA

Result: faster and more reliable CI runs.

## 🛠 Inputs
| Name | Description | Default |
|-----|------------|--------|
| node-version | Node version (semver supported) | auto |
| check-latest | Resolve latest matching version | true |
| cache | Enable caching | true |
| install | Install dependencies | true |
| debug | Enable debug logs | false |

## 📤 Outputs
| Name | Description |
|------|------------|
| node-version | Installed Node version |

## 🔥 Comparison
| Feature | setup-node | Setup Node.js Pro |
|--------|-----------|------------------|
| Auto detect package manager | ❌ | ✅ |
| Built-in install | ❌ | ✅ |
| Debug logs | ❌ | ✅ |
| Matrix-aware cache | ⚠️ | ✅ |
| Version file support | ⚠️ | ✅ |

## 🎯 Use Cases
- Monorepos (pnpm / yarn workspaces)
- High-performance CI pipelines
- Multi-version matrix builds
- Zero-config projects
- Enterprise pipelines with strict caching

## ⭐ Support
- If this project helps you, consider giving it a ⭐  
- It helps others discover it.

## 🧑‍💻 Contributing
Contributions are welcome. Feel free to open issues or submit PRs.

## 📄 License
MIT
