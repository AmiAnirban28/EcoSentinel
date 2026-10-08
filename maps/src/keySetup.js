/**
 * The POWER UP surface — paste a key, get a power.
 *
 * Keys entered here live only in this browser tab and accompany same-origin
 * provider requests. The settings endpoint validates submissions but stores
 * nothing on the server.
 */
import { KEY_SETUP_KEYS, PROVIDER_SESSION_KEYS_HEADER } from './keySetupCore.mjs';

/** Chip label — pure, exported for tests. */
export function keySetupChipLabel(status) {
  return 'POWER UP · CONNECT APIs';
}

/**
 * Collect a POST body from field descriptors — pure, exported for tests.
 * @param {Array<{envVar: string, value: string}>} fields
 * @returns {Record<string, string>} non-empty trimmed values only
 */
export function collectKeyUpdates(fields) {
  const updates = {};
  for (const field of fields || []) {
    const value = String(field?.value ?? '').trim();
    if (value && field?.envVar) updates[field.envVar] = value;
  }
  return updates;
}

/**
 * After the FIRST Google key lands, the restart's reload should boot the
 * photoreal default — not faithfully restore the auto-selected keyless OSM
 * basemap from the URL's live share hash. Strips only `map=osm`: a stack under
 * any other name was chosen or shared on purpose and survives, and so does
 * everything else in the hash (camera, style, layers). Pure, exported for tests.
 * @param {string} hash Location hash without the leading '#'.
 * @returns {string|null} The rewritten hash, or null when there is nothing to strip.
 */
export function stripKeylessBasemapFromHash(hash) {
  if (!hash) return null;
  try {
    const params = new URLSearchParams(hash);
    if (!['osm', 'esri-imagery'].includes(params.get('map'))) return null;
    params.delete('map');
    return params.toString();
  } catch {
    return null;
  }
}

const TIER_DOTS = Object.freeze({ metered: '🔴', free: '🟡' });
const SESSION_KEY_STORAGE_PREFIX = 'ecosentinel.providerSessionKey.';
const CLIENT_EXPOSED_KEYS = new Set(['GOOGLE_MAPS_API_KEY', 'CESIUM_ION_TOKEN']);
const SESSION_SETTING_NAMES = new Set([
  ...KEY_SETUP_KEYS.flatMap((key) => key.envVars),
  'GEV_AI_PROVIDER',
  'OPENROUTER_MODEL',
]);

function readSessionSettings() {
  const settings = {};
  try {
    for (const name of SESSION_SETTING_NAMES) {
      const value = globalThis.sessionStorage?.getItem(`${SESSION_KEY_STORAGE_PREFIX}${name}`);
      if (value) settings[name] = value;
    }
  } catch {
    // Settings remain available for this page load if session storage is blocked.
  }
  return settings;
}

export function installProviderSessionFetch() {
  const root = globalThis;
  if (root.__gevProviderSessionFetchInstalled || typeof root.fetch !== 'function') return;
  const nativeFetch = root.fetch.bind(root);
  root.__gevProviderSessionFetchInstalled = true;
  root.fetch = (input, init = {}) => {
    let url;
    try {
      const requestUrl = typeof input === 'string' || input instanceof URL ? String(input) : input.url;
      url = new URL(requestUrl, root.location?.href);
    } catch {
      return nativeFetch(input, init);
    }
    if (!root.location?.origin || url.origin !== root.location.origin || !url.pathname.startsWith('/api/')) {
      return nativeFetch(input, init);
    }
    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    new Headers(init.headers || {}).forEach((value, name) => headers.set(name, value));
    const settings = readSessionSettings();
    if (Object.keys(settings).length) headers.set(PROVIDER_SESSION_KEYS_HEADER, JSON.stringify(settings));
    return nativeFetch(input, { ...init, headers });
  };
}

