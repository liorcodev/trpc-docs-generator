import { RouteInfo } from './collect-routes';
import { DocsGeneratorOptions, RouteMeta } from './types';
import { getStyles, getScripts, getLogo } from './assets-inline';

/**
 * Generate beautiful HTML documentation from route information
 * @param routes - Array of route information
 * @param options - Generation options
 * @returns HTML string
 */
export function generateDocsHtml(routes: RouteInfo[], options: DocsGeneratorOptions = {}): string {
  const { title = 'API Documentation' } = options;
  const groupedRoutes = groupRoutesByPrefix(routes);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://code.iconify.design/3/3.1.0/iconify.min.js"></script>
  <style>${getStyles()}</style>
</head>
<body>
  <button class="config-button" id="configButton" onclick="openConfigModal()">
    <span class="iconify" data-icon="mdi:cog" style="width: 16px; height: 16px;"></span>
    <span id="configButtonText">Configure Base URL</span>
  </button>

  <div class="config-modal" id="configModal">
    <div class="config-modal-content">
      <div class="config-modal-header">
        <div class="config-modal-title">Configure tRPC Endpoint</div>
        <div class="config-modal-description">
          Set the base URL for your tRPC API endpoint. This is required to test endpoints in the playground.
          Include the full mount path (for example, add <code>/trpc</code> if your server is mounted at <code>/trpc</code>; otherwise use whatever path your server is configured to use).
        </div>
      </div>
      <div class="config-form-group">
        <label class="config-label" for="baseUrlInput">Base URL</label>
        <input 
          type="text" 
          id="baseUrlInput" 
          class="config-input" 
          placeholder="e.g., http://localhost:3000/trpc"
        />
        <div class="config-input-hint">
          Enter the full URL including protocol (http:// or https://). 
          Note: the host must match exactly (e.g. <code>localhost</code> vs <code>127.0.0.1</code>) mixing them can cause CORS/origin errors (Failed to fetch).
        </div>
      </div>
      <div class="config-modal-actions">
        <button class="btn-secondary" onclick="closeConfigModal()">Cancel</button>
        <button class="btn-primary" onclick="saveBaseUrl()">
          <span class="iconify" data-icon="mdi:content-save" style="width: 14px; height: 14px;"></span>
          Save
        </button>
      </div>
    </div>
  </div>

  <button class="mobile-menu-toggle" id="mobileMenuToggle" aria-label="Toggle navigation">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  </button>
  <div class="sidebar-overlay" id="sidebarOverlay"></div>
  <div class="container">
    <nav class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <img src="${getLogo()}" alt="Logo" class="sidebar-logo" />
      </div>
      <div class="sidebar-title"><span class="iconify" data-icon="mdi:book-open-page-variant" style="vertical-align: -0.125em; margin-right: 0.5rem;"></span>Navigation</div>
      ${Object.entries(groupedRoutes)
        .map(
          ([group, groupRoutes]) => `
        <div class="sidebar-group">
          <div class="sidebar-group-title">${formatGroupName(group)}</div>
          ${groupRoutes
            .map(
              route => `
            <a href="#${route.path.replace(/\./g, '-')}" class="sidebar-link">
              ${route.meta?.name ?? route.path.split('.').pop()}
            </a>
          `
            )
            .join('')}
        </div>
      `
        )
        .join('')}
    </nav>

    <main class="main-content">
      <header>
        <h1>${title}</h1>
        <p><span class="iconify" data-icon="mdi:sparkles" style="vertical-align: -0.125em;"></span> tRPC API Documentation <span class="iconify" data-icon="mdi:sparkles" style="vertical-align: -0.125em;"></span></p>
        <div class="stats">
          <div class="stat">
            <div class="stat-value">${routes.length}</div>
            <div class="stat-label">Total Endpoints</div>
          </div>
          <div class="stat">
            <div class="stat-value">${routes.filter(r => !(r.meta?.docs as RouteMeta['docs'])?.auth).length}</div>
            <div class="stat-label">Public Endpoints</div>
            <div class="stat-breakdown">
              <span>${routes.filter(r => !(r.meta?.docs as RouteMeta['docs'])?.auth && r.type === 'query').length} Queries</span>
              <span>•</span>
              <span>${routes.filter(r => !(r.meta?.docs as RouteMeta['docs'])?.auth && r.type === 'mutation').length} Mutations</span>
            </div>
          </div>
          <div class="stat">
            <div class="stat-value">${routes.filter(r => (r.meta?.docs as RouteMeta['docs'])?.auth).length}</div>
            <div class="stat-label">Protected Endpoints</div>
            <div class="stat-breakdown">
              <span>${routes.filter(r => (r.meta?.docs as RouteMeta['docs'])?.auth && r.type === 'query').length} Queries</span>
              <span>•</span>
              <span>${routes.filter(r => (r.meta?.docs as RouteMeta['docs'])?.auth && r.type === 'mutation').length} Mutations</span>
            </div>
          </div>
        </div>
      </header>

      ${Object.entries(groupedRoutes)
        .map(
          ([group, groupRoutes]) => `
        <section class="route-group" id="group-${group}">
          <h2 class="route-group-header">${formatGroupName(group)}</h2>
          ${groupRoutes.map(route => generateRouteCard(route)).join('')}
        </section>
      `
        )
        .join('')}
    </main>
  </div>

  <script>
    ${getScripts()}
  </script>
</body>
</html>`;
}

/**
 * Group routes by their path prefix for organized display
 * @param routes - Array of route information
 * @returns Object mapping group names to arrays of routes
 */
function groupRoutesByPrefix(routes: RouteInfo[]): Record<string, RouteInfo[]> {
  const grouped: Record<string, RouteInfo[]> = {};

  for (const route of routes) {
    const parts = route.path.split('.');
    const prefix = parts.length > 1 ? parts.slice(0, -1).join('.') : 'root';

    if (!grouped[prefix]) {
      grouped[prefix] = [];
    }
    grouped[prefix].push(route);
  }

  return grouped;
}

/**
 * Format a group name for display (capitalize, add separators)
 * @param group - Group name string
 * @returns Formatted group name
 */
function formatGroupName(group: string): string {
  if (group === 'root') return 'Root';
  return group
    .split('.')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' › ');
}

function generateRouteCard(route: RouteInfo): string {
  const docs = route.meta?.docs as RouteMeta['docs'];
  const routeId = route.path.replace(/\./g, '-');

  return `
    <div class="route-card" id="${routeId}">
      <div class="route-header">
        <span class="method-badge method-${route.type}">${route.type}</span>
        <div class="route-path-info">
          ${route.meta?.name ? `<span class="route-name">${route.meta.name}</span>` : ''}
          <span class="route-path">${route.path}</span>
        </div>
        <div class="route-tags">
          ${docs?.auth ? '<span class="tag tag-auth"><span class="iconify" data-icon="mdi:shield-lock" style="vertical-align: -0.125em; margin-right: 0.25rem;"></span>Auth</span>' : ''}
          ${docs?.deprecated ? '<span class="tag tag-deprecated"><span class="iconify" data-icon="mdi:alert" style="vertical-align: -0.125em; margin-right: 0.25rem;"></span>Deprecated</span>' : ''}
          ${(docs?.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        <svg class="route-chevron" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </div>
      <div class="route-body">
        <div class="route-body-inner">
          ${docs?.description ? `<p class="route-description">${docs.description}</p>` : ''}

          ${
            docs?.auth
              ? `
            <div class="auth-info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span>Authentication Required</span>
              ${
                (docs?.roles || []).length > 0
                  ? `
                <div class="roles-list">
                  ${(docs?.roles || []).map(role => `<span class="role-badge">${role}</span>`).join(' or ')}
                </div>
              `
                  : ''
              }
            </div>
          `
              : ''
          }

          ${
            route.inputTypeScript
              ? `
            <div class="route-section">
              <div class="route-section-title"><span class="iconify" data-icon="mdi:import" style="vertical-align: -0.125em; margin-right: 0.5rem;"></span>Input Schema</div>
              <div class="schema-block">
                <pre>${escapeHtml(route.inputTypeScript)}</pre>
              </div>
            </div>
          `
              : ''
          }

          ${
            route.outputTypeScript
              ? `
            <div class="route-section">
              <div class="route-section-title"><span class="iconify" data-icon="mdi:export" style="vertical-align: -0.125em; margin-right: 0.5rem;"></span>Output Schema</div>
              <div class="schema-block">
                <pre>${escapeHtml(route.outputTypeScript)}</pre>
              </div>
            </div>
          `
              : ''
          }

          <div class="test-panel">
            <div class="test-panel-header">
              <div class="test-panel-title">
                <span class="iconify" data-icon="mdi:test-tube"></span>
                Test Endpoint
              </div>
            </div>

            <div class="headers-manager">
              <label class="test-section-label">Request Headers</label>
              <div id="headers-${routeId}" class="headers-container">
                <div class="header-row">
                  <input type="text" class="header-input" placeholder="Header name" data-type="key">
                  <input type="text" class="header-input" placeholder="Header value" data-type="value">
                  <button class="btn-icon" onclick="removeHeader(this)" title="Remove header">
                    <span class="iconify" data-icon="mdi:close" style="width: 16px; height: 16px;"></span>
                  </button>
                </div>
              </div>
              <div style="display: flex; gap: 0.5rem; align-items: center; margin-top: 0.5rem;">
                <button class="btn-add" onclick="addHeader('${routeId}')">
                  <span class="iconify" data-icon="mdi:plus" style="width: 14px; height: 14px;"></span>
                  Add Header
                </button>
                <button class="save-headers-btn" onclick="saveHeaders('${routeId}')" id="save-btn-${routeId}">
                  <span class="iconify" data-icon="mdi:content-save" style="width: 14px; height: 14px;"></span>
                  Save Headers
                </button>
                <button class="btn-add" onclick="loadHeaders('${routeId}')">
                  <span class="iconify" data-icon="mdi:download" style="width: 14px; height: 14px;"></span>
                  Load Saved
                </button>
              </div>
            </div>

            ${
              route.inputExample
                ? `
            <div class="test-section">
              <label class="test-section-label" for="input-${routeId}">Request Body (JSON)</label>
              ${
                route.inputOptionalFields && route.inputOptionalFields.length > 0
                  ? `
              <div class="optional-fields">
                <span class="optional-fields-title">Optional fields (click to add):</span>
                <div>
                  ${route.inputOptionalFields
                    .map(
                      field =>
                        `<span class="optional-field-badge" onclick="addOptionalField('${routeId}', '${escapeHtml(field.name)}', ${escapeHtml(JSON.stringify(field.example))}, this)">
                      <span class="iconify" data-icon="mdi:plus-circle"></span>
                      ${escapeHtml(field.name)}
                    </span>`
                    )
                    .join('')}
                </div>
              </div>
              `
                  : ''
              }
              <textarea 
                id="input-${routeId}" 
                class="input-field" 
                placeholder="Enter request body as JSON...">${escapeHtml(route.inputExample)}</textarea>
              <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.375rem;">
                💡 Tip: Schema is pre-filled with required fields. Click badges above to add optional fields.
              </div>
            </div>
            `
                : ''
            }

            <button class="btn-primary" onclick="testEndpoint('${routeId}', '${route.path}', '${route.type}')" id="test-btn-${routeId}">
              <span class="iconify" data-icon="mdi:send" style="width: 18px; height: 18px;"></span>
              Send Request
            </button>

            <div id="response-${routeId}" class="response-container" style="display: none;"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Escape HTML special characters in a string
 * @param str - String to escape
 * @returns HTML-safe string
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
