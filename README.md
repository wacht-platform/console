<h1 align="center">
  <a href="https://wacht.dev" style="text-decoration:none;">Wacht Console</a>
</h1>

<p align="center">
  The control plane UI for operating identity, access, and API security in Wacht.
</p>

<p align="center">
  <a href="https://wacht.dev">Website</a> |
  <a href="https://docs.wacht.dev">Documentation</a> |
  <a href="https://github.com/wacht-platform/console/issues">Issues</a>
</p>

## What This Product Is

Wacht Console is where teams run identity for their products.

Instead of stitching together separate tools, Console gives one place to operate:

- authentication methods and sign-in behavior
- B2B access models (organizations, workspaces, roles, permissions)
- API auth clients, keys, grants, and gateway controls
- webhook apps, endpoints, and delivery operations
- deployment-level settings, policies, and usage visibility

## Who Uses It

- Product teams building auth into customer-facing apps
- Platform teams running multi-tenant environments
- Security and operations teams that need strong policy and audit controls

## Typical Platform Workflow

1. Create a project and deployment.
2. Configure auth factors and social/OIDC providers.
3. Define org/workspace roles and permission catalog.
4. Register API auth clients and enforce gateway policy.
5. Monitor usage, webhooks, and operational health.

## How Console Fits In Wacht

- `console` is the operator experience
- `platform-api` provides control-plane and runtime backend capabilities
- `frontend-api` powers end-user authentication flows in applications

## Contributor Notes (Minimal Repo Pointers)

- `src/pages/` route-level product surfaces
- `src/components/` domain UI building blocks
- `src/lib/api/` API hooks and clients

## Quickstart

```bash
pnpm install
pnpm dev
```

Local URL: `http://localhost:5173`

Build:

```bash
pnpm build
pnpm preview
```

Lint:

```bash
pnpm lint
```

## Support

- Report issues: [GitHub Issues](https://github.com/wacht-platform/console/issues)
- Product docs: [docs.wacht.dev](https://docs.wacht.dev)

## License

GNU Affero General Public License v3.0 (AGPL-3.0-only). See [LICENSE.md](./LICENSE.md).
