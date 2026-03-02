<h1 align="center">
  <a href="https://wacht.dev" style="text-decoration:none;">Wacht Console</a>
</h1>

<p align="center">Administrative control plane for configuring and operating Wacht deployments.</p>

<p align="center">
  <a href="https://wacht.dev">Website</a> |
  <a href="https://docs.wacht.dev">Documentation</a> |
  <a href="https://github.com/wacht-platform/console/issues">Issues</a>
</p>

## Overview

Wacht Console is the interface used by platform teams to manage authentication, B2B access, API auth, webhooks, agents, and billing for each deployment.

Core areas in this app:

- Project and deployment lifecycle
- Authentication factors and social sign-in configuration
- Organizations, workspaces, roles, and permission catalogs
- API auth apps, API keys, and gateway audit views
- Webhook apps, endpoints, deliveries, and replay tooling
- Agent configuration and operational controls
- Billing, plan usage, and subscription state

## Repository layout

- `src/pages/` - route-level screens
- `src/components/` - domain components (users, orgs, workspaces, api-keys, webhooks, agents)
- `src/lib/api/` - API client modules used by UI screens
- `src/lib/store/` - client state containers
- `src/hooks/` - feature hooks
- `src/contexts/` - app-level providers

## Local development

Install and start the development server:

```bash
pnpm install
pnpm dev
```

Default local URL: `http://localhost:5173`

Build and preview:

```bash
pnpm build
pnpm preview
```

Lint:

```bash
pnpm lint
```

## Environment

Create `.env` in this directory:

```bash
VITE_API_URL=http://localhost:3000
```

Use your deployed API host in non-local environments.

## Support

- Report issues: [GitHub Issues](https://github.com/wacht-platform/console/issues)
- Product docs: [docs.wacht.dev](https://docs.wacht.dev)

## License

GNU Affero General Public License v3.0 (AGPL-3.0-only). See [LICENSE.md](./LICENSE.md).
