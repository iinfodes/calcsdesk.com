import type { APIRoute } from 'astro';
import { renderSitemap } from '../lib/page-policy.mjs';

export const prerender = true;
export const GET: APIRoute = () => new Response(renderSitemap(), {
  headers: { 'Content-Type': 'application/xml; charset=utf-8' },
});
