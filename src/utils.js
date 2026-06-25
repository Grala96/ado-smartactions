'use strict';

// ── Browser compatibility ─────────────────────────────────────────────────
// Firefox exposes the Promise-based `browser` namespace; Chrome (MV3 ≥ 88)
// exposes `chrome` which also returns Promises from storage calls.
// `ext` is used by content.js and options.js – both loaded after this file.
/* global browser, chrome */
const ext = (typeof browser !== 'undefined') ? browser : chrome; // eslint-disable-line no-undef

// ── Shared constants ──────────────────────────────────────────────────────

/**
 * Default branch name settings.
 * Used as the initial state and as a fallback when storage is unavailable.
 */
const DEFAULT_SETTINGS = {
  parts: [
    { id: 'type',   label: 'Type',   enabled: true,  separatorAfter: '/' },
    { id: 'number', label: 'Number', enabled: true,  separatorAfter: '-' },
    { id: 'title',  label: 'Title',  enabled: true,  separatorAfter: '' },
  ],
  // Raw ADO type names that map to their slugified form.
  // Any type NOT on this list will be replaced with customFallback.
  typeWhitelist: [
    'Vision',
    'Initiative',
    'Epic',
    'Feature',
    'User Story',
    'Issue',
    'Task',
    'Bug',
    'Test Case',
    'Job',
    'Risk',
    'Action Plan',
    'Objective',
    'Healthcheck',
    'Waiver',
    'Checkpoint',
    'Impediment',
  ],
  // Optional custom slug overrides for whitelisted types.
  // Key: exact whitelist entry, Value: custom slug string.
  // If a key is absent, the default slugify(entry) is used.
  typeMapping: {},
  // Value used when the work item type is not on the whitelist.
  customFallback: 'custom',
};

// ── Pure utility functions ────────────────────────────────────────────────

/**
 * Deep-clones a JSON-serializable object.
 * @template T
 * @param {T} obj
 * @returns {T}
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Converts a string into a URL-friendly slug.
 * Keeps only alphanumeric characters, replaces everything else with '-',
 * collapses consecutive dashes, and trims leading/trailing dashes.
 * @param {string} str
 * @returns {string}
 */
function slugify(str) {
  return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '');
}

/**
 * Resolves a raw ADO work item type against the settings whitelist.
 * Returns the custom mapping if set, the slugified whitelisted name if found,
 * the customFallback value if not listed, or an empty string when rawType is
 * falsy (type could not be determined).
 * @param {string|null} rawType  e.g. "User Story", "Bug"
 * @param {object}      settings
 * @returns {string}
 */
function resolveType(rawType, settings) {
  if (!rawType) return '';
  const whitelist = (settings.typeWhitelist && settings.typeWhitelist.length)
      ? settings.typeWhitelist
      : DEFAULT_SETTINGS.typeWhitelist;
  const match = whitelist.find(w => w.toLowerCase() === rawType.toLowerCase());
  if (match) {
    const mapping = settings.typeMapping || {};
    return (mapping[match] !== undefined && mapping[match] !== '')
        ? mapping[match]
        : slugify(match);
  }
  return (settings.customFallback !== undefined && settings.customFallback !== '')
      ? settings.customFallback
      : 'custom';
}

/**
 * Builds a branch name string from settings and work item data.
 * Skips parts that are disabled or have no value.
 * Does not append a separator after the last non-empty part.
 * @param {object}                                             settings
 * @param {{ type: string|null, number: string|null, title: string|null }} data
 * @returns {string}
 */
function buildBranchName(settings, { type, number, title }) {
  const values = {
    type:   resolveType(type, settings),
    number: number ? number         : '',
    title:  title  ? slugify(title) : '',
  };

  const enabledParts = settings.parts.filter(p => p.enabled && values[p.id]);

  return enabledParts.map((part, i) => {
    const sep = i < enabledParts.length - 1 ? (part.separatorAfter || '') : '';
    return values[part.id] + sep;
  }).join('');
}

