# Wacht Console Dashboard

The React frontend for managing Wacht applications. This is where you configure your deployments, manage users, set up organizations, and handle all the admin stuff for your customer-facing apps.

Wacht is a development toolkit that helps you build enterprise apps fast - authentication, user management, organizations, AI tools, and analytics are all included.

## What you can do

**User stuff**
- Manage users and their profiles
- Track signups and activity
- Handle user analytics

**Organizations & workspaces**
- Create and manage organizations
- Set up workspaces within orgs
- Custom roles and permissions
- Invite and manage members

**Authentication**
- Configure MFA
- Set up social logins
- Create JWT templates
- Web3 auth support

**AI tools**
- Build AI agents
- Visual workflow builder (drag & drop)
- Upload knowledge bases
- Configure API tools

**Analytics**
- Real-time dashboard stats
- User activity tracking
- Growth metrics

**Other stuff**
- Email templates and settings
- SMS configuration
- DNS verification

## Tech stack

- React 19 + TypeScript
- React Router v7
- Tailwind CSS v4
- Zustand for state
- TanStack Query for data
- Headless UI components
- React DnD for drag & drop
- Monaco Editor for code
- Framer Motion for animations
- Vite for building
- pnpm for packages

## Getting started

You need:
- Node.js 18+
- pnpm (or npm/yarn)
- The Wacht API running

## Setup

**1. Clone and install**

```bash
git clone <repository-url>
cd wacht-dashboard-frontend
pnpm install
```

**2. Environment**

Create `.env.local`:

```env
VITE_API_URL=http://localhost:3001
VITE_WACHT_PUBLIC_KEY=your_public_key_here
```

**3. Run it**

```bash
pnpm dev
```

Opens at `http://localhost:5173`

**4. Build for production**

```bash
pnpm build
pnpm preview  # to test the build
```

## Testing

```bash
# Run linting
pnpm lint

# Fix linting issues
pnpm lint --fix

# Type checking
pnpm type-check
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use existing UI components when possible
- Maintain consistent code formatting with ESLint
- Write meaningful commit messages
- Test your changes thoroughly

## License

Licensed under PolyForm Shield License 1.0.0 - see [LICENSE.md](LICENSE.md) for details.

Copyright © 2025 Intellinesia Labs (https://intellinesia.com/)

**TL;DR**: You can use, modify, and distribute this for any purpose except building competing products. Read the full license for details.

## Related Projects

- [Wacht Console API](../wacht-dashboard-api) - Backend console API for this dashboard

## Support

For support and questions, please open an issue in the GitHub repository.
