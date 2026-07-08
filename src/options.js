'use strict';

// utils.js is loaded before this script (see options.html) and provides:
//   ext, DEFAULT_SETTINGS, deepClone, slugify, buildBranchName
/* global ext, DEFAULT_SETTINGS, deepClone, slugify, buildBranchName */

// ── Constants ──────────────────────────────────────────────────────────────

/** Sample work item values used for the live preview. */
const SAMPLE = {
  type:   'User Story',   // raw ADO type name – resolved via whitelist
  number: '12345',
  title:  'my-task-title',
};

// ── State ──────────────────────────────────────────────────────────────────

let settings = deepClone(DEFAULT_SETTINGS);

// ── Preview ────────────────────────────────────────────────────────────────

/**
 * Builds a preview branch name using sample work item values.
 * Delegates to buildBranchName (from utils.js) so the preview
 * always mirrors the real generation logic exactly.
 * @param {object[]} parts
 * @param {string[]} whitelist
 * @returns {string}
 */
function buildPreview(parts, whitelist) {
  return buildBranchName(
      { parts, typeWhitelist: whitelist, typeMapping: settings.typeMapping || {}, customFallback: settings.customFallback },
      SAMPLE
  );
}

// ── Rendering ──────────────────────────────────────────────────────────────

function render() {
  renderParts();
  renderWhitelist();
  renderCustomFallback();
  updatePreview();
}

function renderParts() {
  const list = document.getElementById('parts-list');
  list.innerHTML = '';

  settings.parts.forEach((part, i) => {
    const row = document.createElement('div');
    row.className = 'part-row';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'part-checkbox';
    cb.id = `cb-${part.id}`;
    cb.checked = part.enabled;
    cb.addEventListener('change', () => {
      settings.parts[i].enabled = cb.checked;
      renderParts();
      updatePreview();
    });

    const lbl = document.createElement('label');
    lbl.className = 'part-label-text' + (part.enabled ? '' : ' disabled');
    lbl.htmlFor = `cb-${part.id}`;
    lbl.textContent = part.label;

    const btnUp = document.createElement('button');
    btnUp.className = 'btn-move';
    btnUp.title = 'Move up';
    btnUp.textContent = '↑';
    btnUp.disabled = i === 0;
    btnUp.addEventListener('click', () => {
      [settings.parts[i - 1], settings.parts[i]] = [settings.parts[i], settings.parts[i - 1]];
      renderParts();
      updatePreview();
    });

    const btnDown = document.createElement('button');
    btnDown.className = 'btn-move';
    btnDown.title = 'Move down';
    btnDown.textContent = '↓';
    btnDown.disabled = i === settings.parts.length - 1;
    btnDown.addEventListener('click', () => {
      [settings.parts[i], settings.parts[i + 1]] = [settings.parts[i + 1], settings.parts[i]];
      renderParts();
      updatePreview();
    });

    row.appendChild(cb);
    row.appendChild(lbl);
    row.appendChild(btnUp);
    row.appendChild(btnDown);
    list.appendChild(row);

    if (i < settings.parts.length - 1) {
      const sepRow = document.createElement('div');
      sepRow.className = 'sep-row';

      const sepLabel = document.createElement('span');
      sepLabel.className = 'sep-label';
      sepLabel.textContent = `separator after ${part.label}:`;

      const sepInput = document.createElement('input');
      sepInput.type = 'text';
      sepInput.className = 'sep-input';
      sepInput.value = part.separatorAfter;
      sepInput.maxLength = 8;
      sepInput.setAttribute('aria-label', `Separator after ${part.label}`);
      sepInput.addEventListener('input', () => {
        settings.parts[i].separatorAfter = sepInput.value;
        updatePreview();
      });

      sepRow.appendChild(sepLabel);
      sepRow.appendChild(sepInput);
      list.appendChild(sepRow);
    }
  });
}

