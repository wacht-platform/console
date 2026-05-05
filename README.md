<h1 align="center">
  <a href="https://wacht.dev" style="text-decoration:none;">Wacht Console</a>
</h1>

<p align="center">
  <strong>The operator UI for running identity, access, and agents on Wacht.</strong>
</p>

<p align="center">
  <a href="https://github.com/wacht-platform/console/blob/main/LICENSE.md">
    <img alt="License" src="https://img.shields.io/badge/license-AGPL--3.0-blue?style=flat-square" />
  </a>
  <img alt="Status" src="https://img.shields.io/badge/status-public%20beta-blue?style=flat-square" />
  <img alt="React" src="https://img.shields.io/badge/frontend-react-61dafb?style=flat-square" />
  <img alt="Vite" src="https://img.shields.io/badge/build-vite-646cff?style=flat-square" />
</p>

<p align="center">
  <a href="https://wacht.dev">Website</a> ·
  <a href="https://wacht.dev/docs">Docs</a> ·
  <a href="https://github.com/wacht-platform/console/issues">Issues</a>
</p>

---

## Overview

Wacht Console is the operator experience for [Wacht](https://wacht.dev). It is the single
surface where product, platform, and security teams configure deployments, manage tenants and
access policies, and operate the identity, integration, and agent runtimes that
[`platform-api`](https://github.com/wacht-platform/platform-api) exposes.

The console is a React + Vite single-page app. It is consumed by Wacht operators — not by an
application's end-users — and talks to the platform API's control plane.

## What You Operate Here

- **Authentication.** Auth factors, social/OIDC providers, sign-in policies, MFA requirements.
- **B2B access model.** Organizations, workspaces, roles, and the permission catalog.
- **API authorization.** API auth clients, keys, grants, and gateway controls.
- **Integrations.** Webhook apps, endpoints, delivery state, and external service connectors.
- **Agents.** Agent definitions, tool catalog, scheduled tasks, approvals, and run history.
- **Deployments.** Deployment-level settings, custom domains, branding, and policy bundles.
- **Operations.** Usage, billing visibility, audit trails, and operational health.

## Typical Workflow

1. Create a project and a deployment.
2. Configure authentication factors and identity providers.
3. Define organization/workspace roles and the permission catalog.
4. Register API auth clients and enforce gateway policy.
5. Author agents, tools, and schedules.
6. Monitor usage, webhooks, and operational health.

## Architecture

Console sits on top of the rest of the Wacht stack:

- **`console`** (this repository) — operator UI.
- **`platform-api`** — control plane and runtime backend.
- **`frontend-api`** — public API serving deployment end-users.
- **`react-sdk`** — client libraries that embed the Frontend API into web apps.

## Repository Layout

```
src/pages/        Route-level product surfaces
src/components/   Domain UI building blocks
src/lib/api/      API hooks and clients
public/           Static assets
```

## Quickstart

```bash
pnpm install
pnpm dev
```

The dev server runs at `http://localhost:5173`.

Build and preview:

```bash
pnpm build
pnpm preview
```

Lint:

```bash
pnpm lint
```

## Status

Wacht Console is in **public beta**. The UI and underlying control-plane APIs are stabilizing;
breaking changes are documented in the changelog.

## Contributing

We're not accepting pull requests yet — the contribution process isn't set up. Forks,
self-hosting, and any other use the AGPL-3.0 allows are welcome. Self-hosting documentation
is still in progress.

## Support

- Product and integration docs: [wacht.dev/docs](https://wacht.dev/docs).
- Direct assistance: [engineering@intellinesia.com](mailto:engineering@intellinesia.com).

## License

Licensed under the GNU Affero General Public License v3.0 (AGPL-3.0-only).
See [LICENSE.md](./LICENSE.md) for the full text.
