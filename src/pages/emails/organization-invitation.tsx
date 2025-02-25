import { Heading, Subheading } from "@/components/ui/heading";
import EmailEditor from "../../components/rich-text-editor";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Strong, Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";

export default function EmailOrganizationInvitationPage() {

  const [content, setContent] = useState(`[#if inviter_name][inviter_name] has invited you to join them on [app.name].[#else]You are invited to join [app.name][#endif]`);

  const [ejsContent, setEjsContent] = useState('');

  useEffect(() => {
    console.log('Raw HTML:', content);
    console.log('EJS Template:', ejsContent);
  }, [content, ejsContent
  ]);

  return (
    <div className="flex flex-col gap-2 mb-2">
      <Heading className="mb-8">Organization Invitation</Heading>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-medium">Delivered by Wacht</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Intended for B2B SaaS products, this feature allows users to create Organizations, invite their team, and assign roles.
          </p>
        </div>
        <Switch
          name="organization_invitation"
        // checked={}
        // onChange={}
        />
      </div>

      <div className="my-10">
        <div className="space-y-10">

          <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            <div className="space-y-1">
              <Subheading><Strong>Name</Strong></Subheading>
            </div>
            <div>
              <Input
                type="text"
                placeholder="Enter your name"
                size={29}
              />
            </div>
          </section>

          <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            <div className="space-y-1">
              <Subheading><Strong>From</Strong></Subheading>
              <Text>Enter the local email part you would like this email to be sent from, or leave empty to default to `invitations`.</Text>
            </div>
            <div>
              <Input
                type="text"
                placeholder="person@accounts.dev"
                size={29}
              />
            </div>
          </section>

          <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            <div className="space-y-1">
              <Subheading><Strong>Reply-To</Strong></Subheading>
              <Text>Enter the local email part you would like this email's Reply-To header to be set to</Text>
            </div>
            <div>
              <Input
                type="text"
                placeholder="person@accounts.dev"
                size={29}
              />
            </div>
          </section>

          <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            <div className="space-y-1">
              <Subheading><Strong>Subject</Strong></Subheading>
            </div>
            <div>
              <Input
                type="text"
                placeholder="You're invited to join [app.name]"
                size={29}
              />
            </div>
          </section>
        </div>
      </div>

      <EmailEditor
        initialContent={content}
        onChange={(rawContent, ejsContent) => {
          setContent(rawContent);
          setEjsContent(ejsContent);
        }}
      />
    </div>
  );
}
