/**
 * API Facade & Barrel Export
 * Retains 100% backward compatibility for existing callers.
 * Domain-specific endpoints are organized under ./api/
 */
export * from './api/index';
export { api, default } from './api/index';
