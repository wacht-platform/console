import { Heading, Subheading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Input } from "@/components/ui/input";
import { Checkbox, CheckboxField } from "@/components/ui/checkbox";
import { Field, FieldGroup, Label } from "@/components/ui/fieldset";
import { Listbox, ListboxLabel, ListboxOption } from "@/components/ui/listbox";
import { Switch } from "@/components/ui/switch";
import { WrenchScrewdriverIcon } from "@heroicons/react/24/outline"
import { useState } from "react";
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";


export default function SessionsPage() {

  let [isOpen, setIsOpen] = useState(false);
  const [steps, setSteps] = useState(1);

  const [jwtTemplates, setJwtTemplates] = useState([{ id: "default", name: "Default" }, { id: "custom", name: "Custom" }]);


  const [claims, setClaims] = useState(`{
  "user": {
    "id": "{{user.id}}",
    "username": "{{user.username}}",
    "email_verified": "{{user.email_verified}}",
    "image_url": "{{user.image_url}}"
  },
  "org": {
    "id": "{{org.id}}",
    "name": "{{org.name}}",
    "public_metadata": "{{org.public_metadata}}"
  },
  "session": {
    "actor": "{{session.actor}}"
  },
  "source": {
    "platform": "{{source.platform}}"
  }
}`);



  const openJwtTemplateModal = () => setSteps(2);
  const goBackToMainStep = () => setSteps(1);


  const [defaultJwtTemplate, setDefaultJwtTemplate] = useState("default");

  const SHORTCODES = [
    "user.id", "user.username", "user.email_verified", "user.image_url",
    "org.id", "org.name", "org.public_metadata", "session.actor", "source.platform"
  ];

  interface JwtTemplate {
    id: string;
    name: string;
  }

  interface Shortcode {
    shortcode: string;
  }

  const insertShortcode = (shortcode: Shortcode['shortcode']) => {
    setClaims((prev) => prev + `{{${shortcode}}}`);
  };



  return (
    <div>
      <Heading>Sessions</Heading>
      <div className="mt-8 space-y-10">
        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
          <div className="space-y-1 col-span-2">
            <Subheading>Session Validity</Subheading>
            <Text>
              The maximum lifetime of a session, regardless of user activity. After that, the
              session will be expired and the user will need to log in again.
            </Text>
          </div>
          <Field className="flex items-center gap-x-4">
            <FieldGroup>
              <Input aria-label="Duration" name="duration" inputClassName="text-right" defaultValue="30" />
            </FieldGroup>
            <FieldGroup className="flex-1">
              <Listbox name="unit" defaultValue="days">
                <ListboxOption value="minutes">
                  <ListboxLabel>Minutes</ListboxLabel>
                </ListboxOption>
                <ListboxOption value="hours">
                  <ListboxLabel>Hours</ListboxLabel>
                </ListboxOption>
                <ListboxOption value="days">
                  <ListboxLabel>Days</ListboxLabel>
                </ListboxOption>
                <ListboxOption value="weeks">
                  <ListboxLabel>Weeks</ListboxLabel>
                </ListboxOption>
              </Listbox>
            </FieldGroup>
          </Field>
        </section>

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
          <div className="space-y-1 col-span-2">
            <Subheading>Inactivity Timeout</Subheading>
            <Text>
              The maximum period of inactivity after which a session is terminated.
            </Text>
          </div>
          <Field className="flex items-center gap-x-4">
            <FieldGroup>
              <Input aria-label="Duration" inputClassName="text-right" name="duration" defaultValue="7" />
            </FieldGroup>
            <FieldGroup className="flex-1">
              <Listbox name="unit" defaultValue="days">
                <ListboxOption value="minutes">
                  <ListboxLabel>Minutes</ListboxLabel>
                </ListboxOption>
                <ListboxOption value="hours">
                  <ListboxLabel>Hours</ListboxLabel>
                </ListboxOption>
                <ListboxOption value="days">
                  <ListboxLabel>Days</ListboxLabel>
                </ListboxOption>
                <ListboxOption value="weeks">
                  <ListboxLabel>Weeks</ListboxLabel>
                </ListboxOption>
              </Listbox>
            </FieldGroup>
          </Field>
        </section>
      </div>

      <Divider className="my-10" soft />

      <section className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium">Email address</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Multi Session Support
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button plain type="button" onClick={() => setIsOpen(true)}>
              <WrenchScrewdriverIcon />
            </Button>
            {/* Dialoge open here  */}
            <Dialog open={isOpen} onClose={setIsOpen} className="rounded-xl p-6">
              {steps === 1 && (
                <>
                  <DialogTitle className="mb-2">Customize session token</DialogTitle>
                  <DialogDescription className="mb-6">
                    Customize the session token to include additional information.
                  </DialogDescription>
                  <DialogBody className="space-y-8">
                    <section className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Subheading>Session lifetime</Subheading>
                        <Text>
                          Set session duration limits for the long-lived cookie by configuring
                          the inactivity timeout or the maximum lifetime.
                        </Text>
                      </div>
                      <div className="space-y-4">
                        <Subheading>Maximum lifetime</Subheading>
                        <Text>Set the maximum lifetime duration for a session</Text>
                        <Field className="flex items-center gap-4">
                          <FieldGroup>
                            <Input
                              aria-label="Duration"
                              name="duration"
                              inputClassName="text-right"
                              defaultValue="30"
                            />
                          </FieldGroup>
                          <FieldGroup className="flex-1">
                            <Listbox name="unit" defaultValue="days">
                              <ListboxOption value="minutes">
                                <ListboxLabel>Minutes</ListboxLabel>
                              </ListboxOption>
                              <ListboxOption value="hours">
                                <ListboxLabel>Hours</ListboxLabel>
                              </ListboxOption>
                              <ListboxOption value="days">
                                <ListboxLabel>Days</ListboxLabel>
                              </ListboxOption>
                              <ListboxOption value="weeks">
                                <ListboxLabel>Weeks</ListboxLabel>
                              </ListboxOption>
                            </Listbox>
                          </FieldGroup>
                        </Field>
                        <Text>Set duration between 5 minutes and 10 years.</Text>
                      </div>
                    </section>

                    <Divider className="my-8" soft />

                    <section className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Subheading>Maximum accounts per session</Subheading>
                        <Text>
                          Limit the number of accounts that can be active within a single session.
                        </Text>
                      </div>
                      <div className="space-y-4">
                        <Field className="flex items-center gap-4">
                          <FieldGroup>
                            <Input
                              aria-label="Max accounts"
                              name="maxAccounts"
                              inputClassName="text-right"
                              defaultValue="1"
                            />
                          </FieldGroup>
                        </Field>
                        <Text>Set a value between 1 and 10.</Text>
                      </div>
                    </section>

                    <Divider className="my-8" soft />

                    <section className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Subheading>Maximum user logins</Subheading>
                        <Text>
                          Set the maximum number of active sessions a user can have at the same time.
                        </Text>
                      </div>
                      <div className="space-y-4">
                        <Field className="flex items-center gap-4">
                          <FieldGroup>
                            <Input
                              aria-label="Max user logins"
                              name="maxUserLogins"
                              inputClassName="text-right"
                              defaultValue="1"
                            />
                          </FieldGroup>
                        </Field>
                        <Text>Set a value between 1 and 10.</Text>
                      </div>
                    </section>
                    <Divider className="my-8" soft />
                    <section className="space-y-6">
                      <div className="space-y-2">
                        <Subheading>JWT Templates</Subheading>
                        <Text>Manage JWT templates and set a default one for session tokens.</Text>
                      </div>

                      <Field className="space-y-4">
                        <FieldGroup>
                          <Listbox
                            name="defaultJwtTemplate"
                            value={defaultJwtTemplate}
                            onChange={(value) => setDefaultJwtTemplate(value)}
                          >
                            {jwtTemplates.map((template) => (
                              <ListboxOption key={template.id} value={template.id}>
                                <ListboxLabel>{template.name}</ListboxLabel>
                              </ListboxOption>
                            ))}
                          </Listbox>
                        </FieldGroup>
                      </Field>
                      <Button outline onClick={openJwtTemplateModal} disabled={defaultJwtTemplate === "default"}>
                        Manage JWT Templates
                      </Button>
                    </section>
                  </DialogBody>
                  <DialogActions className="flex justify-end gap-4 mt-6">
                    <Button plain onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={() => setIsOpen(false)}>Submit</Button>
                  </DialogActions>
                </>
              )}

              {steps === 2 && (
                <>
                  <DialogTitle className="mb-2">Manage JWT Templates</DialogTitle>
                  <DialogDescription className="mb-6">
                    Define custom JWT claims using shortcodes.
                  </DialogDescription>
                  <DialogBody className="space-y-6">
                    <div>
                      <label className="text-sm font-medium">Claims</label>
                      <Textarea
                        className="mt-2 w-full h-40 p-3 bg-zinc-900 text-white rounded-md"
                        value={claims}
                        onChange={(e) => setClaims(e.target.value)}
                        placeholder="Enter claims JSON with shortcodes"
                      />
                    </div>
                    <Divider className="my-4" soft />
                    <div>
                      <label className="text-sm font-medium">Insert shortcodes</label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {SHORTCODES.map((code) => (
                          <Button key={code} outline onClick={() => insertShortcode(code)}>
                            {code}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </DialogBody>
                  <DialogActions className="flex justify-between gap-4 mt-6">
                    <Button plain onClick={goBackToMainStep}>Back</Button>
                    <Button onClick={() => setIsOpen(false)}>Done</Button>
                  </DialogActions>
                </>
              )}
            </Dialog>
            <Switch name="email_enabled" defaultChecked />
          </div>
        </div>
      </section>
      <Divider className="my-10" soft />
      <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <div className="space-y-1">
          <Subheading>Organization Email</Subheading>
          <Text>This is how customers can contact you for support.</Text>
        </div>
        <div className="space-y-4">
          <Input type="email" aria-label="Organization Email" name="email" defaultValue="info@example.com" />
          <CheckboxField>
            <Checkbox name="email_is_public" defaultChecked />
            <Label>Show email on public profile</Label>
          </CheckboxField>
        </div>
      </section>

      <Divider className="my-10" soft />

      <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <div className="space-y-1">
          <Subheading>Address</Subheading>
          <Text>This is where your organization is registered.</Text>
        </div>
        {/* <Address /> */}
      </section>

      <Divider className="my-10" soft />

      <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <div className="space-y-1">
          <Subheading>Currency</Subheading>
          <Text>The currency that your organization will be collecting.</Text>
        </div>
        <div>
          <Select aria-label="Currency" name="currency" defaultValue="cad">
            <option value="cad">CAD - Canadian Dollar</option>
            <option value="usd">USD - United States Dollar</option>
          </Select>
        </div>
      </section>

      <Divider className="my-10" soft />

      <div className="flex justify-end gap-4">
        <Button type="reset" plain>
          Reset
        </Button>
        <Button type="submit">Save changes</Button>
      </div>

    </div>
  );
}