function renderWhitelist() {
  const container = document.getElementById('whitelist-entries');
  container.innerHTML = '';

  const wl = settings.typeWhitelist || [];
  const mapping = settings.typeMapping || {};

  if (wl.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'wl-empty';
    empty.textContent = 'No entries – every type will be treated as the custom fallback.';
    container.appendChild(empty);
    return;
  }

  wl.forEach((entry, i) => {
    const row = document.createElement('div');
    row.className = 'wl-row';

    const name = document.createElement('span');
    name.className = 'wl-name';
    name.textContent = entry;

    const arrow = document.createElement('span');
    arrow.className = 'wl-arrow';
    arrow.textContent = '→';

    const customInput = document.createElement('input');
    customInput.type = 'text';
    customInput.className = 'wl-custom-input';
    customInput.placeholder = slugify(entry);
    customInput.value = mapping[entry] !== undefined ? mapping[entry] : '';
    customInput.setAttribute('aria-label', `Custom mapping for "${entry}"`);
    customInput.addEventListener('input', () => {
      if (!settings.typeMapping) settings.typeMapping = {};
      const val = customInput.value.trim();
      if (val) {
        settings.typeMapping[entry] = val;
      } else {
        delete settings.typeMapping[entry];
      }
      updatePreview();
    });

    const btnRemove = document.createElement('button');
    btnRemove.className = 'btn-wl-remove';
    btnRemove.title = `Remove "${entry}"`;
    btnRemove.textContent = '×';
    btnRemove.addEventListener('click', () => {
      settings.typeWhitelist.splice(i, 1);
      if (settings.typeMapping) delete settings.typeMapping[entry];
      renderWhitelist();
      updatePreview();
    });

    row.appendChild(name);
    row.appendChild(arrow);
    row.appendChild(customInput);
    row.appendChild(btnRemove);
    container.appendChild(row);
  });
}

function renderCustomFallback() {
  const input = document.getElementById('custom-fallback-input');
  if (input) {
    input.value = settings.customFallback !== undefined ? settings.customFallback : 'custom';
  }
}

function updatePreview() {
  const box = document.getElementById('preview');
  const text = buildPreview(settings.parts, settings.typeWhitelist || []);
  if (text) {
    box.textContent = text;
    box.classList.remove('preview-empty');
  } else {
    box.textContent = '(empty – enable at least one component)';
    box.classList.add('preview-empty');
  }
}

// ── Status helper ──────────────────────────────────────────────────────────

let statusTimer = null;
function showStatus(msg, isError = false) {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.className = 'status' + (isError ? ' error' : '');
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => { el.textContent = ''; }, 3000);
}

// ── Persistence ────────────────────────────────────────────────────────────

function saveSettings() {
  ext.storage.sync.set({ branchSettings: settings }).then(() => {
    showStatus('✓ Settings saved!');
  }).catch(err => {
    showStatus('❌ Save failed: ' + err.message, true);
  });
}

function loadSettings(callback) {
  ext.storage.sync.get('branchSettings').then(result => {
    if (result && result.branchSettings) {
      const labelMap = { type: 'Type', number: 'Number', title: 'Title' };
      settings = result.branchSettings;
      settings.parts.forEach(p => {
        if (!p.label) p.label = labelMap[p.id] || p.id;
      });
      // Backfill whitelist if missing (migration from older saved version)
      if (!settings.typeWhitelist) {
        settings.typeWhitelist = deepClone(DEFAULT_SETTINGS.typeWhitelist);
      }
      // Backfill typeMapping if missing
      if (!settings.typeMapping) {
        settings.typeMapping = {};
      }
      // Backfill customFallback if missing
      if (settings.customFallback === undefined) {
        settings.customFallback = DEFAULT_SETTINGS.customFallback;
      }
    }
    callback();
  }).catch(() => {
    callback();
  });
}

// ── Boot ───────────────────────────────────────────────────────────────────

document.getElementById('btn-save').addEventListener('click', saveSettings);

document.getElementById('btn-reset').addEventListener('click', () => {
  if (confirm('Reset all settings to defaults?')) {
    settings = deepClone(DEFAULT_SETTINGS);
    render();
    showStatus('Reset – click "Save settings" to persist.');
  }
});

document.getElementById('custom-fallback-input').addEventListener('input', e => {
  settings.customFallback = e.target.value;
  updatePreview();
});

document.getElementById('btn-wl-add').addEventListener('click', () => {
  const input = document.getElementById('wl-new-input');
  const value = input.value.trim();
  if (!value) return;

  if (!settings.typeWhitelist) settings.typeWhitelist = [];

  const duplicate = settings.typeWhitelist.some(
      w => w.toLowerCase() === value.toLowerCase()
  );
  if (!duplicate) {
    settings.typeWhitelist.push(value);
    renderWhitelist();
    updatePreview();
  }

  input.value = '';
  input.focus();
});

document.getElementById('wl-new-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-wl-add').click();
});

loadSettings(render);

// ── Tab switching ───────────────────────────────────────────────────────────

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.dataset.target;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(targetId).classList.add('active');
  });
});