/** Build one key row. All content is our own registry text, set via textContent. */
function buildRow(documentRef, key) {
  const row = documentRef.createElement('section');
  row.className = 'key-setup-row';
  row.dataset.keyId = key.id;
  row.dataset.set = String(Boolean(key.set));

  const head = documentRef.createElement('div');
  head.className = 'key-setup-row-head';
  const led = documentRef.createElement('span');
  led.className = 'key-setup-led';
  led.setAttribute('aria-hidden', 'true');
  const title = documentRef.createElement('strong');
  title.textContent = key.title;
  const tier = documentRef.createElement('span');
  tier.className = 'key-setup-tier';
  tier.textContent = TIER_DOTS[key.tier] || '';
  tier.title = key.tier === 'metered' ? 'Metered — a billing-enabled account' : 'Free key — register, paste, done';
  head.append(led, title, tier);
  if (key.clientExposed) {
    const exposed = documentRef.createElement('span');
    exposed.className = 'key-setup-exposed';
    exposed.textContent = 'browser-side';
    exposed.title = 'This key runs in the browser by design — restrict it at the provider (see SECURITY.md)';
    head.append(exposed);
  }
  if (key.set) {
    const badge = documentRef.createElement('span');
    badge.className = 'key-setup-saved';
    badge.textContent = 'ACTIVE';
    badge.title = 'Configured for this tab; the key value is hidden';
    head.append(badge);
  }
  const get = documentRef.createElement('a');
  get.className = 'key-setup-get';
  get.href = key.getUrl;
  get.target = '_blank';
  get.rel = 'noopener noreferrer';
  get.textContent = 'GET KEY ↗';
  head.append(get);

  const unlocks = documentRef.createElement('p');
  unlocks.className = 'key-setup-unlocks';
  unlocks.textContent = key.unlocks;

  row.append(head, unlocks);
  const fields = documentRef.createElement('div');
  fields.className = 'key-setup-fields';
  for (const envVar of key.envVars) {
    const input = documentRef.createElement('input');
    input.type = 'password';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.dataset.envVar = envVar;
    input.setAttribute('aria-label', envVar);
    input.placeholder = key.set ? 'Active for this tab — paste to replace' : `paste ${envVar}`;
    fields.append(input);
  }
  if (key.set) {
    const clear = documentRef.createElement('button');
    clear.type = 'button';
    clear.className = 'key-setup-remove';
    clear.dataset.keySetupRemove = JSON.stringify(key.envVars);
    clear.textContent = 'CLEAR';
    clear.title = `Clear ${key.title} for this tab`;
    fields.append(clear);
  }
  row.append(fields);
  if (key.id === 'openrouter') {
    const modelField = documentRef.createElement('label');
    modelField.className = 'key-setup-model-field';
    const modelLabel = documentRef.createElement('span');
    modelLabel.textContent = 'MODEL';
    const modelInput = documentRef.createElement('input');
    modelInput.type = 'text';
    modelInput.maxLength = 160;
    modelInput.autocomplete = 'off';
    modelInput.spellcheck = false;
    modelInput.dataset.aiSetting = 'OPENROUTER_MODEL';
    modelInput.setAttribute('aria-label', 'OpenRouter model');
    modelInput.placeholder = 'openrouter/free';
    modelField.append(modelLabel, modelInput);
    row.append(modelField);
  }
  return row;
}

/**
 * Wire the chip + dialog. Fire-and-forget from main.js; resolves to null when
 * the surface has no server API or markup.
 */
