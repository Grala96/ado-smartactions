# ADO SmartActions – Firefox

Firefox version of the **ADO SmartActions** extension.

> For general information about the extension's features and configuration, see the [main README](../README.md).

---

## Manifest version

This version uses **Manifest V2 (MV2)** with Firefox-specific gecko settings.

Key manifest settings:

```json
{
  "manifest_version": 2,
  "browser_specific_settings": {
    "gecko": {
      "id": "ado-smartactions@extension",
      "strict_min_version": "91.0"
    }
  },
  "options_ui": {
    "page": "options.html",
    "browser_style": false
  },
  "permissions": ["storage"]
}
```

---

## Installation

### From Firefox Add-ons (recommended)

1. Open the [ADO SmartActions page on Firefox Add-ons](https://addons.mozilla.org/firefox/addon/ado-smartactions/).
2. Click **Add to Firefox**.
3. Confirm the permissions prompt.
4. The extension is active immediately.

### Temporary installation (development)

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…**.
3. Select the `manifest.json` file from the `firefox/` directory.
4. The extension is active for the current browser session.

> Temporary add-ons are removed when Firefox restarts. Run `./build.sh firefox` from the repository root after editing source files, then reload the add-on.

### Permanent installation via `.xpi`

Package the extension as an `.xpi` file and install it permanently:

```bash
cd firefox
zip -r ../ado-smartactions-firefox.xpi manifest.json content.js utils.js options.html options.js options.css icons/
```

Then either:
- Open the `.xpi` in Firefox directly, **or**
- Go to `about:addons` → gear icon → **Install Add-on From File…**

> **Note:** Without Mozilla signing, permanent installation requires Firefox Developer Edition / Nightly with `xpinstall.signatures.required` set to `false` in `about:config`.

### Using `web-ext`

```bash
npm install -g web-ext
cd firefox
web-ext run    # starts Firefox with the extension loaded
web-ext build  # packages into a .zip / .xpi ready for signing
```

---

## Differences from the Chrome version

| Feature          | Firefox                              | Chrome         |
|------------------|--------------------------------------|----------------|
| Manifest version | MV2                                  | MV3            |
| Options page key | `options_ui`                         | `options_page` |
| API namespace    | `browser` (native Promise)           | `chrome`       |
| Extension ID     | `ado-smartactions@extension` (gecko) | auto-assigned  |
| Min. version     | Firefox ≥ 91                         | Chrome ≥ 88    |
