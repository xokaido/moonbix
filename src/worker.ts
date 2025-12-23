export default {
    async fetch(request: Request, env: any, _ctx: any): Promise<Response> {
        const url = new URL(request.url);
        if (url.pathname.startsWith('/api')) {
            // Future server-side logic can go here
            return new Response('API not implemented yet', { status: 501 });
        }
        // Static assets are handled automatically by the Workers runtime via the 'assets' binding
        // but in a Worker with 'assets' config, we usually let the runtime handle it or use env.ASSETS.fetch
        // However, with `assets: { directory: ... }` in wrangler.jsonc, requests usually bypass this fetch for static files
        // if we don't catch them. But to be safe and explicit:

        return env.ASSETS.fetch(request);
    },
};
