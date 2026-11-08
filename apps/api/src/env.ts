// Imported first by main.ts so env vars exist before any module is evaluated.
// In development this loads the repo-root .env; in production the host injects them.
try {
  process.loadEnvFile(new URL('../../../.env', import.meta.url));
} catch {
  // No .env file: rely on the real environment.
}
