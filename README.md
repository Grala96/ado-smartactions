# ADO SmartActions

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Firefox Add-ons](https://img.shields.io/badge/Firefox-Add--on-orange)](https://addons.mozilla.org/firefox/addon/ado-smartactions/)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-green)](https://chromewebstore.google.com/detail/ado-smartactions)

> Smart automation and workflow tweaks for Azure DevOps to eliminate tedious clicks.

<table>
  <tr>
    <td align="center">
      <img src="icons/icon.svg" width="128" height="128" alt="ADO-SmartActions-Icon">
    </td>
    <td>
      <strong>ADO SmartActions</strong> is a browser extension for <strong>Chrome</strong> and <strong>Firefox</strong> that adds handy automations directly inside Azure DevOps, removing repetitive and tedious manual actions.
    </td>
  </tr>
</table>

---

## Features

### 🔀 Branch Name Generator

Automatically generates a properly formatted Git branch name from the currently open Azure DevOps work item — with a single button click.

→ See [`docs/BNG.md`](docs/BNG.md) for full documentation (how it works, branch name format, slugification rules, and configuration).

---

## Repository structure

```
src/               ← single source of truth (edit here)
  content.js       content script – extension logic
  options.js       options page script
  options.html     options page HTML
  options.css      options page styles
  utils.js         shared utilities (slugify, buildBranchName, …)

chrome/
  manifest.json    Chrome-specific manifest (MV3)
  content.js  \
  options.*    \__ generated copies from src/ (do not edit directly)
  utils.js    /
  icons/

firefox/
  manifest.json    Firefox-specific manifest (MV2 + gecko settings)
  content.js  \
  options.*    \__ generated copies from src/ (do not edit directly)
  utils.js    /
  icons/

build.sh           copies src/ → chrome/ and firefox/
icons/             source SVG icon
```

> **Browser-specific directories contain generated copies.**
> Always edit files in `src/` and then run `build.sh`.

---

## Development workflow

```bash
# After editing anything in src/:
./build.sh           # rebuild both browsers
./build.sh chrome    # or rebuild only Chrome
./build.sh firefox   # or rebuild only Firefox
```

Then load the updated `chrome/` or `firefox/` directory as an unpacked extension in your browser.

---

## Installation

### Chrome / Edge

→ See [`chrome/README.md`](chrome/README.md) for detailed instructions.

### Firefox

→ See [`firefox/README.md`](firefox/README.md) for detailed instructions.

---

## Browser compatibility

The shared source uses a one-liner shim at the top of each file:

```js
const ext = (typeof browser !== 'undefined') ? browser : chrome;
```

| Browser | Manifest | API namespace | Notes                        |
|---------|----------|---------------|------------------------------|
| Firefox | MV2      | `browser`     | Native Promise-based API     |
| Chrome  | MV3      | `chrome`      | Promises available since v88 |

This lets the entire codebase use a single, consistent Promise style with no callbacks and no browser-specific branches.

---

## License

[GNU General Public License v3.0](LICENSE) — free and open source.

Contributions, bug reports, and feature requests are welcome on [GitHub Issues](https://github.com/Grala96/ado-smartactions/issues).
