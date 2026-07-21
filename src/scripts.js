// Mobile menu toggle
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

function toggleSidebar() {
  // Only toggle if on mobile
  if (window.innerWidth <= 1200) {
    sidebar.classList.toggle('active');
    sidebarOverlay.classList.toggle('active');
    document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
  }
}

mobileMenuToggle?.addEventListener('click', toggleSidebar);
sidebarOverlay?.addEventListener('click', toggleSidebar);

// Close sidebar on resize to desktop
window.addEventListener('resize', () => {
  if (window.innerWidth > 1200) {
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// Route card expansion
document.querySelectorAll('.route-header')?.forEach(header => {
  header.addEventListener('click', () => {
    const card = header.closest('.route-card');
    const body = card.querySelector('.route-body');
    const isExpanded = card.classList.contains('expanded');

    if (isExpanded) {
      // Snap max-height to actual height first so collapse starts immediately
      body.style.maxHeight = body.scrollHeight + 'px';
      requestAnimationFrame(() => {
        body.style.maxHeight = '0';
      });
      card.classList.remove('expanded');
    } else {
      card.classList.add('expanded');
      body.style.maxHeight = body.scrollHeight + 'px';
      body.addEventListener(
        'transitionend',
        () => {
          // Allow free resize (e.g. nested textareas) once fully open
          if (card.classList.contains('expanded')) {
            body.style.maxHeight = 'none';
          }
        },
        { once: true }
      );
    }
  });
});

// Smooth scroll for sidebar links
document.querySelectorAll('.sidebar-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();

    // Set active immediately on click
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      // Calculate total sticky header height
      const mobileTopbar = document.querySelector('.mobile-topbar');
      const stickyBar = document.querySelector('.search-filter-bar');

      let stickyOffset = 0;

      // Add mobile topbar height if visible
      if (mobileTopbar && window.getComputedStyle(mobileTopbar).display !== 'none') {
        stickyOffset += mobileTopbar.offsetHeight;
      }

      // Add search filter bar height
      if (stickyBar) {
        stickyOffset += stickyBar.offsetHeight;
      }

      // Add small buffer for better positioning
      const offset = stickyOffset + 12;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });

      // Close sidebar on mobile after clicking a link
      if (window.innerWidth <= 1200 && sidebar.classList.contains('active')) {
        toggleSidebar();
      }
    }
  });
});

// Scroll spy - highlight active section
function updateActiveSection() {
  // Calculate total sticky header height
  const mobileTopbar = document.querySelector('.mobile-topbar');
  const stickyBar = document.querySelector('.search-filter-bar');

  let stickyOffset = 0;

  // Add mobile topbar height if visible
  if (mobileTopbar && window.getComputedStyle(mobileTopbar).display !== 'none') {
    stickyOffset += mobileTopbar.offsetHeight;
  }

  // Add search filter bar height
  if (stickyBar) {
    stickyOffset += stickyBar.offsetHeight;
  }

  // Add a small buffer to trigger slightly before hiding under sticky header
  const scrollPos = window.scrollY + stickyOffset + 20;

  const sections = Array.from(document.querySelectorAll('.route-card')).filter(card =>
    document.querySelector(`.sidebar-link[href="#${card.id}"]`)
  );

  if (sections.length === 0) return;

  // Find the current section - the last one whose top has passed the scroll position
  let current = sections[0];
  for (const section of sections) {
    if (section.offsetTop <= scrollPos) {
      current = section;
    } else {
      break;
    }
  }

  // Update active link
  const activeLink = document.querySelector(`.sidebar-link[href="#${current.id}"]`);
  const currentActive = document.querySelector('.sidebar-link.active');

  if (activeLink && activeLink !== currentActive) {
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    activeLink.classList.add('active');
  }
}

// Debounce scroll events
let scrollTimeout;
window.addEventListener(
  'scroll',
  () => {
    if (scrollTimeout) {
      window.cancelAnimationFrame(scrollTimeout);
    }
    scrollTimeout = window.requestAnimationFrame(updateActiveSection);
  },
  { passive: true }
);

// Set initial active state
window.addEventListener('load', () => {
  updateActiveSection();
});

