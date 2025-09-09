Security posture (summary)

- Secrets: Do not commit real secrets. `.env` is now a clean template. Put real keys in `.env.local` or host env vars.
- Client exposure: Only variables prefixed with `NEXT_PUBLIC_` are available to the browser.
- Auth: JWT code paths exist but are disabled for now. When enabling, mint short‑lived tokens server‑side only.
- Errors: Deterministic, typed errors with user‑visible toasts; no silent fallbacks.
- Networking: Prefer WSS with TLS and origin pinning. Lock CORS to allowed origins when servers go live.
