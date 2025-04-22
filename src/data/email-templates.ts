export interface Template {
    name: string;
    from: string;
    replyTo: string;
    subject: string;
    body: string;
}

export const emailTemplates: Record<string, Template> = {
    "workspace-invitation": {
        name: "Invitation",
        from: "invitations",
        replyTo: "",
        subject: "Invitation to join {{app.name}}",
        body: `
        <div style="padding: 48px 32px; background-color: #f9fafb;">
            <div style="text-align: center; margin-bottom: 32px; font-size: 32px; line-height: 1.4;">
                {{app_logo}}
            </div>
            <div style="background-color: #ffffff; border-radius: 0px; padding: 32px 32px 48px 32px; margin: 0; text-align: left; box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.1);">
                <h1 style="color: #000000; text-align: left; margin-top: 0; margin-bottom: 16px; font-weight: 500; font-size: 28px; line-height: 36px;">Your invitation</h1>
                <p style="text-align: left; font-size: 16px; color: #000000; font-weight: normal; line-height: 26px;">
                    {{#if inviter_name}}{{escapeURIs inviter_name}} has invited you to join them on {{app.name}}.{{else}}You are invited to join {{app.name}}.{{/if}}
                </p>
                <p style="margin-top: 16px; text-align: left; font-size: 16px; color: #000000; font-weight: normal; line-height: 26px;">
                    This invitation will expire in {{invitation.expires_in_days}} days.
                </p>
                <div style="text-align: center; margin: 32px 0 0 0;"><a href="{{action_url}}" style="display: inline-block; padding: 16px 32px; font-size: 16px; color: #ffffff; background-color: #6c47ff; border-radius: 8px; text-decoration: none; font-weight: 500; line-height: 1; box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);" class="cl-branded-button">Accept invitation</a></div>
                <p style="margin: 24px 0 0 0; text-align: center; font-size: 16px; color: #000000; font-weight: normal; line-height: 26px;">If you're having trouble with the above button, <a href="{{action_url}}" style="text-decoration: none; color: #6c47ff;" class="cl-branded-link">click here</a>.</p>
            </div>
        </div>`,
    },
    "organization-invitation": {
        name: "Organization Invitation",
        from: "invitations",
        replyTo: "",
        subject: "Invitation to join {{organization.name}} on {{app.name}}",
        body: `
        <div style="padding: 48px 32px; background-color: #f9fafb;">
            <div style="text-align: center; margin-bottom: 32px; font-size: 32px; line-height: 1.4;">
                {{app_logo}}
            </div>
            <div style="background-color: #ffffff; border-radius: 0px; padding: 32px 32px 48px 32px; margin: 0; text-align: left; box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.1);">
                <h1 style="color: #000000; text-align: left; margin-top: 0; margin-bottom: 16px; font-weight: 500; font-size: 28px; line-height: 36px;">Invitation to join {{organization.name}}</h1>
                <p style="text-align: left; font-size: 16px; color: #000000; font-weight: normal; line-height: 26px;">
                    {{#if inviter_name}}{{escapeURIs inviter_name}} has invited you to join {{organization.name}} on {{app.name}}.{{else}}You are invited to join {{organization.name}} on {{app.name}}.{{/if}}
                </p>
                 <p style="margin-top: 16px; text-align: left; font-size: 16px; color: #000000; font-weight: normal; line-height: 26px;">
                    This invitation will expire in {{invitation.expires_in_days}} days.
                </p>
                <div style="text-align: center; margin: 32px 0 0 0;"><a href="{{action_url}}" style="display: inline-block; padding: 16px 32px; font-size: 16px; color: #ffffff; background-color: #6c47ff; border-radius: 8px; text-decoration: none; font-weight: 500; line-height: 1; box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);" class="cl-branded-button">Accept invitation</a></div>
                <p style="margin: 24px 0 0 0; text-align: center; font-size: 16px; color: #000000; font-weight: normal; line-height: 26px;">If you're having trouble with the above button, <a href="{{action_url}}" style="text-decoration: none; color: #6c47ff;" class="cl-branded-link">click here</a>.</p>
            </div>
        </div>`,
    },
    "email-otp": {
        name: "Verification Code",
        from: "verification",
        replyTo: "",
        subject: "Your verification code for {{app.name}}",
        body: `
        <div style="padding: 48px 32px; background-color: #f9fafb;">
            <div style="text-align: center; margin-bottom: 32px; font-size: 32px; line-height: 1.4;">
                {{app_logo}}
            </div>
            <div style="background-color: #ffffff; border-radius: 0px; padding: 32px 32px 48px 32px; margin: 0; text-align: left; box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.1);">
                <h1 style="color: #000000; text-align: left; margin-top: 0; margin-bottom: 16px; font-weight: 500; font-size: 28px; line-height: 36px;">Verification Code</h1>
                <p style="text-align: left; font-size: 16px; color: #000000; font-weight: normal; line-height: 26px;">
                    Enter the following verification code when prompted:
                </p>
                <p style="margin-top: 16px; text-align: center; font-size: 24px; color: #000000; font-weight: bold; line-height: 32px;">
                    {{code}}
                </p>
                <p style="margin-top: 16px; text-align: left; font-size: 16px; color: #000000; font-weight: normal; line-height: 26px;">
                    This code will expire in {{code.expires_in_minutes}} minutes. If you didn't request this code, you can safely ignore this email.
                </p>
            </div>
        </div>`,
    },
    "password-reset": {
        name: "Reset Password Code",
        from: "security",
        replyTo: "",
        subject: "Reset your password for {{app.name}}",
        body: `
        <div style="padding: 48px 32px; background-color: #f9fafb;">
            <div style="text-align: center; margin-bottom: 32px; font-size: 32px; line-height: 1.4;">
                {{app_logo}}
            </div>
            <div style="background-color: #ffffff; border-radius: 0px; padding: 32px 32px 48px 32px; margin: 0; text-align: left; box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.1);">
                <h1 style="color: #000000; text-align: left; margin-top: 0; margin-bottom: 16px; font-weight: 500; font-size: 28px; line-height: 36px;">Reset Your Password</h1>
                <p style="text-align: left; font-size: 16px; color: #000000; font-weight: normal; line-height: 26px;">
                    Click the button below to reset your password.
                </p>
                 <p style="margin-top: 16px; text-align: left; font-size: 16px; color: #000000; font-weight: normal; line-height: 26px;">
                    If you didn't request a password reset, you can safely ignore this email. This link will expire in {{code.expires_in_minutes}} minutes.
                </p>
                <div style="text-align: center; margin: 32px 0 0 0;"><a href="{{action_url}}" style="display: inline-block; padding: 16px 32px; font-size: 16px; color: #ffffff; background-color: #6c47ff; border-radius: 8px; text-decoration: none; font-weight: 500; line-height: 1; box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);" class="cl-branded-button">Reset Password</a></div>
                <p style="margin: 24px 0 0 0; text-align: center; font-size: 16px; color: #000000; font-weight: normal; line-height: 26px;">If you're having trouble with the above button, <a href="{{action_url}}" style="text-decoration: none; color: #6c47ff;" class="cl-branded-link">click here</a>.</p>
            </div>
        </div>`,
    },
    "email-changed": {
        name: "Email Address Changed",
        from: "security",
        replyTo: "",
        subject: "Your primary email address was changed on {{app.name}}",
        body: `
        <div style="padding: 48px 32px; background-color: #f9fafb;">
            <div style="text-align: center; margin-bottom: 32px; font-size: 32px; line-height: 1.4;">
                {{app_logo}}
            </div>
            <div style="background-color: #ffffff; border-radius: 0px; padding: 32px 32px 48px 32px; margin: 0; text-align: left; box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.1);">
                <h1 style="color: #000000; text-align: left; margin-top: 0; margin-bottom: 16px; font-weight: 500; font-size: 28px; line-height: 36px;">Primary Email Address Updated</h1>
                <p style="text-align: left; font-size: 16px; color: #000000; font-weight: normal; line-height: 26px;">
                    This email confirms that the primary email address associated with your {{app.name}} account was recently changed.
                </p>
                 <p style="margin-top: 16px; text-align: left; font-size: 16px; color: #000000; font-weight: normal; line-height: 26px;">
                    If you did not make this change, please contact our support team immediately.
                </p>
            </div>
        </div>`,
    },
    "password-changed": {
        name: "Password Changed",
        from: "security",
        replyTo: "",
        subject: "Your password was changed on {{app.name}}",
        body: `
        <div style="padding: 48px 32px; background-color: #f9fafb;">
            <div style="text-align: center; margin-bottom: 32px; font-size: 32px; line-height: 1.4;">
                {{app_logo}}
            </div>
            <div style="background-color: #ffffff; border-radius: 0px; padding: 32px 32px 48px 32px; margin: 0; text-align: left; box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.1);">
                <h1 style="color: #000000; text-align: left; margin-top: 0; margin-bottom: 16px; font-weight: 500; font-size: 28px; line-height: 36px;">Password Successfully Changed</h1>
                <p style="text-align: left; font-size: 16px; color: #000000; font-weight: normal; line-height: 26px;">
                    This email confirms that the password for your {{app.name}} account was successfully changed.
                </p>
                 <p style="margin-top: 16px; text-align: left; font-size: 16px; color: #000000; font-weight: normal; line-height: 26px;">
                    If you did not make this change, please reset your password immediately and contact our support team.
                </p>
            </div>
        </div>`,
    },
    "password-removed": {
        name: "Password Removed",
        from: "security",
        replyTo: "",
        subject: "Your password was removed from your {{app.name}} account",
        body: `
        <div style="padding: 48px 32px; background-color: #f9fafb;">
            <div style="text-align: center; margin-bottom: 32px; font-size: 32px; line-height: 1.4;">
                {{app_logo}}
            </div>
            <div style="background-color: #ffffff; border-radius: 0px; padding: 32px 32px 48px 32px; margin: 0; text-align: left; box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.1);">
                <h1 style="color: #000000; text-align: left; margin-top: 0; margin-bottom: 16px; font-weight: 500; font-size: 28px; line-height: 36px;">Password Removed</h1>
                <p style="text-align: left; font-size: 16px; color: #000000; font-weight: normal; line-height: 26px;">
                    This email confirms that the password associated with your {{app.name}} account has been removed. You may now need to use alternative sign-in methods (like magic links or social providers) if enabled.
                </p>
                 <p style="margin-top: 16px; text-align: left; font-size: 16px; color: #000000; font-weight: normal; line-height: 26px;">
                    If you did not request this change, please contact our support team immediately.
                </p>
            </div>
        </div>`,
    },
    "new-device-log-in": {
        name: "New Device Sign In",
        from: "security",
        replyTo: "",
        subject: "Sign in from a new device detected on {{app.name}}",
        body: `
        <div style="padding: 48px 32px; background-color: #f9fafb;">
            <div style="text-align: center; margin-bottom: 32px; font-size: 32px; line-height: 1.4;">
                {{app_logo}}
            </div>
            <div style="background-color: #ffffff; border-radius: 0px; padding: 32px 32px 48px 32px; margin: 0; text-align: left; box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.1);">
                <h1 style="color: #000000; text-align: left; margin-top: 0; margin-bottom: 16px; font-weight: 500; font-size: 28px; line-height: 36px;">New Device Sign-In Detected</h1>
                <p style="text-align: left; font-size: 16px; color: #000000; font-weight: normal; line-height: 26px;">
                    We detected a sign-in to your {{app.name}} account from a new device or location.
                </p>
                {{#if device_info}}
                <p style="margin-top: 16px; text-align: left; font-size: 16px; color: #000000; font-weight: normal; line-height: 26px;">
                    Device details: {{device_info}}
                </p>
                {{/if}}
                <p style="margin-top: 16px; text-align: left; font-size: 16px; color: #000000; font-weight: normal; line-height: 26px;">
                    If this was you, you can safely ignore this email. If you don't recognize this activity, please secure your account immediately by resetting your password and reviewing your security settings.
                </p>
            </div>
        </div>`,
    },
    "magic-link": {
        name: "Magic Link Sign In",
        from: "authentication",
        replyTo: "",
        subject: "Sign in to {{app.name}}",
        body: `
        <div style="padding: 48px 32px; background-color: #f9fafb;">
            <div style="text-align: center; margin-bottom: 32px; font-size: 32px; line-height: 1.4;">
                {{app_logo}}
            </div>
            <div style="background-color: #ffffff; border-radius: 0px; padding: 32px 32px 48px 32px; margin: 0; text-align: left; box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.1);">
                <h1 style="color: #000000; text-align: left; margin-top: 0; margin-bottom: 16px; font-weight: 500; font-size: 28px; line-height: 36px;">Sign In to {{app.name}}</h1>
                <p style="text-align: left; font-size: 16px; color: #000000; font-weight: normal; line-height: 26px;">
                    Click the button below to sign in to your account.
                </p>
                 <p style="margin-top: 16px; text-align: left; font-size: 16px; color: #000000; font-weight: normal; line-height: 26px;">
                    This link will expire in {{link.expires_in_minutes}} minutes. If you didn't request this link, you can safely ignore this email.
                </p>
                <div style="text-align: center; margin: 32px 0 0 0;"><a href="{{action_url}}" style="display: inline-block; padding: 16px 32px; font-size: 16px; color: #ffffff; background-color: #6c47ff; border-radius: 8px; text-decoration: none; font-weight: 500; line-height: 1; box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);" class="cl-branded-button">Sign In</a></div>
                <p style="margin: 24px 0 0 0; text-align: center; font-size: 16px; color: #000000; font-weight: normal; line-height: 26px;">If you're having trouble with the above button, <a href="{{action_url}}" style="text-decoration: none; color: #6c47ff;" class="cl-branded-link">click here</a>.</p>
            </div>
        </div>`,
    },
    "waitlisted": { // Corresponds to Waitlist Signup
        name: "Added to Waitlist",
        from: "notifications",
        replyTo: "",
        subject: "You're on the waitlist for {{app.name}}",
        body: `
        <div style="padding: 48px 32px; background-color: #f9fafb;">
            <div style="text-align: center; margin-bottom: 32px; font-size: 32px; line-height: 1.4;">
                {{app_logo}}
            </div>
            <div style="background-color: #ffffff; border-radius: 0px; padding: 32px 32px 48px 32px; margin: 0; text-align: left; box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.1);">
                <h1 style="color: #000000; text-align: left; margin-top: 0; margin-bottom: 16px; font-weight: 500; font-size: 28px; line-height: 36px;">You're on the Waitlist!</h1>
                <p style="text-align: left; font-size: 16px; color: #000000; font-weight: normal; line-height: 26px;">
                    Thanks for your interest in {{app.name}}! You've been successfully added to our waitlist.
                </p>
                 <p style="margin-top: 16px; text-align: left; font-size: 16px; color: #000000; font-weight: normal; line-height: 26px;">
                    We'll notify you as soon as a spot becomes available.
                </p>
            </div>
        </div>`,
    },
    "waitlist-invite": {
        name: "Waitlist Invitation",
        from: "invitations",
        replyTo: "",
        subject: "You're invited to join {{app.name}} from the waitlist!",
        body: `
        <div style="padding: 48px 32px; background-color: #f9fafb;">
            <div style="text-align: center; margin-bottom: 32px; font-size: 32px; line-height: 1.4;">
                {{app_logo}}
            </div>
            <div style="background-color: #ffffff; border-radius: 0px; padding: 32px 32px 48px 32px; margin: 0; text-align: left; box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.1);">
                <h1 style="color: #000000; text-align: left; margin-top: 0; margin-bottom: 16px; font-weight: 500; font-size: 28px; line-height: 36px;">You're Invited!</h1>
                <p style="text-align: left; font-size: 16px; color: #000000; font-weight: normal; line-height: 26px;">
                    Good news! You've been invited to join {{app.name}} from the waitlist. Click the button below to accept your invitation and get started.
                </p>
                 <p style="margin-top: 16px; text-align: left; font-size: 16px; color: #000000; font-weight: normal; line-height: 26px;">
                    This invitation will expire in {{invitation.expires_in_days}} days.
                </p>
                <div style="text-align: center; margin: 32px 0 0 0;"><a href="{{action_url}}" style="display: inline-block; padding: 16px 32px; font-size: 16px; color: #ffffff; background-color: #6c47ff; border-radius: 8px; text-decoration: none; font-weight: 500; line-height: 1; box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);" class="cl-branded-button">Accept Invitation</a></div>
                <p style="margin: 24px 0 0 0; text-align: center; font-size: 16px; color: #000000; font-weight: normal; line-height: 26px;">If you're having trouble with the above button, <a href="{{action_url}}" style="text-decoration: none; color: #6c47ff;" class="cl-branded-link">click here</a>.</p>
            </div>
        </div>`,
    },
    "invite-user": { // Corresponds to InviteUserTemplate
        name: "User Invitation",
        from: "invitations",
        replyTo: "",
        subject: "Invitation to join {{app.name}}",
        body: `
        <div style="padding: 48px 32px; background-color: #f9fafb;">
            <div style="text-align: center; margin-bottom: 32px; font-size: 32px; line-height: 1.4;">
                {{app_logo}}
            </div>
            <div style="background-color: #ffffff; border-radius: 0px; padding: 32px 32px 48px 32px; margin: 0; text-align: left; box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.1);">
                <h1 style="color: #000000; text-align: left; margin-top: 0; margin-bottom: 16px; font-weight: 500; font-size: 28px; line-height: 36px;">You're Invited to Join {{app.name}}</h1>
                <p style="text-align: left; font-size: 16px; color: #000000; font-weight: normal; line-height: 26px;">
                    You have been invited to join {{app.name}}. Click the button below to accept the invitation.
                </p>
                 <p style="margin-top: 16px; text-align: left; font-size: 16px; color: #000000; font-weight: normal; line-height: 26px;">
                    This invitation will expire in {{invitation.expires_in_days}} days.
                </p>
                <div style="text-align: center; margin: 32px 0 0 0;"><a href="{{action_url}}" style="display: inline-block; padding: 16px 32px; font-size: 16px; color: #ffffff; background-color: #6c47ff; border-radius: 8px; text-decoration: none; font-weight: 500; line-height: 1; box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);" class="cl-branded-button">Accept Invitation</a></div>
                <p style="margin: 24px 0 0 0; text-align: center; font-size: 16px; color: #000000; font-weight: normal; line-height: 26px;">If you're having trouble with the above button, <a href="{{action_url}}" style="text-decoration: none; color: #6c47ff;" class="cl-branded-link">click here</a>.</p>
            </div>
        </div>`,
    },
}; 