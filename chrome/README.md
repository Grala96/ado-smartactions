# ADO SmartActions – Chrome

Chrome (and Chromium-based e.g. Brave) version of the **ADO SmartActions** extension.

> For general information about the extension's features and configuration, see the [main README](../README.md).

---

## Manifest version

This version uses **Manifest V3 (MV3)**, the current standard for Chrome extensions.

Key manifest settings:

```json
{
  "manifest_version": 3,
  "options_page": "options.html",
  "permissions": ["storage"]
}
```

---

## Installation

### From the Chrome Web Store (recommended)

1. Open the [ADO SmartActions page on the Chrome Web Store](https://chromewebstore.google.com/detail/ado-smartactions).
2. Click **Add to Chrome**.
3. Confirm the permissions prompt.
4. The extension is active immediately.

### Developer / unpacked installation

1. Open `chrome://extensions`.
2. Enable **Developer mode** — toggle in the top-right corner.
3. Click **Load unpacked**.
4. Select the `chrome/` directory from this repository.
5. The extension is now active.

> After editing source files, run `./build.sh chrome` from the repository root and then click **🔄 Reload** on the extensions page.

---

## Differences from the Firefox version

| Feature          | Chrome         | Firefox                              |
|------------------|----------------|--------------------------------------|
| Manifest version | MV3            | MV2                                  |
| Options page key | `options_page` | `options_ui`                         |
| API namespace    | `chrome`       | `browser` (native Promise)           |
| Extension ID     | auto-assigned  | `ado-smartactions@extension` (gecko) |
| Min. version     | Chrome ≥ 88    | Firefox ≥ 91                         |
