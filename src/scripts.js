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
    card.classList.toggle('expanded');
  });
});

// Smooth scroll for sidebar links
document.querySelectorAll('.sidebar-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Close sidebar on mobile after clicking a link
      if (window.innerWidth <= 1200 && sidebar.classList.contains('active')) {
        toggleSidebar();
      }
    }
  });
});

// Configuration modal functions
function updateConfigButton() {
  const baseUrl = localStorage.getItem('trpc-base-url');
  const configButton = document.getElementById('configButton');
  const configButtonText = document.getElementById('configButtonText');

  if (baseUrl) {
    configButton.classList.add('configured');
    configButtonText.textContent = 'Change Base URL';
  } else {
    configButton.classList.remove('configured');
    configButtonText.textContent = 'Configure Base URL';
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

// Initialize config button state
updateConfigButton();

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

// Endpoint testing function
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

    if (method === 'GET' && inputData) {
      const params = new URLSearchParams({ input: JSON.stringify(inputData) });
      url = `${url}?${params}`;
    } else if (method === 'POST') {
      fetchOptions.body = JSON.stringify(inputData);
    }

    const response = await fetch(url, fetchOptions);

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text || 'No response body' };
    }

    const isSuccess = response.ok;

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
      <div class="response-block">
        <pre>${!isSuccess ? debugInfo : ''}${escapeHtml(JSON.stringify(data, null, 2))}</pre>
      </div>
    `;
    responseContainer.style.display = 'block';
  } catch (error) {
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
