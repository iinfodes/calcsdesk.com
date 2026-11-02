export const SITE_ORIGIN: 'https://calcsdesk.com';
export const INDEXABLE_PATHS: readonly string[];
export function isIndexablePath(pathname: unknown): boolean;
export function robotsForPath(pathname: unknown): string;
export function indexableUrls(): string[];
export function renderSitemap(): string;
