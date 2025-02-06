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

export default function SessionsPage() {
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
            <Button plain>
              <WrenchScrewdriverIcon />
            </Button>
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
