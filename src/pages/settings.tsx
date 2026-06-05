import { ClipboardIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner";

export default function ApplicationSettingsPage() {
  const [copiedAppId, setCopiedAppId] = useState(false);
  const [copiedInstanceId, setCopiedInstanceId] = useState(false);
  const [applicationName, setApplicationName] = useState("My Application");
  const [supportEmail, setSupportEmail] = useState("support@example.com");
  const [testMode, setTestMode] = useState(true);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>();
  const [faviconPreview, setFaviconPreview] = useState<string>();
  const handleFileUpload = (type: 'logo' | 'favicon', file: File) => {
    if (!file) return;

    const allowedLogoTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedFaviconTypes = ['image/x-icon', 'image/vnd.microsoft.icon'];

    if (type === 'logo' && !allowedLogoTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (.jpeg, .png, .gif, or .webp)');
      return;
    }

    if (type === 'favicon' && !allowedFaviconTypes.includes(file.type)) {
      toast.error('Please upload a valid favicon file (.ico)');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'logo') {
        setLogoFile(file);
        setLogoPreview(reader.result as string);
      } else {
        setFaviconFile(file);
        setFaviconPreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };
  const applicationId = "app_1234567890abcdef"; // Harcoded value for demonstration purposes
  const instanceId = "inst_1234567890abcdef"; // Harcoded value for demonstration purposes
  const createdDate = "January 1, 2023"; // Harcoded date for demonstration purposes

  const handleCopy = (text: string, setCopied: (value: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  console.log(logoFile);
  console.log(faviconFile);

  return (
    <div>
      <h1 className="text-xl font-medium tracking-tight text-foreground">Application Settings</h1>
      <div className="mt-8 space-y-10">
        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          <div className="space-y-1">
            <div className="w-24 h-24 rounded-full bg-secondary border border-border overflow-hidden flex items-center justify-center">
              <img src="./placeholder.png" alt="Application Logo" className="w-16 h-16 object-contain" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-foreground">
              <span className="font-medium text-foreground">Created Date</span>
            </h3>
            <p className="text-sm text-muted-foreground">The date this application was created.</p>
            <p className="text-sm text-muted-foreground mt-2 font-medium">{createdDate}</p>
          </div>
        </section>

        <div className="my-8 border-t border-border" />

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-foreground">
              <span className="font-medium text-foreground">Application ID</span>
            </h3>
            <p className="text-sm text-muted-foreground">Unique identifier for your application.</p>
            <div className="relative flex items-center gap-3 mt-2">
              <Input type="text" value={applicationId} readOnly size={25} />
              <Tooltip open={copiedAppId}>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => handleCopy(applicationId, setCopiedAppId)}
                    className="p-2"
                    variant="outline"
                  >
                    <ClipboardIcon className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copied!</TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-foreground">
              <span className="font-medium text-foreground">Instance ID</span>
            </h3>
            <p className="text-sm text-muted-foreground">Unique identifier for your application instance.</p>
            <div className="relative flex items-center gap-3 mt-2">
              <Input type="text" value={instanceId} readOnly size={25} />
              <Tooltip open={copiedInstanceId}>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => handleCopy(instanceId, setCopiedInstanceId)}
                    className="p-2"
                    variant="outline"
                  >
                    <ClipboardIcon className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copied!</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </section>

        <div className="my-8 border-t border-border" />

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-foreground">
              <span className="font-medium text-foreground">Application Name</span>
            </h3>
            <p className="text-sm text-muted-foreground">Customize the name of your application.</p>
            <Input
              type="text"
              value={applicationName}
              onChange={(e) => setApplicationName(e.target.value)}
              placeholder="Application Name"
              className="mt-2"
              size={25}
            />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-foreground">
              <span className="font-medium text-foreground">Support Email</span>
            </h3>
            <p className="text-sm text-muted-foreground">The email displayed on Wacht components for your application support channels.</p>
            <Input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              placeholder="Support Email"
              className="mt-2"
              size={25}
            />
          </div>
        </section>

        <div className="my-8 border-t border-border" />

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-foreground">
              <span className="font-medium text-foreground">Logo</span>
            </h3>
            <p className="text-sm text-muted-foreground">Upload .jpeg, .png, .gif, or .webp files.</p>
            <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload('logo', file); }} id="logo-upload" />
            <div className="flex items-center gap-4">
              <Button className="mt-2" variant="outline" onClick={() => document.getElementById('logo-upload')?.click()}>
                Upload Logo
              </Button>
              {logoPreview && (
                <div className="mt-2 w-12 h-12 rounded-full overflow-hidden border border-border">
                  <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-foreground">
              <span className="font-medium text-foreground">Favicon</span>
            </h3>
            <p className="text-sm text-muted-foreground">Upload image/x-icon or image/vnd.microsoft.icon files.</p>
            <input type="file" accept="image/x-icon,image/vnd.microsoft.icon" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload('favicon', file); }} id="favicon-upload" />
            <div className="flex items-center gap-4">
              <Button className="mt-2" variant="outline" onClick={() => document.getElementById('favicon-upload')?.click()}>
                Upload Favicon
              </Button>
              {faviconPreview && (
                <div className="mt-2 w-8 h-8 overflow-hidden border border-border">
                  <img src={faviconPreview} alt="Favicon Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="my-8 border-t border-border" />

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-foreground">
              <span className="font-medium text-foreground">Test Mode</span>
            </h3>
            <p className="text-sm text-muted-foreground">Sign in and sign up with test credentials.</p>
            <Switch
              checked={testMode}
              onCheckedChange={setTestMode}
              className="mt-2"
            />
          </div>
          {testMode && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-foreground">
                  <span className="font-medium text-foreground">Test Email :</span>
                  <code className="px-1 ml-2 bg-secondary rounded">your_email+wacht_test@example.com</code>
                </h3>
                <p className="text-sm text-muted-foreground">Any email with the +wacht_test subaddress is a test email address.</p>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-foreground">
                  <span className="font-medium text-foreground">Test Verification Code :</span>
                  <code className="px-1 ml-2 bg-secondary rounded">442424</code>
                </h3>
                <p className="text-sm text-muted-foreground">No verification emails or SMS will be sent from test emails or test phone numbers. They can be verified with this code.</p>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-foreground">
                  <span className="font-medium text-foreground">Test Phone Number</span>
                  <code className="px-1 ml-2 bg-secondary rounded">+12345678901</code>
                </h3>
                <p className="text-sm text-muted-foreground">The last three digits of this test phone number can end with a number between 100-199.</p>
              </div>
            </div>
          )}
        </section>

        <div className="my-8 border-t border-border" />

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-foreground">
              <span className="font-medium text-foreground">Transfer Ownership</span>
            </h3>
            <p className="text-sm text-muted-foreground">Transfer ownership of this application to another user.</p>
            <Button className="mt-2" variant="outline">
              Transfer Ownership
            </Button>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-foreground">
              <span className="font-medium text-foreground">Delete Application</span>
            </h3>
            <p className="text-sm text-muted-foreground">Permanently delete this application and all associated data.</p>
            <Button className="mt-2" color="red">
              Delete Application
            </Button>
          </div>
        </section>

        <div className="my-8 border-t border-border" />

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-foreground">
              <span className="font-medium text-foreground">User Exports</span>
            </h3>
            <p className="text-sm text-muted-foreground">Export and download your users.</p>
            <Button className="mt-2" variant="outline">
              Export All Users
            </Button>
          </div>
        </section>

        <div className="my-10 border-t border-border" />

        <div className="flex justify-end gap-4">
          <Button type="reset" variant="ghost">Reset</Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </div>
    </div>
  );
}