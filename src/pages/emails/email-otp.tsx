import { Heading, Subheading } from "@/components/ui/heading";
import EmailEditor from "../../components/rich-text-editor";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Strong, Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Divider } from "@/components/ui/divider";

export default function EmailOtpPage() {
  const [content, setContent] = useState("");
  const [ejsContent, setEjsContent] = useState<string>("");

  const defaultTemplate = `
<div style="font-family: Helvetica, Arial, sans-serif; max-width: 90%; margin: auto; line-height: 1.6; color: #333; padding: 20px; box-sizing: border-box;">
  <div style="margin: auto; padding: 20px; background: #f9f9f9; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
    <div style="border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; display: flex; align-items: center;">
      <img src="[app.logo_image_url]" alt="[app.name] Logo" style="height: 40px; margin-right: 10px;">
      <a href="[app.url]" style="font-size: 1.5em; color: #000; text-decoration: none; font-weight: bold;">[app.name]</a>
    </div>
    <p style="font-size: 1.2em; margin-bottom: 10px;">Hi [user_name],</p>
    <p style="margin-bottom: 20px;">
      Your One-Time Password (OTP) for [app.name] is:
    </p>
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="background: #000; color: #fff; padding: 12px 24px; border-radius: 5px; font-size: 1.5em; display: inline-block;">
        [otp.code]
      </div>
    </div>
    <p style="margin-bottom: 20px;">
      This OTP is valid for [otp.expires_in_minutes] minutes. Please do not share it with anyone.
    </p>
    <p style="margin-bottom: 20px;">
      If you did not request this OTP, please ignore this email or contact support immediately.
    </p>
    <p style="font-size: 1em; margin-top: 20px;">Regards,<br><strong>[app.name]</strong></p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
    <div style="text-align: right; color: #aaa; font-size: 0.9em; line-height: 1.4;">
      <p style="margin: 0;">[app.domain_name]</p>
    </div>
  </div>
</div>
`;

  useEffect(() => {
    console.log("Raw HTML:", content);
    console.log("EJS Template:", ejsContent);
  }, [content, ejsContent]);

  return (
    <div className="flex flex-col gap-2 mb-2">
      <Heading className="mb-8">Email OTP</Heading>

      <div className="flex items-start justify-between">
        <div className="w-3/4">
          <h2 className="text-base font-medium">Delivered by Wacht</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            If enabled, Wacht will utilize SendGrid to deliver this email automatically. If disabled, Wacht will not send the email, and you will need to handle the delivery manually by listening to the email webhook.
          </p>
        </div>
        <Switch
          name="email_otp"
        // checked={}
        // onChange={}
        />
      </div>

      <Divider className="mt-3"/>

      <div className="my-10">
        <div className="space-y-10">
          <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            <div className="space-y-1">
              <Subheading>
                <Strong>Name</Strong>
              </Subheading>
            </div>
            <div>
              <Input type="text" placeholder="Enter your name" size={29} />
            </div>
          </section>

          <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            <div className="space-y-1">
              <Subheading>
                <Strong>From</Strong>
              </Subheading>
              <Text>
                Enter the local email part you would like this email to be sent
                from, or leave empty to default to `security`.
              </Text>
            </div>
            <div>
              <Input type="text" placeholder="security@accounts.dev" size={29} />
            </div>
          </section>

          <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            <div className="space-y-1">
              <Subheading>
                <Strong>Reply-To</Strong>
              </Subheading>
              <Text>
                Enter the local email part you would like this email's Reply-To
                header to be set to.
              </Text>
            </div>
            <div>
              <Input type="text" placeholder="support@accounts.dev" size={29} />
            </div>
          </section>

          <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            <div className="space-y-1">
              <Subheading>
                <Strong>Subject</Strong>
              </Subheading>
            </div>
            <div>
              <Input
                type="text"
                placeholder="Your One-Time Password (OTP) for [app.name]"
                size={29}
              />
            </div>
          </section>
        </div>
      </div>

      <EmailEditor
        initialContent={defaultTemplate}
        onChange={(rawContent, ejsContent) => {
          setContent(rawContent);
          setEjsContent(ejsContent);
        }}
      />
    </div>
  );
}