// Configuration modal functions
function updateConfigButton() {
  const baseUrl = localStorage.getItem('trpc-base-url');
  const configButton = document.getElementById('configButton');
  const configButtonText = document.getElementById('configButtonText');
  const mobileConfigButton = document.getElementById('mobileConfigButton');

  if (baseUrl) {
    configButton.classList.add('configured');
    configButtonText.textContent = 'Change Base URL';
    mobileConfigButton?.classList.add('configured');
  } else {
    configButton.classList.remove('configured');
    configButtonText.textContent = 'Configure Base URL';
    mobileConfigButton?.classList.remove('configured');
  }
}

function openConfigModal() {
  const modal = document.getElementById('configModal');
  const input = document.getElementById('baseUrlInput');

  input.value = localStorage.getItem('trpc-base-url') || '';
  modal.classList.add('active');
  setTimeout(() => input.focus(), 100);
}

function closeConfigModal() {
  const modal = document.getElementById('configModal');
  modal.classList.remove('active');
}

function saveBaseUrl() {
  const input = document.getElementById('baseUrlInput');
  const baseUrl = input.value.trim();

  if (!baseUrl) {
    alert('Please enter a base URL');
    return;
  }

  try {
    new URL(baseUrl);
  } catch (e) {
    alert('Please enter a valid URL (including http:// or https://)');
    return;
  }

  localStorage.setItem('trpc-base-url', baseUrl);
  updateConfigButton();
  updateSnippetBaseUrls();
  closeConfigModal();
}

// Close modal on ESC key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeConfigModal();
  }
});

// Close modal on backdrop click
document.getElementById('configModal')?.addEventListener('click', e => {
  if (e.target.id === 'configModal') {
    closeConfigModal();
  }
});

// Code snippet tabs (cURL / fetch / tRPC Client)
window.switchSnippetTab = function (tabName, btn) {
  const section = btn.closest('.route-section');
  if (!section) return;
  section.querySelectorAll('.snippet-tab').forEach(tab => tab.classList.remove('active'));
  btn.classList.add('active');
  section.querySelectorAll('.snippet-panel').forEach(panel => {
    panel.style.display = panel.dataset.snippetPanel === tabName ? '' : 'none';
  });
};

// Substitute the {{BASE_URL}} placeholder in code snippets with the configured base URL
function updateSnippetBaseUrls() {
  const baseUrl = localStorage.getItem('trpc-base-url') || '{{BASE_URL}}';
  document.querySelectorAll('pre[data-base-url-template="true"]').forEach(pre => {
    if (pre.dataset.originalText === undefined) {
      pre.dataset.originalText = pre.textContent;
    }
    pre.textContent = pre.dataset.originalText.split('{{BASE_URL}}').join(baseUrl);
  });
}

// Initialize config button state
updateConfigButton();
updateSnippetBaseUrls();

// Header management functions
function addHeader(routeId) {
  const container = document.getElementById('headers-' + routeId);
  const headerRow = document.createElement('div');
  headerRow.className = 'header-row';
  headerRow.innerHTML = `
    <input type="text" class="header-input" placeholder="Header name" data-type="key">
    <input type="text" class="header-input" placeholder="Header value" data-type="value">
    <button class="btn-icon" onclick="removeHeader(this)" title="Remove header">
      <span class="iconify" data-icon="mdi:close" style="width: 16px; height: 16px;"></span>
    </button>
  `;
  container.appendChild(headerRow);
}

function removeHeader(button) {
  const headerRow = button.closest('.header-row');
  const container = headerRow.parentElement;
  if (container.children.length > 1) {
    headerRow.remove();
  } else {
    // Clear the inputs instead of removing if it's the last one
    headerRow.querySelectorAll('.header-input').forEach(input => (input.value = ''));
  }
}

function getHeaders(routeId) {
  const container = document.getElementById('headers-' + routeId);
  const headers = {};
  container.querySelectorAll('.header-row').forEach(row => {
    const key = row.querySelector('[data-type="key"]').value.trim();
    const value = row.querySelector('[data-type="value"]').value.trim();
    if (key && value) {
      headers[key] = value;
    }
  });
  return headers;
}

