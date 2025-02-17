import { Heading, Subheading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup } from "@/components/ui/fieldset";
import { Listbox, ListboxLabel, ListboxOption } from "@/components/ui/listbox";
import { Switch } from "@/components/ui/switch";
import { PencilSquareIcon, TrashIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline"
import { useState } from "react";
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";


export default function SessionsPage() {

  let [isOpen, setIsOpen] = useState(false);
  const [isSwitchOn, setIsSwitchOn] = useState(true);

  const SHORTCODES = [
    "user.id", "user.username", "user.email_verified", "user.image_url",
    "org.id", "org.name", "org.public_metadata", "session.actor", "source.platform"
  ];


  const [jwtTemplates, setJwtTemplates] = useState([
    { id: 1, name: "Default Template", claims: "{}" },
    { id: 2, name: "Custom Template 1", claims: '{"role": "admin"}' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<{ id: number; name: string; claims: string } | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [claims, setClaims] = useState("");

  const openModal = (template: { id: number; name: string; claims: string } | null = null) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateName(template.name);
      setClaims(template.claims);
    } else {
      setEditingTemplate(null);
      setTemplateName("");
      setClaims("");
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSave = () => {
    if (editingTemplate) {
      setJwtTemplates((prev) =>
        prev.map((t) => (t.id === editingTemplate.id ? { ...t, name: templateName, claims } : t))
      );
    } else {
      setJwtTemplates((prev) => [
        ...prev,
        { id: Date.now(), name: templateName, claims },
      ]);
    }
    closeModal();
  };

  interface JwtTemplate {
    id: number;
    name: string;
    claims: string;
  }

  const handleDelete = (id: number) => {
    setJwtTemplates((prev: JwtTemplate[]) => prev.filter((t) => t.id !== id));
  };

  const insertShortcode = (code: string) => {
    setClaims((prev: string) => prev + (prev ? ", " : "") + `"${code}": ""`);
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
            <Button plain type="button" onClick={() => setIsOpen(true)} disabled={!isSwitchOn}>
              <WrenchScrewdriverIcon />
            </Button>
            {/* Dialoge open here  */}
            <Dialog open={isOpen} onClose={setIsOpen} className="rounded-xl p-6">
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
                </DialogBody>
                <DialogActions className="flex justify-end gap-4 mt-6">
                  <Button plain onClick={() => setIsOpen(false)}>Cancel</Button>
                  <Button onClick={() => setIsOpen(false)}>Submit</Button>
                </DialogActions>
              </>
            </Dialog>
            <Switch
              name="email_enabled"
              checked={isSwitchOn}
              onChange={setIsSwitchOn}
            />
          </div>
        </div>
      </section>
      <Divider className="my-10" soft />

      <section className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium">JWT Templates</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Manage JWT templates and set a default one for session tokens.
            </p>
          </div>
          <Button outline onClick={() => openModal()}>Add JWT Template</Button>
        </div>

        <div className="space-y-4">
          {jwtTemplates.map((template) => (
            <div key={template.id} className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">{template.name}</h4>
                <p className="text-xs text-zinc-500">{template.claims}</p>
              </div>
              <div className="flex gap-2">
                <Button plain onClick={() => openModal(template)}>
                  <PencilSquareIcon className="w-5 h-5 inline-block mr-1" />
                  Edit
                </Button>
                <Button plain  onClick={() => handleDelete(template.id)}>
                  <TrashIcon className="w-5 h-5 inline-block mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>

        {isModalOpen && (
          <Dialog open={isModalOpen} onClose={closeModal} className="rounded-xl p-6">
            <DialogTitle className="mb-2">{editingTemplate ? "Edit JWT Template" : "Add JWT Template"}</DialogTitle>
            <DialogBody className="space-y-6">
              <div>
                <label className="text-sm font-medium">Template Name</label>
                <input
                  className="mt-2 w-full p-2 border rounded-md"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter template name"
                />
              </div>
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
              <Button plain onClick={closeModal}>Cancel</Button>
              <Button onClick={handleSave}>{editingTemplate ? "Save Changes" : "Create"}</Button>
            </DialogActions>
          </Dialog>
        )}
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


