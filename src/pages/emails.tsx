import { useState } from "react";
import { Pill } from "@/components/ui/pill";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox"
import { CheckboxField } from "@/components/ui/app-checkbox";
import { Field, Label } from "@/components/ui/fieldset";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
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
    <div className="group flex items-center gap-3.5 border-b border-border px-5 py-4 transition-colors last:border-0 hover:bg-secondary">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <EnvelopeIcon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-muted-foreground" />
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
        title: "User Invitation",
        description: "Invite users to join your application",
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
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configure Custom SMTP</DialogTitle>
          <DialogDescription>
            Enter your SMTP server credentials to send emails through your own mail server.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
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
            <p className="text-xs text-muted-foreground mt-1.5">
              Emails will be sent from this address
            </p>
          </Field>

          <div className="pt-2 border-t border-border">
            <CheckboxField>
              <Checkbox
                checked={useTls}
                onCheckedChange={(checked: boolean) => setUseTls(checked)}
              />
              <Label>Use STARTTLS</Label>
            </CheckboxField>
            <p className="text-xs text-muted-foreground mt-1 ml-7">
              Uncheck for implicit TLS/SSL (port 465). Keep checked for STARTTLS (port 587).
            </p>
          </div>
        </div>
        <DialogFooter>
          <div className="flex justify-between w-full">
            <div>
              {existingConfig && (
                <Button
                  onClick={handleRemove}
                  disabled={isRemoving}
                  variant="destructive"
                >
                  {isRemoving ? "Removing..." : "Remove & Use Postmark"}
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleVerify}
                disabled={!isFormValid || isVerifying}
                variant="outline"
              >
                {isVerifying ? "Testing..." : "Test Connection"}
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting ? "Saving..." : existingConfig ? "Update" : "Save"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
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
      <div className="space-y-3">
        <SectionLabel>Email provider</SectionLabel>
        <div
          onClick={() => setIsDialogOpen(true)}
          className="group flex cursor-pointer items-center gap-3.5 rounded-lg border border-border bg-card px-5 py-4 transition-colors hover:bg-secondary"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            {isSmtp ? (
              <ServerIcon className="h-4 w-4" />
            ) : (
              <EnvelopeIcon className="h-4 w-4" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-foreground">
                {providerLabel}
              </h3>
              {isSmtp && smtpConfig?.verified && (
                <Pill tone="ok">verified</Pill>
              )}
              {isSmtp && smtpConfig && !smtpConfig.verified && (
                <Pill tone="warn">not verified</Pill>
              )}
            </div>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              {statusInfo}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsDialogOpen(true);
            }}
          >
            Edit provider
          </Button>
          <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-muted-foreground" />
        </div>
      </div>
      <SmtpConfigDialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
    </>
  );
}

export default function EmailsPage() {
  return (
    <div className="space-y-8">
      <EmailProviderCard />

      {emailTemplateCategories.map((category) => (
        <div key={category.category} className="space-y-3">
          <SectionLabel>{category.category}</SectionLabel>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
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
  );
}