function saveHeaders(routeId) {
  const headers = getHeaders(routeId);
  localStorage.setItem('trpc-docs-headers', JSON.stringify(headers));

  const saveBtn = document.getElementById('save-btn-' + routeId);
  saveBtn.classList.add('saved');
  saveBtn.innerHTML = `
    <span class="iconify" data-icon="mdi:check" style="width: 14px; height: 14px;"></span>
    Saved!
  `;

  setTimeout(() => {
    saveBtn.classList.remove('saved');
    saveBtn.innerHTML = `
      <span class="iconify" data-icon="mdi:content-save" style="width: 14px; height: 14px;"></span>
      Save Headers
    `;
  }, 2000);
}

function loadHeaders(routeId) {
  const saved = localStorage.getItem('trpc-docs-headers');
  if (!saved) {
    alert('No saved headers found');
    return;
  }

  const headers = JSON.parse(saved);
  const container = document.getElementById('headers-' + routeId);

  // Clear existing headers
  container.innerHTML = '';

  // Add saved headers
  Object.entries(headers).forEach(([key, value]) => {
    const headerRow = document.createElement('div');
    headerRow.className = 'header-row';
    headerRow.innerHTML = `
      <input type="text" class="header-input" placeholder="Header name" data-type="key" value="${escapeHtml(key)}">
      <input type="text" class="header-input" placeholder="Header value" data-type="value" value="${escapeHtml(value)}">
      <button class="btn-icon" onclick="removeHeader(this)" title="Remove header">
        <span class="iconify" data-icon="mdi:close" style="width: 16px; height: 16px;"></span>
      </button>
    `;
    container.appendChild(headerRow);
  });

  // Add one empty row if no headers loaded
  if (container.children.length === 0) {
    addHeader(routeId);
  }
}

// ── Per-endpoint request history ────────────────────────────────
const MAX_HISTORY_ENTRIES = 10;

