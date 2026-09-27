import {createAuthService} from './auth-service.js';
import {createD1SessionStore} from './session-store.js';

const STATIC_PATH = /^(?:\/trainer(?:\/(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]*)?|\/src\/(?:trainer|drive)(?:\/[A-Za-z0-9_.-]+)+)$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      try {
        const service = createAuthService({
          store: createD1SessionStore(env.SESSIONS),
          config: {origin: env.APP_ORIGIN, clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET, encryptionKey: env.SESSION_ENCRYPTION_KEY},
        });
        return await service.fetch(request);
      } catch {
        return new Response(JSON.stringify({error: 'temporarily_unavailable'}), {
          status: 503, headers: {'Content-Type': 'application/json', 'Cache-Control': 'no-store'},
        });
      }
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response(null, {status: 405});
    if (!STATIC_PATH.test(url.pathname) || !env.ASSETS?.fetch) return new Response(null, {status: 404});
    // ASSETS is the separately prepared, public-only directory; the route gate also
    // prevents accidentally serving repository reports, server code or secrets.
    return env.ASSETS.fetch(request);
  },
};
