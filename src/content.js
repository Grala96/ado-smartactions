(function () {
  'use strict';

  // utils.js is loaded before this script (see manifest.json) and provides:
  //   ext, DEFAULT_SETTINGS, slugify, resolveType, buildBranchName
  /* global ext, DEFAULT_SETTINGS, buildBranchName */

  // ── Constants ─────────────────────────────────────────────────────────────

  const BUTTON_ID = 'ado-smartactions-branch-gen-btn';
  const WORKITEM_URL_PATTERN = /(?:\/dev\.azure\.com\/.+|\.visualstudio\.com\/.+)\/_workitems\/edit\/(\d+)/;

  // ── Storage ───────────────────────────────────────────────────────────────

  /**
   * Loads branch name settings from extension storage.
   * Falls back to DEFAULT_SETTINGS if storage is unavailable or empty.
   * @returns {Promise<object>}
   */
  function getSettings() {
    return ext.storage.sync.get('branchSettings')
      .then(result => (result && result.branchSettings) || DEFAULT_SETTINGS)
      .catch(() => DEFAULT_SETTINGS);
  }

  // ── DOM helpers ───────────────────────────────────────────────────────────

  /**
   * Extracts the work item number from the current URL.
   * @returns {string|null}
   */
  function getWorkItemNumber() {
    const match = window.location.href.match(WORKITEM_URL_PATTERN);
    return match ? match[1] : null;
  }

  /**
   * Finds the title input field on the ADO work item page.
   * @returns {HTMLInputElement|null}
   */
  function getTitleInput() {
    return document.querySelector('input[aria-label="Title field"]');
  }

  /**
   * Finds the "Create a branch" modal element in the DOM.
   * ADO renders it as a div with class bolt-callout-modal.
   * @returns {Element|null}
   */
  function getCreateBranchModal() {
    return document.querySelector('.bolt-callout-modal');
  }

  /**
   * Finds the branch name input field inside the "Create a branch" modal.
   * @returns {HTMLInputElement|null}
   */
  function getBranchNameInput() {
    const modal = getCreateBranchModal();
    return modal ? modal.querySelector('input.item-name-input') : null;
  }

  /**
   * Tries to resolve the work item type label (e.g. "User Story", "Bug", "Task").
   * Looks first inside the modal (type icon aria-label, then link text), then
   * falls back to searching the whole page (direct work item view).
   * @returns {string|null}
   */
  function getWorkItemType() {
    const modal = getCreateBranchModal();

    if (modal) {
      // The type icon inside the linked work items table has role="img" + aria-label
      const typeEl = modal.querySelector('.work-item-type-icon') &&
          modal.querySelector('.work-item-type-icon').closest('[role="img"]');
      if (typeEl) return typeEl.getAttribute('aria-label');

      // Fallback: parse from the linked work item link text
      // Format: "User Story 1234567: Some title"
      const link = modal.querySelector('a[href*="/_workitems/edit/"]');
      if (link) {
        const m = link.textContent.trim().match(/^(.+?)\s+\d+:/);
        if (m) return m[1].trim();
      }
    }

    // Direct work item page: type icon is visible in the form header
    const pageTypeIcon = document.querySelector('.work-item-type-icon');
    if (pageTypeIcon) {
      const pageTypeEl = pageTypeIcon.closest('[role="img"]');
      if (pageTypeEl) return pageTypeEl.getAttribute('aria-label');
    }

    return null;
  }

  /**
   * Extracts the work item number, type, and title from the linked work items
   * section inside the "Create a branch" modal. Used as a fallback when the URL
   * does not contain a work item ID (e.g. when opened from the Sprints board).
   * @returns {{ number: string, type: string|null, title: string|null }|null}
   */
  function getWorkItemFromDialog() {
    const modal = getCreateBranchModal();
    const link = (modal || document).querySelector('.bolt-callout-modal a[href*="/_workitems/edit/"]')
        || document.querySelector('[role="dialog"] a[href*="/_workitems/edit/"]');
    if (!link) return null;

    const hrefMatch = link.href.match(/\/_workitems\/edit\/(\d+)/);
    if (!hrefMatch) return null;

    const number = hrefMatch[1];

    // "User Story 1653488: [PROJ-123] My feature"
    const linkText = link.textContent.trim();
    const m = linkText.match(/^(.+?)\s+\d+:\s+(.+)$/);

    return {
      number,
      type:  m ? m[1].trim() : null,
      title: m ? m[2].trim() : null,
    };
  }

  /**
   * Sets the value of a React-controlled input field, triggering React's
   * synthetic change event so ADO picks up the new value.
   * @param {HTMLInputElement} input
   * @param {string} value
   */
  function setReactInputValue(input, value) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
    ).set;
    nativeInputValueSetter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // ── Button ────────────────────────────────────────────────────────────────

  /**
   * Creates and returns the "Generate branch name" button.
   * Styled to match ADO's native bolt-button (like Cancel / Create).
   * @returns {HTMLButtonElement}
   */
  function createButton() {
    const btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.type = 'button';
    btn.title = 'Generate branch name';
    btn.className = 'bolt-button enabled bolt-focus-treatment';
    btn.setAttribute('role', 'button');
    btn.setAttribute('tabindex', '0');

    const span = document.createElement('span');
    span.className = 'bolt-button-text body-m';
    span.textContent = '🔀 Generate branch name';
    btn.appendChild(span);

    btn.style.cssText = 'display: block; margin-top: 0px; margin-bottom: 12px;';

    btn.addEventListener('click', async () => {
      const settings = await getSettings();

      // Primary source: work item ID from the current URL (direct work item page).
      // Fallback: extract from the linked work items inside the create-branch modal
      // (used when opened as a modal, e.g. from the Sprints board).
      let workItemNumber = getWorkItemNumber();
      let title = null;
      let type  = null;

      if (!workItemNumber) {
        const fromDialog = getWorkItemFromDialog();
        if (!fromDialog) {
          alert('Could not extract work item number from URL or from the linked work items in the dialog.');
          return;
        }
        workItemNumber = fromDialog.number;
        title = fromDialog.title;
        type  = fromDialog.type;
      }

      // Prefer the live title input over the parsed link text.
      const titleInput = getTitleInput();
      if (titleInput && titleInput.value.trim()) {
        title = titleInput.value.trim();
      }

      // Try to resolve type from the page if not already found.
      if (!type) {
        type = getWorkItemType();
      }

      if (!title) {
        alert('Could not determine the work item title.');
        return;
      }

      const branchName = buildBranchName(settings, { type, number: workItemNumber, title });

      if (!branchName) {
        alert('Branch name is empty – please check your settings in the extension options.');
        return;
      }

      const branchInput = getBranchNameInput();
      if (branchInput) {
        setReactInputValue(branchInput, branchName);
        branchInput.focus();
      } else {
        navigator.clipboard.writeText(branchName).then(() => {
          alert(
              `Branch name copied to clipboard:\n${branchName}\n\n` +
              'Paste it into the branch name field.'
          );
        }).catch(() => {
          prompt('Copy the branch name below:', branchName);
        });
      }
    });

    return btn;
  }

  // ── Injection & observation ───────────────────────────────────────────────

  /**
   * Injects the button after the "Name *" label if not already present.
   * Looks for the label inside the "Create a branch" modal (.bolt-callout-modal).
   */
  function injectButton() {
    if (document.getElementById(BUTTON_ID)) {
      return; // already injected
    }

    const modal = getCreateBranchModal();
    if (!modal) {
      return;
    }

    const nameLabel = modal.querySelector('label[aria-label="Name required"]');
    if (!nameLabel) {
      return;
    }

    const btn = createButton();
    nameLabel.insertAdjacentElement('afterend', btn);
  }

  /**
   * Observes DOM mutations to handle ADO's single-page-app navigation and
   * lazy-rendered dialogs (including work items opened as modals from the
   * Sprints board or other views).
   */
  function observe() {
    const observer = new MutationObserver(() => {
      injectButton();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Initial injection attempt + start observing for future changes.
  injectButton();
  observe();
})();
