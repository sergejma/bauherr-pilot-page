// Cloudflare Pages Function — Smoke-Test für Phase 1
// Erreichbar unter https://<projekt>.pages.dev/api/test
// Beweist nur, dass die Function-Infrastruktur live ist. Wird in Phase 3
// durch echte HubSpot-Endpoints ersetzt.

export async function onRequestGet(context) {
  const body = {
    ok: true,
    phase: 1,
    message: 'Cloudflare Pages Functions sind live.',
    deployedAt: new Date().toISOString(),
    cf: {
      colo: context.request.cf?.colo || null,
      country: context.request.cf?.country || null,
    },
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
