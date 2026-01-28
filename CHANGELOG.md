# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.1] - 2026-01-28

### Fixed

- **z.record() schema display** - Fixed issue where `z.record(z.string(), z.string())` and other
  record schemas were incorrectly displayed as `{}` in both TypeScript types and JSON examples
  - Now properly generates `Record<string, string>` TypeScript notation
  - Generates sample JSON examples like `{ "key": "string" }`
  - Supports all record value types (primitives, objects, arrays, etc.)
  - Root cause: Zod's `toJSONSchema()` converts records using `additionalProperties` instead of
    `properties`, which wasn't being handled

## [0.5.0] - 2026-01-22

### Added

#### 🧪 Interactive API Testing (Killer Feature)

- **Live endpoint testing** - Test APIs directly from documentation with real fetch requests
- **Smart request builder** with pre-filled JSON from schemas (required fields only)
- **Optional fields manager** - Click-to-add badges for optional parameters
- **Custom header management** - Add auth tokens, content-type, custom headers
- **Header persistence** - Save/load common headers (localStorage)
- **Auto-method detection** - GET for queries, POST for mutations
- **Real-time response display** - Formatted JSON with syntax highlighting
- **Status indicators** - Visual success/error badges
- **Debug information** - Full request details on errors (URL, headers, body)
- **Configurable endpoint URL** - Point to localhost, staging, or production

#### 📚 Documentation Generation

- Core functionality for automatic tRPC documentation generation
- `collectRoutes()` function for router traversal and route extraction
- `generateDocsHtml()` function for beautiful HTML documentation generation
- Automatic schema extraction from Zod validators via `toJSONSchema()` method
- Smart TypeScript type generation from JSON schemas
- JSON example generation with realistic data
- Optional field detection and documentation
- Support for complex Zod schemas:
  - Objects with nested properties
  - Arrays and tuples
  - Unions (oneOf/anyOf)
  - Intersections (allOf)
  - Enums and literals
  - Optional and required fields

### Features

#### Route Metadata Support

- Route names and descriptions
- Tag-based grouping
- Authentication requirement indicators
- Role-based access control badges
- Deprecation warnings

#### Modern UI Components

- Responsive design (mobile, tablet, desktop)
- Sidebar navigation with smooth scrolling
- Expandable route cards with detailed information
- Visual procedure type badges (query/mutation/subscription)
- Authentication and role badges
- Syntax-highlighted code blocks
- Smooth animations and transitions
- Professional glassmorphism effects
- Statistics overview with route counts

#### Developer Experience

- Full TypeScript support with type definitions
- Zero configuration required
- Works with any tRPC v11 router
- Deploy anywhere (Express, Next.js, Cloudflare Workers, etc.)
- Self-contained HTML output (no external dependencies)

#### 🔌 Fetch Logic & API Communication

- **Native Fetch API integration** - Direct HTTP requests to tRPC endpoints
- **Automatic method selection** - GET for queries, POST for mutations
- **Query parameter serialization** - Automatic input encoding for GET requests
- **Request body handling** - JSON serialization for POST requests
- **Response parsing** - Smart content-type detection and JSON parsing
- **Error handling** - Comprehensive error catching and user feedback
- **Base URL configuration** - Configurable endpoint with localStorage persistence
  - Modal-based configuration UI with validation
  - Full URL validation (requires protocol http:// or https://)
  - Helpful hints about including mount path (e.g., `/trpc`)
  - **CORS troubleshooting guidance** - Warns about host matching (localhost vs 127.0.0.1)
  - Persistent storage across sessions
  - Visual button state shows when configured
- **Header management** - Custom headers support with persistence
- **Loading states** - Visual feedback during request lifecycle
- **Debug information** - Full request details displayed on errors

### Requirements

- `@trpc/server` ^11.0.0
- Zod v4+ with `toJSONSchema()` support
- TypeScript 5.0+
- Node.js 18+

---

**Legend:**

- `Added` - New features
- `Changed` - Changes in existing functionality
- `Deprecated` - Soon-to-be removed features
- `Removed` - Removed features
- `Fixed` - Bug fixes
- `Security` - Vulnerability fixes

[Unreleased]: https://github.com/liorcohen/trpc-docs-generator/compare/v0.5.1...HEAD
[0.5.1]: https://github.com/liorcohen/trpc-docs-generator/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/liorcohen/trpc-docs-generator/releases/tag/v0.5.0
[0.1.0]: https://github.com/liorcohen/trpc-docs-generator/releases/tag/v0.1.0
