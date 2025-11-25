import { useState } from "react";
import { Heading } from "@/components/ui/heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox, CheckboxField } from "@/components/ui/checkbox";
import { Field, Label } from "@/components/ui/fieldset";
import {
  Dialog,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogActions,
} from "@/components/ui/dialog";
import {
  ChevronRightIcon,
  EnvelopeIcon,
  InboxIcon,
  DocumentTextIcon,
  ServerIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router";
import { useProjects } from "@/lib/api/hooks/use-projects";
import {
  useUpdateSmtpConfig,
  useVerifySmtpConnection,
  useRemoveSmtpConfig,
} from "@/lib/api/hooks/use-smtp-config";
import { toast } from "sonner";
import type { SmtpConfigRequest } from "@/types/deployment";

interface EmailTemplateCardProps {
  title: string;
  description: string;
  route?: string;
  onClick?: () => void;
}

export function EmailTemplateCard({
  title,
  description,
  route,
  onClick,
}: EmailTemplateCardProps) {
  const content = (
    <div className="group relative bg-white dark:bg-neutral-900 px-6 py-4 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all duration-200 border-b border-gray-200 dark:border-neutral-700 last:border-0">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-normal text-gray-900 dark:text-neutral-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {title}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
            {description}
          </p>
        </div>
        <ChevronRightIcon className="w-5 h-5 text-gray-400 dark:text-neutral-500 group-hover:text-gray-600 dark:group-hover:text-neutral-300 transition-colors" />
      </div>
    </div>
  );

  if (route) {
    return (
      <Link to={route} className="block hover:no-underline">
        {content}
      </Link>
    );
  }

  return (
    <div onClick={onClick} className={onClick ? "cursor-pointer" : ""}>
      {content}
    </div>
  );
}

const emailTemplateCategories = [
  {
    category: "Invitations",
    icon: InboxIcon,
    templates: [
      {
        id: 0,
        title: "Organization Invitation",
        description:
          "Invite users to join an organization within your application",
        route: "organization-invite-template",
      },
      {
        id: 1,
        title: "Workspace Invitation",
        description:
          "Send an invitation email to new users to join your application",
        route: "workspace-invite-template",
      },
      {
        id: 11,
        title: "User Invitation",
        description: "Generic invitation for users to join your application",
        route: "workspace-invite-template",
      },
    ],
  },
  {
    category: "Authentication",
    icon: DocumentTextIcon,
    templates: [
      {
        id: 2,
        title: "Verification Code",
        description:
          "Send a verification code for authentication or account confirmation",
        route: "verification-code-template",
      },
      {
        id: 3,
        title: "Reset Password Code",
        description: "Send a reset password code to users",
        route: "reset-password-code-template",
      },
      {
        id: 8,
        title: "Magic Link",
        description: "Send a magic link for passwordless authentication",
        route: "magic-link-template",
      },
      {
        id: 7,
        title: "New Device Sign In",
        description: "Alert users when someone signs in from a new device",
        route: "sign-in-from-new-device-template",
      },
    ],
  },
  {
    category: "Account Updates",
    icon: EnvelopeIcon,
    templates: [
      {
        id: 4,
        title: "Email Address Changed",
        description:
          "Notify users when their primary email address has been updated",
        route: "primary-email-change-template",
      },
      {
        id: 5,
        title: "Password Changed",
        description: "Confirm that a password has been successfully changed",
        route: "password-change-template",
      },
      {
        id: 6,
        title: "Password Removed",
        description: "Inform users that their password has been removed",
        route: "password-remove-template",
      },
    ],
  },
  {
    category: "Waitlist",
    icon: InboxIcon,
    templates: [
      {
        id: 9,
        title: "Waitlist Signup",
        description: "Confirm users have been added to the waitlist",
        route: "waitlist-signup-template",
      },
      {
        id: 10,
        title: "Waitlist Invitation",
        description: "Invite waitlisted users to join your application",
        route: "waitlist-invite-template",
      },
    ],
  },
];

function SmtpConfigDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { selectedDeployment } = useProjects();
  const existingConfig = selectedDeployment?.custom_smtp_config;

  const [host, setHost] = useState(existingConfig?.host || "");
  const [port, setPort] = useState(existingConfig?.port?.toString() || "587");
  const [username, setUsername] = useState(existingConfig?.username || "");
  const [password, setPassword] = useState("");
  const [fromEmail, setFromEmail] = useState(existingConfig?.from_email || "");
  const [useTls, setUseTls] = useState(existingConfig?.use_tls ?? true);

  const { mutate: updateSmtpConfig, isPending: isSubmitting } = useUpdateSmtpConfig();
  const { mutate: verifySmtpConnection, isPending: isVerifying } = useVerifySmtpConnection();
  const { mutate: removeSmtpConfig, isPending: isRemoving } = useRemoveSmtpConfig();

  const getConfig = (): SmtpConfigRequest => ({
    host,
    port: parseInt(port, 10),
    username,
    password,
    from_email: fromEmail,
    use_tls: useTls,
  });

  const isFormValid = host && port && username && password && fromEmail;

  const handleSubmit = () => {
    if (selectedDeployment?.id) {
      updateSmtpConfig(
        { deploymentId: selectedDeployment.id, config: getConfig() },
        {
          onSuccess: () => {
            toast.success("SMTP configuration saved successfully");
            onClose();
          },
          onError: (error) => {
            toast.error(`Failed to save SMTP configuration: ${error.message}`);
          },
        }
      );
    }
  };

  const handleVerify = () => {
    if (selectedDeployment?.id) {
      verifySmtpConnection(
        { deploymentId: selectedDeployment.id, config: getConfig() },
        {
          onSuccess: () => {
            toast.success("SMTP connection test successful");
          },
          onError: (error) => {
            toast.error(`SMTP connection failed: ${error.message}`);
          },
        }
      );
    }
  };

  const handleRemove = () => {
    if (selectedDeployment?.id) {
      removeSmtpConfig(selectedDeployment.id, {
        onSuccess: () => {
          toast.success("SMTP configuration removed, reverted to Postmark");
          onClose();
        },
        onError: (error) => {
          toast.error(`Failed to remove SMTP configuration: ${error.message}`);
        },
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} size="2xl">
      <DialogTitle>Configure Custom SMTP</DialogTitle>
      <DialogDescription>
        Enter your SMTP server credentials to send emails through your own mail server.
      </DialogDescription>
      <DialogBody>
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field>
              <Label>SMTP Host</Label>
              <Input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="smtp.example.com"
              />
            </Field>
            <Field>
              <Label>Port</Label>
              <Input
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="587"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field>
              <Label>Username</Label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your-username"
              />
            </Field>
            <Field>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={existingConfig ? "Leave empty to keep existing" : "Enter password"}
              />
            </Field>
          </div>

          <Field>
            <Label>From Email</Label>
            <Input
              type="email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="noreply@example.com"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
              Emails will be sent from this address
            </p>
          </Field>

          <div className="pt-2 border-t border-gray-200 dark:border-neutral-700">
            <CheckboxField>
              <Checkbox
                checked={useTls}
                onChange={(checked) => setUseTls(checked)}
              />
              <Label>Use STARTTLS</Label>
            </CheckboxField>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-7">
              Uncheck for implicit TLS/SSL (port 465). Keep checked for STARTTLS (port 587).
            </p>
          </div>
        </div>
      </DialogBody>
      <DialogActions>
        <div className="flex justify-between w-full">
          <div>
            {existingConfig && (
              <Button
                onClick={handleRemove}
                disabled={isRemoving}
                color="red"
              >
                {isRemoving ? "Removing..." : "Remove & Use Postmark"}
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button outline onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleVerify}
              disabled={!isFormValid || isVerifying}
              outline
            >
              {isVerifying ? "Testing..." : "Test Connection"}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? "Saving..." : existingConfig ? "Update" : "Save"}
            </Button>
          </div>
        </div>
      </DialogActions>
    </Dialog>
  );
}

function EmailProviderCard() {
  const { selectedDeployment } = useProjects();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const isSmtp = selectedDeployment?.email_provider === "custom_smtp";
  const smtpConfig = selectedDeployment?.custom_smtp_config;

  const providerLabel = isSmtp ? "Custom SMTP" : "Postmark";
  const statusInfo = isSmtp && smtpConfig
    ? smtpConfig.verified
      ? `Verified - ${smtpConfig.from_email}`
      : `Not verified - ${smtpConfig.from_email}`
    : "Default email provider";

  return (
    <>
      <div className="mb-6">
        <h2 className="text-sm font-normal text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-3">
          Email Provider
        </h2>
        <div className="bg-white dark:bg-neutral-900 shadow-sm ring-1 ring-gray-900/5 dark:ring-neutral-100/10 rounded-lg overflow-hidden">
          <div
            onClick={() => setIsDialogOpen(true)}
            className="group relative bg-white dark:bg-neutral-900 px-6 py-4 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {isSmtp ? (
                  <ServerIcon className="h-5 w-5 text-gray-400 dark:text-neutral-500" />
                ) : (
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 dark:text-neutral-500" />
                )}
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-normal text-gray-900 dark:text-neutral-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {providerLabel}
                    </h3>
                    {isSmtp && smtpConfig?.verified && (
                      <Badge color="green">Verified</Badge>
                    )}
                    {isSmtp && smtpConfig && !smtpConfig.verified && (
                      <Badge color="yellow">Not Verified</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
                    {statusInfo}
                  </p>
                </div>
              </div>
              <ChevronRightIcon className="w-5 h-5 text-gray-400 dark:text-neutral-500 group-hover:text-gray-600 dark:group-hover:text-neutral-300 transition-colors" />
            </div>
          </div>
        </div>
      </div>
      <SmtpConfigDialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
    </>
  );
}

export default function EmailsPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <Heading className="text-2xl font-normal text-gray-900 dark:text-neutral-100">
          Email Templates
        </Heading>
        <p className="mt-1 text-sm text-gray-600 dark:text-neutral-400">
          Customize email templates for different communication scenarios
        </p>
      </div>

      <EmailProviderCard />

      <div className="space-y-6">
        {emailTemplateCategories.map((category) => (
          <div key={category.category}>
            <h2 className="text-sm font-normal text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-3">
              {category.category}
            </h2>
            <div className="bg-white dark:bg-neutral-900 shadow-sm ring-1 ring-gray-900/5 dark:ring-neutral-100/10 rounded-lg overflow-hidden">
              {category.templates.map((template) => (
                <EmailTemplateCard
                  key={template.id}
                  title={template.title}
                  description={template.description}
                  route={template.route}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