export async function initKeySetup({ documentRef = globalThis.document, fetchImpl } = {}) {
  const chip = documentRef?.getElementById?.('key-setup-chip');
  const root = documentRef?.getElementById?.('key-setup');
  if (!chip || !root || root.dataset.initialized === 'true') return null;
  root.dataset.initialized = 'true';
  chip.hidden = false;
  installProviderSessionFetch();
  const doFetch = fetchImpl || globalThis.fetch?.bind(globalThis);

  let status = null;
  const readProviderStatus = async () => {
    const response = await doFetch('/api/setup/status', {
      cache: 'no-store',
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.error || `Provider settings unavailable (${response.status}).`);
    if (!Array.isArray(payload?.keys)) throw new Error('Provider settings returned an invalid response.');
    return payload;
  };
  try {
    status = await readProviderStatus();
  } catch {
    status = null;
  }

  const rowsHost = root.querySelector('[data-key-setup-rows]');
  const applyButton = root.querySelector('[data-key-setup-apply]');
  const closeButton = root.querySelector('[data-key-setup-close]');
  const chipLabel = chip.querySelector('[data-key-setup-chip-label]') || chip;
  const statusLine = root.querySelector('[data-key-setup-status]');
  const defaultStatusText = statusLine?.textContent || '';
  const deploymentNotice = 'This site needs its Node API server to connect provider credentials.';
  let busy = false;
  let open = false;
  let previouslyFocused = null;

  const render = (nextStatus) => {
    status = nextStatus;
    chipLabel.textContent = keySetupChipLabel(status);
    chip.hidden = false;
    if (!rowsHost) return;
    rowsHost.textContent = '';
    if (!status) {
      const notice = documentRef.createElement('p');
      notice.className = 'key-setup-unavailable';
      notice.textContent = deploymentNotice;
      rowsHost.append(notice);
      if (applyButton) applyButton.hidden = true;
      for (const control of root.querySelectorAll('[data-ai-setting]')) control.disabled = true;
      say(notice.textContent);
      return;
    }
    if (applyButton) applyButton.hidden = false;
    for (const key of status.keys || []) rowsHost.append(buildRow(documentRef, key));
    const aiSettings = status.aiSettings || {};
    for (const control of root.querySelectorAll('[data-ai-setting]')) {
      const name = control.dataset.aiSetting;
      if (name === 'GEV_AI_PROVIDER') {
        control.value = aiSettings.provider || 'openai';
        control.disabled = Boolean(aiSettings.providerManaged);
      } else if (name === 'OPENROUTER_MODEL') {
        control.value = aiSettings.openRouterModel || 'openrouter/free';
        control.disabled = Boolean(aiSettings.modelManaged);
      }
    }
  };

  const visible = () => root.isConnected
    && root.classList.contains('visible')
    && root.getClientRects().length > 0;

  const focusables = () => [
    ...root.querySelectorAll('button, input, [href], [tabindex]:not([tabindex="-1"])'),
  ].filter((node) => !node.hasAttribute('disabled') && node.getClientRects().length > 0);

  const onKeyDown = (event) => {
    if (!open || !visible()) return;
    // Cooperative ESC contract (see firstRunExperience.js): whoever handles a
    // key first marks it, and everyone else honours the mark.
    if (event.defaultPrevented) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const order = focusables();
    if (!order.length) return;
    const first = order[0];
    const last = order[order.length - 1];
    const active = documentRef.activeElement;
    if (!root.contains(active)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
      return;
    }
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const openDialog = () => {
    if (open) return;
    open = true;
    previouslyFocused = documentRef.activeElement;
    root.hidden = false;
    documentRef.addEventListener('keydown', onKeyDown, true);
    globalThis.requestAnimationFrame?.(() => {
      if (!open) return;
      root.classList.add('visible');
      root.querySelector('input')?.focus?.({ preventScroll: true });
    });
  };

  const close = () => {
    if (!open) return;
    open = false;
    documentRef.removeEventListener('keydown', onKeyDown, true);
    root.classList.remove('visible');
    const hide = () => { if (!open) root.hidden = true; };
    root.addEventListener('transitionend', hide, { once: true });
    globalThis.setTimeout?.(hide, 400);
    if (statusLine) statusLine.textContent = status ? defaultStatusText : deploymentNotice;
    if (typeof previouslyFocused?.focus === 'function' && previouslyFocused.isConnected) {
      previouslyFocused.focus({ preventScroll: true });
    }
  };

  const say = (text) => { if (statusLine) statusLine.textContent = text; };

  const submitUpdates = async (updates, doneVerb) => {
    if (busy) return;
    busy = true;
    applyButton?.setAttribute('aria-disabled', 'true');
    say('Saving…');
    try {
      const response = await doFetch('/api/setup/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ok) {
        say(payload.error || `Save failed (${response.status}).`);
        return;
      }
      for (const [name, value] of Object.entries(updates)) {
        try {
          if (value === null) globalThis.sessionStorage?.removeItem(`${SESSION_KEY_STORAGE_PREFIX}${name}`);
          else globalThis.sessionStorage?.setItem(`${SESSION_KEY_STORAGE_PREFIX}${name}`, value);
        } catch {
          // The current session still works when session storage is unavailable.
        }
      }
      for (const input of root.querySelectorAll('input[data-env-var]')) input.value = '';
      const nextStatus = await readProviderStatus();
      render(nextStatus);
      const clientKeyChanged = [...CLIENT_EXPOSED_KEYS].some((name) => Object.hasOwn(updates, name));
      if (clientKeyChanged) {
        const strip = () => {
          try {
            const next = stripKeylessBasemapFromHash(globalThis.location?.hash?.slice(1) || '');
            if (next !== null) globalThis.history?.replaceState?.(null, '', `#${next}`);
          } catch {
            // Continuity is a nicety, never a blocker.
          }
        };
        strip();
        // The live share writer may re-serialize the still-OSM stack before
        // the restart's reload lands, so strip again at the door.
        globalThis.addEventListener?.('pagehide', strip, { once: true });
      }
      if (clientKeyChanged) {
        say(`${doneVerb} for this tab. Reloading to apply map keys…`);
        globalThis.setTimeout?.(() => globalThis.location?.reload?.(), 250);
      } else {
        say(`${doneVerb} for this tab. Keys clear when this tab closes.`);
      }
    } catch (error) {
      say(`Save failed: ${error?.message || error}`);
    } finally {
      busy = false;
      applyButton?.setAttribute('aria-disabled', 'false');
    }
  };

  const onApply = async () => {
    if (busy || !status) return;
    const inputs = [...root.querySelectorAll('input[data-env-var]')];
    const updates = collectKeyUpdates(
      inputs.map((input) => ({ envVar: input.dataset.envVar, value: input.value })),
    );
    for (const control of root.querySelectorAll('[data-ai-setting]')) {
      if (!control.disabled) updates[control.dataset.aiSetting] = control.value;
    }
    await submitUpdates(updates, 'Applied');
  };

  rowsHost?.addEventListener('click', (event) => {
    const button = event.target?.closest?.('[data-key-setup-remove]');
    if (!button || busy) return;
    let envVars = [];
    try {
      envVars = JSON.parse(button.dataset.keySetupRemove || '[]');
    } catch {
      return;
    }
    if (!Array.isArray(envVars) || !envVars.length) return;
    void submitUpdates(Object.fromEntries(envVars.map((name) => [name, null])), 'Cleared');
  });

  chip.addEventListener('click', openDialog);
  documentRef.addEventListener('gev:open-provider-settings', openDialog);
  closeButton?.addEventListener('click', close);
  applyButton?.addEventListener('click', onApply);
  render(status);

  // Re-entry for demos and support: ?setup=1 opens the dialog on load.
  try {
    if (new URLSearchParams(globalThis.location?.search || '').get('setup') === '1') openDialog();
  } catch {
    // An unparsable location never blocks init.
  }

  return { open: openDialog, close, render };
}
