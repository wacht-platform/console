import { Heading, Subheading } from "@/components/ui/heading";
import { Strong, Text } from "@/components/ui/text";
import { ClipboardIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { Tooltip } from "@/components/ui/tooltip";
import { Divider } from "@/components/ui/divider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

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
      alert('Please upload a valid image file (.jpeg, .png, .gif, or .webp)');
      return;
    }

    if (type === 'favicon' && !allowedFaviconTypes.includes(file.type)) {
      alert('Please upload a valid favicon file (.ico)');
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
      <Heading>Application Settings</Heading>
      <div className="mt-8 space-y-10">
        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          <div className="space-y-1">
            <div className="w-24 h-24 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
              <img src="./placeholder.png" alt="Application Logo" className="w-16 h-16 object-contain" />
            </div>
          </div>
          <div className="space-y-1">
            <Subheading>
              <Strong>Created Date</Strong>
            </Subheading>
            <Text>The date this application was created.</Text>
            <Text className="mt-2 font-medium">{createdDate}</Text>
          </div>
        </section>

        <Divider className="my-8" soft />

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          <div className="space-y-1">
            <Subheading>
              <Strong>Application ID</Strong>
            </Subheading>
            <Text>Unique identifier for your application.</Text>
            <div className="relative flex items-center gap-3 mt-2">
              <Input type="text" value={applicationId} readOnly size={25} />
              <Tooltip message="Copied!" trigger={copiedAppId}>
                <Button
                  onClick={() => handleCopy(applicationId, setCopiedAppId)}
                  className="p-2"
                  outline
                >
                  <ClipboardIcon className="w-5 h-5" />
                </Button>
              </Tooltip>
            </div>
          </div>
          <div className="space-y-1">
            <Subheading>
              <Strong>Instance ID</Strong>
            </Subheading>
            <Text>Unique identifier for your application instance.</Text>
            <div className="relative flex items-center gap-3 mt-2">
              <Input type="text" value={instanceId} readOnly size={25} />
              <Tooltip message="Copied!" trigger={copiedInstanceId}>
                <Button
                  onClick={() => handleCopy(instanceId, setCopiedInstanceId)}
                  className="p-2"
                  outline
                >
                  <ClipboardIcon className="w-5 h-5" />
                </Button>
              </Tooltip>
            </div>
          </div>
        </section>

        <Divider className="my-8" soft />

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          <div className="space-y-1">
            <Subheading>
              <Strong>Application Name</Strong>
            </Subheading>
            <Text>Customize the name of your application.</Text>
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
            <Subheading>
              <Strong>Support Email</Strong>
            </Subheading>
            <Text>The email displayed on Wacht components for your application support channels.</Text>
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

        <Divider className="my-8" soft />

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          <div className="space-y-1">
            <Subheading>
              <Strong>Logo</Strong>
            </Subheading>
            <Text>Upload .jpeg, .png, .gif, or .webp files.</Text>
            <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload('logo', file); }} id="logo-upload" />
            <div className="flex items-center gap-4">
              <Button className="mt-2" outline onClick={() => document.getElementById('logo-upload')?.click()}>
                Upload Logo
              </Button>
              {logoPreview && (
                <div className="mt-2 w-12 h-12 rounded-full overflow-hidden border border-gray-200">
                  <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <Subheading>
              <Strong>Favicon</Strong>
            </Subheading>
            <Text>Upload image/x-icon or image/vnd.microsoft.icon files.</Text>
            <input type="file" accept="image/x-icon,image/vnd.microsoft.icon" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload('favicon', file); }} id="favicon-upload" />
            <div className="flex items-center gap-4">
              <Button className="mt-2" outline onClick={() => document.getElementById('favicon-upload')?.click()}>
                Upload Favicon
              </Button>
              {faviconPreview && (
                <div className="mt-2 w-8 h-8 overflow-hidden border border-gray-200">
                  <img src={faviconPreview} alt="Favicon Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
        </section>

        <Divider className="my-8" soft />

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          <div className="space-y-1">
            <Subheading>
              <Strong>Test Mode</Strong>
            </Subheading>
            <Text>Sign in and sign up with test credentials.</Text>
            <Switch
              checked={testMode}
              onChange={setTestMode}
              className="mt-2"
            />
          </div>
          {testMode && (
            <div className="space-y-4">
              <div className="space-y-1">
                <Subheading>
                  <Strong>Test Email :</Strong>
                  <code className="px-1 ml-2 bg-gray-50 rounded">your_email+wacht_test@example.com</code>
                </Subheading>
                <Text>Any email with the +wacht_test subaddress is a test email address.</Text>
              </div>
              <div className="space-y-1">
                <Subheading>
                  <Strong>Test Verification Code :</Strong>
                  <code className="px-1 ml-2 bg-gray-50 rounded">442424</code>
                </Subheading>
                <Text>No verification emails or SMS will be sent from test emails or test phone numbers. They can be verified with this code.</Text>
              </div>
              <div className="space-y-1">
                <Subheading>
                  <Strong>Test Phone Number</Strong>
                  <code className="px-1 ml-2 bg-gray-50 rounded">+12345678901</code>
                </Subheading>
                <Text>The last three digits of this test phone number can end with a number between 100-199.</Text>
              </div>
            </div>
          )}
        </section>

        <Divider className="my-8" soft />

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          <div className="space-y-1">
            <Subheading>
              <Strong>Transfer Ownership</Strong>
            </Subheading>
            <Text>Transfer ownership of this application to another user.</Text>
            <Button className="mt-2" outline>
              Transfer Ownership
            </Button>
          </div>
          <div className="space-y-1">
            <Subheading>
              <Strong>Delete Application</Strong>
            </Subheading>
            <Text>Permanently delete this application and all associated data.</Text>
            <Button className="mt-2" color="red">
              Delete Application
            </Button>
          </div>
        </section>

        <Divider className="my-8" soft />

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          <div className="space-y-1">
            <Subheading>
              <Strong>User Exports</Strong>
            </Subheading>
            <Text>Export and download your users.</Text>
            <Button className="mt-2" outline>
              Export All Users
            </Button>
          </div>
        </section>

        <Divider className="my-10" soft />

        <div className="flex justify-end gap-4">
          <Button type="reset" plain>Reset</Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </div>
    </div>
  );
}