function getRequestHistory(routeId) {
  try {
    const saved = localStorage.getItem('trpc-history-' + routeId);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

function saveRequestHistory(routeId, entry) {
  const history = getRequestHistory(routeId);
  history.unshift(entry);
  localStorage.setItem(
    'trpc-history-' + routeId,
    JSON.stringify(history.slice(0, MAX_HISTORY_ENTRIES))
  );
}

function clearRequestHistory(routeId, event) {
  if (event) event.stopPropagation();
  localStorage.removeItem('trpc-history-' + routeId);
  const dropdown = document.getElementById('history-dropdown-' + routeId);
  if (dropdown) dropdown.innerHTML = renderHistoryList(routeId);
}

function formatHistoryTimestamp(ts) {
  const date = new Date(ts);
  return (
    date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
    ' ' +
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
}

function renderHistoryList(routeId) {
  const history = getRequestHistory(routeId);
  if (history.length === 0) {
    return '<div class="history-empty">No requests sent yet</div>';
  }

  const items = history
    .map((entry, index) => {
      const statusClass = entry.ok ? 'success' : 'error';
      const statusLabel = entry.status ? entry.status + ' ' + entry.statusText : 'Failed';
      const hasBody = entry.input !== null && entry.input !== undefined;
      const preview = hasBody ? escapeHtml(JSON.stringify(entry.input)).slice(0, 60) : '(no body)';
      return `
        <div class="history-item" onclick="replayHistoryEntry('${routeId}', ${index})">
          <div class="history-item-meta">
            <span class="history-item-status ${statusClass}">${statusLabel}</span>
            <span class="history-item-time">${formatHistoryTimestamp(entry.timestamp)}</span>
          </div>
          <div class="history-item-preview">${preview}</div>
        </div>
      `;
    })
    .join('');

  return `
    <div class="history-items">${items}</div>
    <div class="history-footer">
      <button class="history-clear-btn" onclick="clearRequestHistory('${routeId}', event)">Clear history</button>
    </div>
  `;
}

function positionHistoryDropdown(dropdown, btn) {
  // Anchor with fixed coordinates and move to <body> so no ancestor's
  // overflow: hidden (e.g. .route-card's rounded-corner clipping) can hide it.
  if (dropdown.parentElement !== document.body) {
    document.body.appendChild(dropdown);
  }
  const rect = btn.getBoundingClientRect();
  const width = dropdown.offsetWidth || 280;
  const left = Math.min(rect.right - width, window.innerWidth - width - 8);
  const margin = 8;
  const spaceBelow = window.innerHeight - rect.bottom - margin - 6;
  const spaceAbove = rect.top - margin - 6;
  const preferredMaxHeight = 320;

  dropdown.style.position = 'fixed';
  dropdown.style.left = Math.max(8, left) + 'px';

  if (spaceBelow >= Math.min(160, preferredMaxHeight) || spaceBelow >= spaceAbove) {
    // Open downward, capped to whatever room is actually available.
    dropdown.style.top = rect.bottom + 6 + 'px';
    dropdown.style.bottom = '';
    dropdown.style.maxHeight = Math.max(120, Math.min(preferredMaxHeight, spaceBelow)) + 'px';
  } else {
    // Not enough room below — open upward instead.
    dropdown.style.top = '';
    dropdown.style.bottom = window.innerHeight - rect.top + 6 + 'px';
    dropdown.style.maxHeight = Math.max(120, Math.min(preferredMaxHeight, spaceAbove)) + 'px';
  }
}

function toggleHistoryDropdown(routeId, path, type) {
  const dropdown = document.getElementById('history-dropdown-' + routeId);
  const btn = document.getElementById('history-btn-' + routeId);
  if (!dropdown || !btn) return;

  const isOpen = dropdown.style.display === 'flex';

  // Close any open history dropdowns
  document.querySelectorAll('.history-dropdown').forEach(el => {
    el.style.display = 'none';
  });
  if (isOpen) return;

  dropdown.dataset.path = path;
  dropdown.dataset.type = type;
  dropdown.innerHTML = renderHistoryList(routeId);
  positionHistoryDropdown(dropdown, btn);
  dropdown.style.display = 'flex';
}

function replayHistoryEntry(routeId, index) {
  const history = getRequestHistory(routeId);
  const entry = history[index];
  if (!entry) return;

  const inputField = document.getElementById('input-' + routeId);
  if (inputField) {
    inputField.value =
      entry.input !== null && entry.input !== undefined ? JSON.stringify(entry.input, null, 2) : '';
  }

  const dropdown = document.getElementById('history-dropdown-' + routeId);
  const path = dropdown ? dropdown.dataset.path : '';
  const type = dropdown ? dropdown.dataset.type : '';
  if (dropdown) dropdown.style.display = 'none';

  testEndpoint(routeId, path, type);
}

// Close history dropdowns when clicking outside of them (dropdowns may live
// under <body> once opened, so match by id instead of DOM containment).
document.addEventListener('click', e => {
  document.querySelectorAll('.history-dropdown').forEach(dropdown => {
    if (dropdown.style.display === 'none') return;
    const routeId = dropdown.id.replace('history-dropdown-', '');
    const btn = document.getElementById('history-btn-' + routeId);
    if (!dropdown.contains(e.target) && !(btn && btn.contains(e.target))) {
      dropdown.style.display = 'none';
    }
  });
});

// Close history dropdowns on scroll/resize since their position is computed
// once at open time and would otherwise go stale. Ignore scroll events that
// originate from inside a dropdown itself (e.g. scrolling the history list),
// since those don't move the dropdown's anchor and shouldn't close it.
window.addEventListener(
  'scroll',
  e => {
    if (e.target && e.target.nodeType === 1 && e.target.closest('.history-dropdown')) return;
    document.querySelectorAll('.history-dropdown').forEach(el => {
      el.style.display = 'none';
    });
  },
  true
);
window.addEventListener('resize', () => {
  document.querySelectorAll('.history-dropdown').forEach(el => {
    el.style.display = 'none';
  });
});

// Endpoint testing function
// ── Response schema validation ─────────────────────────────────
function schemaTypeOf(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function sameSchemaValue(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function validateAgainstSchema(data, schema, path) {
  path = path || '$';
  if (!schema || typeof schema !== 'object') return [];

  if (schema.const !== undefined) {
    return sameSchemaValue(data, schema.const)
      ? []
      : [
          path +
            ': expected constant ' +
            JSON.stringify(schema.const) +
            ', got ' +
            JSON.stringify(data)
        ];
  }

  if (Array.isArray(schema.enum)) {
    return schema.enum.some(v => sameSchemaValue(v, data))
      ? []
      : [
          path +
            ': expected one of ' +
            JSON.stringify(schema.enum) +
            ', got ' +
            JSON.stringify(data)
        ];
  }

  if (Array.isArray(schema.allOf)) {
    return schema.allOf.reduce(
      (acc, sub) => acc.concat(validateAgainstSchema(data, sub, path)),
      []
    );
  }

  if (Array.isArray(schema.oneOf) || Array.isArray(schema.anyOf)) {
    const variants = schema.oneOf || schema.anyOf;
    const matchesAny = variants.some(sub => validateAgainstSchema(data, sub, path).length === 0);
    return matchesAny ? [] : [path + ': does not match any allowed variant'];
  }

  if (!schema.type) return [];

  const expectedTypes = Array.isArray(schema.type) ? schema.type : [schema.type];
  const actualType = schemaTypeOf(data);
  const actualTypeAliases =
    actualType === 'number' && Number.isInteger(data) ? ['number', 'integer'] : [actualType];

  if (!expectedTypes.some(t => actualTypeAliases.includes(t))) {
    return [path + ': expected type ' + expectedTypes.join(' | ') + ', got ' + actualType];
  }

  let issues = [];

  if (expectedTypes.includes('object') && actualType === 'object') {
    (schema.required || []).forEach(key => {
      if (!(key in data)) {
        issues.push(path + '.' + key + ': missing required field');
      }
    });
    if (schema.properties) {
      Object.keys(schema.properties).forEach(key => {
        if (key in data) {
          issues = issues.concat(
            validateAgainstSchema(data[key], schema.properties[key], path + '.' + key)
          );
        }
      });
    }
  }

  if (expectedTypes.includes('array') && actualType === 'array' && schema.items) {
    data.forEach((item, index) => {
      issues = issues.concat(validateAgainstSchema(item, schema.items, path + '[' + index + ']'));
    });
  }

  return issues;
}

async function testEndpoint(routeId, path, type) {
  const responseContainer = document.getElementById('response-' + routeId);
  const testBtn = document.getElementById('test-btn-' + routeId);
  const inputField = document.getElementById('input-' + routeId);

  // Get headers
  const headers = getHeaders(routeId);
  headers['Content-Type'] = 'application/json';

  // Get input data
  let inputData = null;
  if (inputField) {
    try {
      const inputText = inputField.value.trim();
      if (inputText) {
        inputData = JSON.parse(inputText);
      }
    } catch (e) {
      responseContainer.innerHTML = `
        <div class="response-status error">
          <span class="iconify" data-icon="mdi:alert-circle" style="width: 16px; height: 16px;"></span>
          Invalid JSON Syntax
        </div>
        <div class="response-block">
          <pre>${escapeHtml(e.message)}

💡 Tip: Make sure to use proper JSON format with double quotes around both keys and string values.</pre>
        </div>
      `;
      responseContainer.style.display = 'block';
      return;
    }
  }

  // Show loading state
  testBtn.disabled = true;
  testBtn.innerHTML = `
    <span class="loading-spinner"></span>
    Sending...
  `;
  responseContainer.style.display = 'none';

  try {
    const baseUrl = localStorage.getItem('trpc-base-url');

    if (!baseUrl) {
      openConfigModal();
      testBtn.disabled = false;
      testBtn.innerHTML = `
        <span class="iconify" data-icon="mdi:send" style="width: 18px; height: 18px;"></span>
        Send Request
      `;
      return;
    }

    // Use GET for queries, POST for mutations
    const method = type === 'query' ? 'GET' : 'POST';
    let url = `${baseUrl}/${path}`;

    // For GET requests, append input as query parameter
    const fetchOptions = {
      method: method,
      headers: headers
    };

    // Wrap input data if using superjson transformer
    let serializedInput = inputData;
    if (window.TRPC_TRANSFORMER === 'superjson' && inputData !== null && inputData !== undefined) {
      serializedInput = { json: inputData };
    }

    if (method === 'GET' && inputData) {
      const params = new URLSearchParams({ input: JSON.stringify(serializedInput) });
      url = `${url}?${params}`;
    } else if (method === 'POST') {
      fetchOptions.body = JSON.stringify(serializedInput);
    }

    const response = await fetch(url, fetchOptions);

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      // Unwrap superjson response if configured
      if (
        window.TRPC_TRANSFORMER === 'superjson' &&
        data &&
        typeof data === 'object' &&
        'result' in data &&
        data.result &&
        'data' in data.result &&
        data.result.data &&
        'json' in data.result.data
      ) {
        data = data.result.data.json;
      }
    } else {
      const text = await response.text();
      data = { message: text || 'No response body' };
    }

    const isSuccess = response.ok;

    // Validate the response against the route's documented output schema (success only)
    let schemaValidationHtml = '';
    const outputSchemaJson = responseContainer.dataset.outputSchema;
    if (isSuccess && outputSchemaJson) {
      try {
        const outputSchema = JSON.parse(outputSchemaJson);
        const issues = validateAgainstSchema(data, outputSchema).slice(0, 20);
        schemaValidationHtml =
          issues.length > 0
            ? `
          <div class="schema-validation invalid">
            <span class="iconify" data-icon="mdi:alert-circle-outline" style="width: 14px; height: 14px;"></span>
            ${issues.length} schema mismatch${issues.length > 1 ? 'es' : ''} found
            <ul class="schema-validation-issues">${issues.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>
          </div>
        `
            : `
          <div class="schema-validation valid">
            <span class="iconify" data-icon="mdi:check-circle-outline" style="width: 14px; height: 14px;"></span>
            Response matches the documented output schema
          </div>
        `;
      } catch (e) {
        // Ignore malformed/unparseable schema; skip validation feedback
      }
    }

    // Record this request/response pair in the per-route history
    saveRequestHistory(routeId, {
      timestamp: Date.now(),
      input: inputData,
      status: response.status,
      statusText: response.statusText,
      ok: isSuccess
    });

    // Build debug info
    const debugInfo = `Request Details:
URL: ${url}
Method: ${method}
Headers: ${JSON.stringify(headers, null, 2)}
Body: ${method === 'POST' ? JSON.stringify(inputData, null, 2) : 'N/A (sent as query param)'}

---
`;

    responseContainer.innerHTML = `
      <div class="response-status ${isSuccess ? 'success' : 'error'}">
        <span class="iconify" data-icon="mdi:${isSuccess ? 'check-circle' : 'alert-circle'}" style="width: 16px; height: 16px;"></span>
        ${isSuccess ? 'Success' : 'Error'} (${response.status} ${response.statusText})
      </div>
      ${schemaValidationHtml}
      <div class="response-block">
        <pre>${!isSuccess ? debugInfo : ''}${escapeHtml(JSON.stringify(data, null, 2))}</pre>
      </div>
    `;
    responseContainer.style.display = 'block';
  } catch (error) {
    saveRequestHistory(routeId, {
      timestamp: Date.now(),
      input: inputData,
      status: null,
      statusText: 'Request Failed',
      ok: false
    });

    responseContainer.innerHTML = `
      <div class="response-status error">
        <span class="iconify" data-icon="mdi:alert-circle" style="width: 16px; height: 16px;"></span>
        Request Failed
      </div>
      <div class="response-block">
        <pre>${escapeHtml(error.message)}</pre>
      </div>
    `;
    responseContainer.style.display = 'block';
  } finally {
    // Reset button
    testBtn.disabled = false;
    testBtn.innerHTML = `
      <span class="iconify" data-icon="mdi:send" style="width: 18px; height: 18px;"></span>
      Send Request
    `;
  }
}

// Make functions global
window.addHeader = addHeader;
window.removeHeader = removeHeader;
window.saveHeaders = saveHeaders;
window.loadHeaders = loadHeaders;
window.testEndpoint = testEndpoint;
window.toggleHistoryDropdown = toggleHistoryDropdown;
window.replayHistoryEntry = replayHistoryEntry;
window.clearRequestHistory = clearRequestHistory;
window.escapeHtml = function (str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

// Make config modal functions global
window.openConfigModal = openConfigModal;
window.closeConfigModal = closeConfigModal;
window.saveBaseUrl = saveBaseUrl;

// Add optional field to JSON input
window.addOptionalField = function (routeId, fieldName, fieldExample, badgeElement) {
  const inputField = document.getElementById('input-' + routeId);
  if (!inputField) return;

  try {
    const currentValue = inputField.value.trim();
    if (!currentValue) {
      // If empty, create new object with just this field
      inputField.value = `{\n  "${fieldName}": ${fieldExample}\n}`;
      // Hide the badge
      if (badgeElement) {
        badgeElement.style.display = 'none';
      }
      return;
    }

    // Parse current JSON
    const jsonObj = JSON.parse(currentValue);

    // Add the field if it doesn't exist
    if (!(fieldName in jsonObj)) {
      jsonObj[fieldName] = JSON.parse(fieldExample);

      // Stringify back with formatting
      inputField.value = JSON.stringify(jsonObj, null, 2);

      // Hide the badge
      if (badgeElement) {
        badgeElement.style.display = 'none';
      }
    }
  } catch (e) {
    console.error('Error adding optional field:', e);
    alert('Could not add field. Please ensure the JSON is valid.');
  }
};

// Search and filter functionality
function performSearch() {
  const searchInput = document.getElementById('searchInput');
  const typeFilter = document.getElementById('typeFilter');
  const authFilter = document.getElementById('authFilter');
  const tagFilter = document.getElementById('tagFilter');
  const resultsCount = document.getElementById('resultsCount');

  if (!searchInput || !typeFilter || !authFilter || !tagFilter || !resultsCount) {
    return;
  }

  const searchTerm = searchInput.value.toLowerCase().trim();
  const selectedType = typeFilter.value;
  const selectedAuth = authFilter.value;
  const selectedTag = tagFilter.value;

  // Save filters to localStorage
  localStorage.setItem(
    'trpc-docs-filters',
    JSON.stringify({
      search: searchTerm,
      type: selectedType,
      auth: selectedAuth,
      tag: selectedTag
    })
  );

  // Update filter badge and clear button
  updateFilterBadge();

  let visibleCount = 0;
  const totalCount = document.querySelectorAll('.route-card').length;

  // Filter route cards
  document.querySelectorAll('.route-card').forEach(card => {
    const cardType = card.getAttribute('data-type');
    const cardAuth = card.getAttribute('data-auth') === 'true';
    const cardTags = card.getAttribute('data-tags') || '';
    const cardSearch = card.getAttribute('data-search') || '';

    // Apply filters
    const matchesSearch = !searchTerm || cardSearch.includes(searchTerm);
    const matchesType = selectedType === 'all' || cardType === selectedType;
    const matchesAuth =
      selectedAuth === 'all' ||
      (selectedAuth === 'public' && !cardAuth) ||
      (selectedAuth === 'protected' && cardAuth);
    const matchesTag = selectedTag === 'all' || cardTags.split(',').includes(selectedTag);

    const isVisible = matchesSearch && matchesType && matchesAuth && matchesTag;

    // Show/hide card
    card.style.display = isVisible ? 'block' : 'none';

    // Update sidebar link visibility
    const cardId = card.id;
    const sidebarLink = document.querySelector(`.sidebar-link[href="#${cardId}"]`);
    if (sidebarLink) {
      sidebarLink.style.display = isVisible ? 'block' : 'none';
    }

    if (isVisible) visibleCount++;
  });

  // Hide empty route groups
  document.querySelectorAll('.route-group').forEach(group => {
    const visibleCards = Array.from(group.querySelectorAll('.route-card')).filter(
      card => card.style.display !== 'none'
    );
    group.style.display = visibleCards.length > 0 ? 'block' : 'none';
  });

  // Hide empty sidebar groups
  document.querySelectorAll('.sidebar-group').forEach(group => {
    const visibleLinks = Array.from(group.querySelectorAll('.sidebar-link')).filter(
      link => link.style.display !== 'none'
    );
    group.style.display = visibleLinks.length > 0 ? 'block' : 'none';
  });

  // Update results counter
  resultsCount.textContent = `Showing ${visibleCount} of ${totalCount} endpoints`;
}

// Update filter badge visibility
function updateFilterBadge() {
  const searchInput = document.getElementById('searchInput');
  const typeFilter = document.getElementById('typeFilter');
  const authFilter = document.getElementById('authFilter');
  const tagFilter = document.getElementById('tagFilter');
  const clearBtn = document.getElementById('clearFiltersBtn');

  if (!searchInput || !typeFilter || !authFilter || !tagFilter || !clearBtn) {
    return;
  }

  // Check each filter's active state
  const searchActive = searchInput.value.trim() !== '';
  const typeActive = typeFilter.value !== 'all';
  const authActive = authFilter.value !== 'all';
  const tagActive = tagFilter.value !== 'all';

  const hasActiveFilters = searchActive || typeActive || authActive || tagActive;

  // Update button state
  clearBtn.disabled = !hasActiveFilters;

  // Add/remove active class to clear button
  if (hasActiveFilters) {
    clearBtn.classList.add('active');
  } else {
    clearBtn.classList.remove('active');
  }

  // Highlight active filters
  if (searchActive) {
    searchInput.classList.add('filter-active');
  } else {
    searchInput.classList.remove('filter-active');
  }

  if (typeActive) {
    typeFilter.classList.add('filter-active');
  } else {
    typeFilter.classList.remove('filter-active');
  }

  if (authActive) {
    authFilter.classList.add('filter-active');
  } else {
    authFilter.classList.remove('filter-active');
  }

  if (tagActive) {
    tagFilter.classList.add('filter-active');
  } else {
    tagFilter.classList.remove('filter-active');
  }
}

// Clear all filters
function clearFilters() {
  const searchInput = document.getElementById('searchInput');
  const typeFilter = document.getElementById('typeFilter');
  const authFilter = document.getElementById('authFilter');
  const tagFilter = document.getElementById('tagFilter');

  if (searchInput) searchInput.value = '';
  if (typeFilter) typeFilter.value = 'all';
  if (authFilter) authFilter.value = 'all';
  if (tagFilter) tagFilter.value = 'all';

  performSearch();
}

// Load saved filters from localStorage
function loadSavedFilters() {
  const saved = localStorage.getItem('trpc-docs-filters');
  if (!saved) return;

  try {
    const filters = JSON.parse(saved);
    const searchInput = document.getElementById('searchInput');
    const typeFilter = document.getElementById('typeFilter');
    const authFilter = document.getElementById('authFilter');
    const tagFilter = document.getElementById('tagFilter');

    if (searchInput && filters.search) searchInput.value = filters.search;
    if (typeFilter && filters.type) typeFilter.value = filters.type;
    if (authFilter && filters.auth) authFilter.value = filters.auth;
    if (tagFilter && filters.tag) tagFilter.value = filters.tag;

    // Apply filters after loading
    performSearch();
  } catch (e) {
    console.error('Error loading saved filters:', e);
  }
}

// Debounce function for search input
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Attach event listeners for search and filters
const debouncedSearch = debounce(performSearch, 300);

document.getElementById('searchInput')?.addEventListener('input', debouncedSearch);
document.getElementById('typeFilter')?.addEventListener('change', performSearch);
document.getElementById('authFilter')?.addEventListener('change', performSearch);
document.getElementById('tagFilter')?.addEventListener('change', performSearch);

// Load saved filters on page load
loadSavedFilters();

// Make clearFilters globally accessible
window.clearFilters = clearFilters;

// ── Copy schema button ─────────────────────────────────────────
// ── Scroll to top button visibility ──────────────────────────
(function () {
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;
  window.addEventListener(
    'scroll',
    () => {
      btn.classList.toggle('visible', window.scrollY > 300);
    },
    { passive: true }
  );
})();

// ── Copy schema button ─────────────────────────────────────────
window.copySchema = function (btn) {
  const pre = btn.closest('.schema-block').querySelector('pre');
  if (!pre) return;
  navigator.clipboard.writeText(pre.textContent || '').then(
    () => {
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = 'Copy';
        btn.classList.remove('copied');
      }, 2000);
    },
    () => {
      btn.textContent = 'Failed';
      setTimeout(() => {
        btn.textContent = 'Copy';
      }, 2000);
    }
  );
};
