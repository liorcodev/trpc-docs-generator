/**
 * Metadata for a tRPC route/procedure used for documentation
 * Use with initTRPC.meta<RouteMeta>().create()
 */
export type RouteMeta = {
  /** Human-readable name for the route */
  name?: string;
  /** Description of what the route does */
  description?: string;
  /** Tags for grouping routes */
  tags?: string[];
  /** Whether this route is deprecated */
  deprecated?: boolean;
  /** Whether this route requires authentication */
  auth?: boolean;
  /** Roles allowed to access this route */
  roles?: string[];
};

/**
 * Options for generating HTML documentation
 */
export type DocsGeneratorOptions = {
  /** Title to display in the documentation page */
  title?: string;
};
