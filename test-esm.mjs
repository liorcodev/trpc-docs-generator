/**
 * ESM Smoke Test - Verifies Node.js native ESM compatibility
 * This should run without ERR_MODULE_NOT_FOUND errors
 */

console.log('Testing ESM imports...');

try {
  // Test direct imports work without crashes
  const { collectRoutes, generateDocsHtml } = await import('./dist/index.js');

  console.log('✅ Successfully imported collectRoutes:', typeof collectRoutes);
  console.log('✅ Successfully imported generateDocsHtml:', typeof generateDocsHtml);

  // Verify they are the expected types
  if (typeof collectRoutes !== 'function') {
    throw new Error('collectRoutes should be a function');
  }
  if (typeof generateDocsHtml !== 'function') {
    throw new Error('generateDocsHtml should be a function');
  }

  console.log('\n✅ ESM compatibility test PASSED');
  console.log('All imports resolved correctly with .js extensions');
  process.exit(0);
} catch (error) {
  console.error('\n❌ ESM compatibility test FAILED');
  console.error('Error:', error.message);
  console.error('\nStack:', error.stack);
  process.exit(1);
}
