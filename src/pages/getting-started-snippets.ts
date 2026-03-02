
export interface SnippetParams {
  frameworkCategory: 'frontend' | 'backend';
  activeFramework: { id: string; pkg: string; name: string };
  activeExample: string;
  framework: string;
}

export const getCodeSnippets = ({
  frameworkCategory,
  activeFramework,
  activeExample,
}: SnippetParams) => {
  const installCmd = frameworkCategory === 'frontend'
    ? `npm install ${activeFramework.pkg}`
    : (activeFramework.id === 'rust' ? 'cargo add wacht' : `npm install ${activeFramework.pkg}`);

  let setup = '';
  let usage: string | { filename: string, language: string, code: string }[] = '';

  // Frontend Examples
  if (frameworkCategory === 'frontend') {
    if (activeFramework.id === 'nextjs') {
      setup = `// app/layout.tsx
import { DeploymentProvider } from "@wacht/nextjs";
import "@wacht/nextjs/styles.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <DeploymentProvider publicKey={process.env.NEXT_PUBLIC_WACHT_PUBLISHABLE_KEY}>
          {children}
        </DeploymentProvider>
      </body>
    </html>
  );
}`;
    } else {
      setup = `// main.tsx
import { DeploymentProvider } from "${activeFramework.pkg}";
import "${activeFramework.pkg}/styles.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <DeploymentProvider publicKey={import.meta.env.VITE_WACHT_PUBLISHABLE_KEY}>
    <App />
  </DeploymentProvider>
);`;
    }

    if (activeExample === 'notifications') {
      usage = `// components/navbar.tsx
import { 
  NotificationBell, 
  SignedIn, 
  UserButton 
} from "${activeFramework.pkg}";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between p-4 border-b">
      <div className="font-bold">MyApp</div>
      <div className="flex items-center gap-4">
        <SignedIn>
          <NotificationBell />
          <UserButton />
        </SignedIn>
      </div>
    </nav>
  );
}`;
    } else if (activeExample === 'tenancy') {
      usage = `// components/header.tsx
import { 
  OrganizationSwitcher, 
  useOrganization,
  useUser 
} from "${activeFramework.pkg}";

export default function Header() {
  const { user } = useUser();
  const { organization } = useOrganization();

  return (
    <header className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-4">
        {/* Helper component to switch between organizations */}
        <OrganizationSwitcher />
        
        {organization && (
          <span className="text-sm text-muted-foreground">
            {organization.name}
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {user?.first_name} {user?.last_name}
        </span>
      </div>
    </header>
  );
}`;
    } else if (activeExample === 'webhooks') {
      usage = [
        {
          filename: 'server.ts',
          language: 'typescript',
          code: `import { sessions } from "@wacht/backend";

// Create a secure endpoint that generates a ticket for the current user/tenant
export async function POST() {
  const { ticket } = await sessions.createSessionTicket({
    ticket_type: 'webhook_app_access',
    webhook_app_slug: 'my-app'
  });
  return Response.json({ ticket });
}`
        },
        {
          filename: 'App.tsx (Hooks)',
          language: 'typescript',
          code: `import { useState } from "react";
import { 
  WebhookAppProvider, 
  useWebhookAppSession,
  useWebhookEndpoints,
  useWebhookDeliveries
} from "${activeFramework.pkg}";

function WebhookDashboard() {
  const [ticket, setTicket] = useState<string | null>(null);
  
  // Authenticate the session using the ticket
  const { sessionLoading } = useWebhookAppSession(ticket);
  
  // Fetch endpoints and deliveries securely
  const { endpoints } = useWebhookEndpoints();
  const { deliveries } = useWebhookDeliveries();

  const fetchTicket = async () => {
    const res = await fetch("/api/tickets/webhooks", { method: "POST" });
    const data = await res.json();
    setTicket(data.ticket);
  };

  if (!ticket) {
    return <button onClick={fetchTicket}>Open Webhooks</button>;
  }

  if (sessionLoading) return <div>Loading...</div>;

  return (
    <div className="flex gap-8 p-6">
      <div className="w-1/2">
        <h3>Your Endpoints</h3>
        <ul>
          {endpoints?.map(ep => (
            <li key={ep.id}>{ep.url}</li>
          ))}
        </ul>
      </div>
      <div className="w-1/2">
        <h3>Recent Deliveries</h3>
        <ul>
          {deliveries?.map(d => (
            <li key={d.id}>
              {d.successful ? "✅" : "❌"} {d.event_type}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <WebhookAppProvider appSlug="my-app">
      <WebhookDashboard />
    </WebhookAppProvider>
  );
}`
        },
        {
          filename: 'App.tsx (Iframe)',
          language: 'typescript',
          code: `import { useEffect, useState } from "react";
import { useDeployment } from "${activeFramework.pkg}";

export default function WebhookDashboard() {
  const { deployment } = useDeployment();
  const [ticket, setTicket] = useState<string | null>(null);

  useEffect(() => {
    // Call your backend endpoint to secure a session ticket
    fetch("/api/tickets/webhooks", { method: "POST" })
      .then(res => res.json())
      .then(data => setTicket(data.ticket));
  }, []);

  if (!ticket || !deployment) {
    return <div className="p-8">Loading webhook dashboard...</div>;
  }

  // Wacht hosts the full vanity UI directly on your dedicated backend host
  const vanityUrl = \`\${deployment.backend_host}/vanity/webhook?ticket=\${ticket}\`;

  return (
    <div className="h-[800px] w-full border rounded-xl overflow-hidden shadow-sm">
      <iframe
        src={vanityUrl}
        className="w-full h-full border-0"
        title="Webhook App UI"
      />
    </div>
  );
}`
        }
      ];
    } else if (activeExample === 'api-keys') {
      usage = [
        {
          filename: 'server.ts',
          language: 'typescript',
          code: `import { sessions } from "@wacht/backend";

// Create a secure endpoint that generates a ticket for the current user/tenant
export async function POST() {
  const { ticket } = await sessions.createSessionTicket({
    ticket_type: 'api_auth_access',
    api_auth_app_slug: 'my-api'
  });
  return Response.json({ ticket });
}`
        },
        {
          filename: 'App.tsx (Hooks)',
          language: 'typescript',
          code: `import { useState } from "react";
import { 
  ApiAuthProvider, 
  useApiAuthAppSession,
  useApiAuthTokens 
} from "${activeFramework.pkg}";

function ApiKeysManager() {
  const [ticket, setTicket] = useState<string | null>(null);
  
  // Authenticate the session using the ticket
  const { sessionLoading } = useApiAuthAppSession(ticket);
  
  // Manage API keys securely
  const { tokens, createToken, isCreating } = useApiAuthTokens();

  const fetchTicket = async () => {
    const res = await fetch("/api/tickets/api-keys", { method: "POST" });
    const data = await res.json();
    setTicket(data.ticket);
  };

  const handleCreate = async () => {
    const req = await createToken({ name: "New API Key" });
    if (req.secret) {
      alert("New Key Generated: " + req.secret);
    }
  };

  if (!ticket) {
    return <button onClick={fetchTicket}>Manage API Keys</button>;
  }

  if (sessionLoading) return <div>Loading...</div>;

  return (
    <div className="flex gap-8 p-6">
      <div className="w-1/2">
        <div className="flex justify-between items-center mb-4">
          <h3>Your Keys</h3>
          <button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? "Creating..." : "Create New"}
          </button>
        </div>
        <ul>
          {tokens?.map(t => (
            <li key={t.id} className="flex justify-between">
              <span>{t.name}</span>
              <span className="text-gray-500 font-mono">{t.key_prefix}...</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="w-1/2">
        <h3>Analytics Overview</h3>
        <p className="text-sm text-gray-500">
          Request volume and latency metrics will appear here once your keys are active.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ApiAuthProvider appSlug="my-api">
      <ApiKeysManager />
    </ApiAuthProvider>
  );
}`
        },
        {
          filename: 'App.tsx (Iframe)',
          language: 'typescript',
          code: `import { useEffect, useState } from "react";
import { useDeployment } from "${activeFramework.pkg}";

export default function ApiKeysPage() {
  const { deployment } = useDeployment();
  const [ticket, setTicket] = useState<string | null>(null);

  useEffect(() => {
    // Call your backend endpoint to secure a session ticket
    fetch("/api/tickets/api-keys", { method: "POST" })
      .then(res => res.json())
      .then(data => setTicket(data.ticket));
  }, []);

  if (!ticket || !deployment) {
    return <div className="p-8" > Loading API Keys manager...</div>;
  }

  // Wacht hosts the full vanity UI directly on your dedicated backend host
  const vanityUrl = \`\${deployment.backend_host}/vanity/api-auth?ticket=\${ticket}\`;

  return (
    <div className="h-[800px] w-full border rounded-xl overflow-hidden shadow-sm">
      <iframe
        src={vanityUrl}
        className="w-full h-full border-0"
        title="API Keys Manager"
      />
    </div>
  );
}`
        }
      ];
    } else {
      // Auth Example
      usage = `// App.tsx
import { 
  DeploymentInitialized, 
  DeploymentInitializing, 
  SignedIn, 
  SignedOut, 
  NavigateToSignIn,
  UserButton
} from "${activeFramework.pkg}";

export default function App() {
  return (
    <>
      <DeploymentInitializing>
        <div className="flex h-screen items-center justify-center">
          Loading...
        </div>
      </DeploymentInitializing>

      <DeploymentInitialized>
        <SignedIn>
          <div className="p-4">
            <header className="flex justify-between items-center mb-8">
              <h1>My App</h1>
              <UserButton />
            </header>
            <Dashboard />
          </div>
        </SignedIn>

        <SignedOut>
          <NavigateToSignIn />
        </SignedOut>
      </DeploymentInitialized>
    </>
  );
}`;
    }
  }

  // Backend Examples
  else {
    if (activeFramework.id === 'rust') {
      setup = `// main.rs
use wacht::WachtClient;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize the Wacht client using environment variables
    // Requires WACHT_API_KEY and WACHT_PUBLISHABLE_KEY
    let client = WachtClient::from_env().await?;
    
    // Pass this client to your app state or dependency injection
    Ok(())
}`;
    } else {
      setup = `// src/index.ts
import { initClient } from "@wacht/backend";

// Initialize the global Wacht client
// Make sure process.env.WACHT_API_KEY is set
initClient({
  apiKey: process.env.WACHT_API_KEY!
});`;
    }

    // Verify Token (Default for backend)
    usage = activeFramework.id === 'rust'
      ? `// middleware.rs
use axum::{routing::get, Router, Json};
use wacht::middleware::{AuthLayer, RequireAuth};
use serde_json::json;

// This handler requires a valid Wacht Bearer token
async fn get_protected_data(auth: RequireAuth) -> Json<serde_json::Value> {
    Json(json!({
        "message": "Access granted",
        "user_id": auth.user_id,
        "session_id": auth.session_id
    }))
}

// Attach the AuthLayer to your router
pub fn app_router() -> Router {
    Router::new()
        .route("/protected", get(get_protected_data))
        .layer(AuthLayer::new())
}`
      : `// middleware.ts
import { getAuth } from "@wacht/backend";
import type { Request, Response, NextFunction } from "express";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // getAuth automatically extracts the Bearer token and verifies it
    const { userId } = await getAuth(req);
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    // Attach the verified user ID to the request for handlers
    req.user = userId;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
}`;
  }

  return { installCmd, setup, usage };
};
