// Serves the standalone Private AI offer page at /private-ai/
import html from '../../private-ai.html?raw';

export function GET() {
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
