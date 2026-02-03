
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
  let usage = '';

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
    setup = activeFramework.id === 'rust'
      ? `let client = wacht::Client::new(dotenv!("WACHT_SECRET_KEY"));`
      : `const wacht = new Wacht(process.env.WACHT_SECRET_KEY);`;

    if (activeExample === 'webhooks') {
      usage = activeFramework.id === 'rust'
        ? `#[post("/webhook")]
async fn handle_webhook(req: Request, client: Data<Client>) -> Response {
    let event = client.webhooks.construct_event(payload, sig, secret)?;
    match event.type_ {
        "user.created" => { /* ... */ }
        _ => { /* ... */ }
    }
}`
        : `app.post('/webhook', (req, res) => {
  const event = wacht.webhooks.constructEvent(req.body, sig, secret);
  switch (event.type) {
    case 'user.created':
      // ...
      break;
  }
});`;
    } else if (activeExample === 'management') {
      usage = activeFramework.id === 'rust'
        ? `// Create a new user organization
let org = client.organizations().create(CreateOrganization {
    name: "Acme Corp",
    slug: "acme",
}).await?;

// Add a user to the organization
client.organizations().add_member(&org.id, "user_123", "admin").await?;`
        : `// Create a new user organization
const org = await wacht.organizations.create({
  name: 'Acme Corp',
  slug: 'acme',
});

// Add a user to the organization
await wacht.organizations.addMember(org.id, 'user_123', 'admin');`;
    } else {
      // Verify Token (Default)
      usage = activeFramework.id === 'rust'
        ? `// middleware.rs
let token = req.headers().get("Authorization")?;
let session = client.verify_token(token).await?;

println!("Authenticated user: {}", session.user_id);`
        : `// middleware.ts
const token = req.headers.authorization?.split(' ')[1];
const session = await wacht.verifyToken(token);

console.log(\`Authenticated user: \${session.userId}\`);`;
    }
  }

  return { installCmd, setup, usage };
};
