import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Heading, Subheading } from "@/components/ui/heading";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { TrashIcon } from "@heroicons/react/24/outline";
import { RadioGroup, Radio, RadioField } from '@/components/ui/radio'
import { Description, Field, FieldGroup, Fieldset, Label, Legend } from "@/components/ui/fieldset";
import { useCurrentDeployemnt } from "@/lib/api/hooks/use-deployment-settings";
import { useUpdateDeploymentRestrictions } from "@/lib/api/hooks/use-deployment-restrictions";
import type { DeploymentRestrictions, DeploymentRestrictionsSignUpMode } from "@/types/deployment";

export default function RestrictionsPage() {
  const [initialRestrictions, setInitialRestrictions] = useState<DeploymentRestrictions | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const setDirty = useCallback(() => setIsDirty(true), []);

  const [bannedKeywords, _setBannedKeywords] = useState<string[]>([]);
  const setBannedKeywords = useCallback((value: React.SetStateAction<string[]>) => {
    _setBannedKeywords(prev => typeof value === 'function' ? value(prev) : value);
    setDirty();
  }, [setDirty]);

  const [newKeyword, setNewKeyword] = useState('');

  const [selectedCountries, _setSelectedCountries] = useState<string[]>([]);
  const setSelectedCountries = useCallback((value: React.SetStateAction<string[]>) => {
    _setSelectedCountries(prev => typeof value === 'function' ? value(prev) : value);
    setDirty();
  }, [setDirty]);

  const [allowlistedEmails, _setAllowlistedEmails] = useState<string[]>([]);
  const setAllowlistedEmails = useCallback((value: React.SetStateAction<string[]>) => {
    _setAllowlistedEmails(prev => typeof value === 'function' ? value(prev) : value);
    setDirty();
  }, [setDirty]);

  const [newEmail, setNewEmail] = useState('');

  const [blocklistedEmails, _setBlocklistedEmails] = useState<string[]>([]);
  const setBlocklistedEmails = useCallback((value: React.SetStateAction<string[]>) => {
    _setBlocklistedEmails(prev => typeof value === 'function' ? value(prev) : value);
    setDirty();
  }, [setDirty]);

  const [newBlockedEmail, setNewBlockedEmail] = useState('');

  const [signUpMode, _setSignUpMode] = useState<DeploymentRestrictionsSignUpMode>(
    'public' as DeploymentRestrictionsSignUpMode
  );
  const setSignUpMode = useCallback((value: React.SetStateAction<DeploymentRestrictionsSignUpMode>) => {
    _setSignUpMode(prev => typeof value === 'function' ? value(prev) : value);
    setDirty();
  }, [setDirty]);


  const [isAllowlistEnabled, _setIsAllowlistEnabled] = useState(false);
  const setIsAllowlistEnabled = useCallback((value: React.SetStateAction<boolean>) => {
    _setIsAllowlistEnabled(prev => typeof value === 'function' ? value(prev) : value);
    setDirty();
  }, [setDirty]);

  const [isBlocklistEnabled, _setIsBlocklistEnabled] = useState(false);
  const setIsBlocklistEnabled = useCallback((value: React.SetStateAction<boolean>) => {
    _setIsBlocklistEnabled(prev => typeof value === 'function' ? value(prev) : value);
    setDirty();
  }, [setDirty]);

  const [blockSubaddresses, _setBlockSubaddresses] = useState(false);
  const setBlockSubaddresses = useCallback((value: React.SetStateAction<boolean>) => {
    _setBlockSubaddresses(prev => typeof value === 'function' ? value(prev) : value);
    setDirty();
  }, [setDirty]);


  const [blockDisposableEmails, _setBlockDisposableEmails] = useState(false);
  const setBlockDisposableEmails = useCallback((value: React.SetStateAction<boolean>) => {
    _setBlockDisposableEmails(prev => typeof value === 'function' ? value(prev) : value);
    setDirty();
  }, [setDirty]);

  const [enableVoipRestriction, _setEnableVoipRestriction] = useState(false);
  const setEnableVoipRestriction = useCallback((value: React.SetStateAction<boolean>) => {
    _setEnableVoipRestriction(prev => typeof value === 'function' ? value(prev) : value);
    setDirty();
  }, [setDirty]);

  const [isCountryRestrictionEnabled, _setIsCountryRestrictionEnabled] = useState(false);
  const setIsCountryRestrictionEnabled = useCallback((value: React.SetStateAction<boolean>) => {
    _setIsCountryRestrictionEnabled(prev => typeof value === 'function' ? value(prev) : value);
    if ((typeof value === 'function' ? value(false) : value) === false) {
      _setSelectedCountries([]);
    }
    setDirty();
  }, [setDirty]);


  const { deploymentSettings, isLoading: isLoadingSettings } = useCurrentDeployemnt();
  const { mutate: updateRestrictions, isLoading: isUpdatingRestrictions } = useUpdateDeploymentRestrictions();

  const setFormState = (restrictions: DeploymentRestrictions | null) => {
    if (!restrictions) return;
    _setSignUpMode(restrictions.sign_up_mode || 'public');
    _setIsAllowlistEnabled(restrictions.allowlist_enabled ?? false);
    _setAllowlistedEmails(restrictions.allowlisted_resources?.sort() ?? []);
    _setIsBlocklistEnabled(restrictions.blocklist_enabled ?? false);
    _setBlocklistedEmails(restrictions.blocklisted_resources?.sort() ?? []);
    _setBlockSubaddresses(restrictions.block_subaddresses ?? false);
    _setBlockDisposableEmails(restrictions.block_disposable_emails ?? false);
    _setEnableVoipRestriction(restrictions.block_voip_numbers ?? false);
    _setBannedKeywords(restrictions.banned_keywords?.sort() ?? []);
    _setSelectedCountries(restrictions.country_restrictions?.country_codes?.sort() ?? []);
    _setIsCountryRestrictionEnabled(restrictions.country_restrictions?.enabled ?? false);
  };


  useEffect(() => {
    if (deploymentSettings?.restrictions) {
      const restrictions = deploymentSettings.restrictions;
      const normalizedRestrictions = {
        ...restrictions,
        allowlisted_resources: [...(restrictions.allowlisted_resources ?? [])].sort(),
        blocklisted_resources: [...(restrictions.blocklisted_resources ?? [])].sort(),
        banned_keywords: [...(restrictions.banned_keywords ?? [])].sort(),
        country_restrictions: {
          ...(restrictions.country_restrictions ?? { enabled: false, country_codes: [] }),
          country_codes: [...(restrictions.country_restrictions?.country_codes ?? [])].sort(),
        },
      };
      setInitialRestrictions(normalizedRestrictions);
      setFormState(normalizedRestrictions);
      setIsDirty(false);
    }
  }, [deploymentSettings]);

  const addKeyword = (keyword: string) => {
    const trimmedKeyword = keyword.trim();
    if (trimmedKeyword) {
      setBannedKeywords(prev => prev.includes(trimmedKeyword) ? prev : [...prev, trimmedKeyword]);
    }
    setNewKeyword("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.includes(",")) {
      const keywords = value.split(",").map((k) => k.trim()).filter((k) => k);
      keywords.forEach(addKeyword);
    } else {
      setNewKeyword(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addKeyword(newKeyword);
    }
  };


  const addEmailToAllowlist = (email: string) => {
    const trimmedEmail = email.trim();
    if (trimmedEmail) {
      setAllowlistedEmails(prev => prev.includes(trimmedEmail) ? prev : [...prev, trimmedEmail]);
    }
    setNewEmail('');
  };

  const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewEmail(e.target.value);
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmailToAllowlist(newEmail);
    }
  };

  const removeEmailFromAllowlist = (email: string) => {
    setAllowlistedEmails(prev => prev.filter(e => e !== email));
  };


  const addEmailToBlocklist = (email: string) => {
    const trimmedEmail = email.trim();
    if (trimmedEmail) {
      setBlocklistedEmails(prev => prev.includes(trimmedEmail) ? prev : [...prev, trimmedEmail]);
    }
    setNewBlockedEmail('');
  };

  const handleBlockedEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewBlockedEmail(e.target.value);
  };

  const handleBlockedEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmailToBlocklist(newBlockedEmail);
    }
  };

  const removeEmailFromBlocklist = (email: string) => {
    setBlocklistedEmails(prev => prev.filter(e => e !== email));
  };

  const removeKeyword = (keyword: string) => {
    setBannedKeywords(prev => prev.filter(k => k !== keyword));
  };


  const handleSave = () => {
    const payload: Partial<DeploymentRestrictions> = {
      sign_up_mode: signUpMode,
      allowlist_enabled: isAllowlistEnabled,
      allowlisted_resources: allowlistedEmails,
      blocklist_enabled: isBlocklistEnabled,
      blocklisted_resources: blocklistedEmails,
      block_subaddresses: blockSubaddresses,
      block_disposable_emails: blockDisposableEmails,
      block_voip_numbers: enableVoipRestriction,
      banned_keywords: bannedKeywords,
      country_restrictions: {
        enabled: isCountryRestrictionEnabled,
        country_codes: isCountryRestrictionEnabled ? selectedCountries : [],
      },
    };

    updateRestrictions(payload as DeploymentRestrictions, {
      onSuccess: () => {
        setIsDirty(false);
      },
      onError: (error) => {
        console.error("Failed to update restrictions:", error);
      }
    });
  };

  const handleReset = () => {
    if (initialRestrictions) {
      setFormState(initialRestrictions);
    }
    setIsDirty(false);
  };

  if (isLoadingSettings) {
    return <div>Loading restrictions...</div>;
  }

  const handleSignUpModeChange = (value: string) => {
    setSignUpMode(value as DeploymentRestrictionsSignUpMode);
  }

  return (
    <>
      <div className="flex flex-col gap-8 pb-24">
        <div>
          <Heading>Restrictions</Heading>
          <Text>Specify restrictions for this deployment.</Text>
        </div>

        <div className="space-y-8">
          <Fieldset>
            <Legend>Sign-up mode</Legend>
            <Text>Choose the sign up mode for your application.</Text>
            <FieldGroup>
              <RadioGroup value={signUpMode} onChange={handleSignUpModeChange} className="space-y-4">
                <Field>
                  <RadioField>
                    <Radio value="public" />
                    <Label>Public</Label>
                    <Description>Anyone can sign up to your application.</Description>
                  </RadioField>
                </Field>
                <Field>
                  <RadioField>
                    <Radio value="restricted" />
                    <Label>Restricted</Label>
                    <Description>Sign ups are disabled, and users can only access your application if they are invited, created manually, or authenticated through an enterprise SSO connection.</Description>
                  </RadioField>
                </Field>
                <Field>
                  <RadioField>
                    <Radio value="waitlist" />
                    <Label>Waitlist</Label>
                    <Description>Sign ups are disabled, but people can join a waitlist.</Description>
                  </RadioField>
                </Field>
              </RadioGroup>
            </FieldGroup>
          </Fieldset>

          <Divider soft />

          <section className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Subheading>Allowlist</Subheading>
                <Text>Restrict sign-ups and sign-ins to accounts with pre-approved identifiers.</Text>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isAllowlistEnabled} onChange={setIsAllowlistEnabled} />
              </div>
            </div>
            {isAllowlistEnabled && (
              <FieldGroup className="border-t border-zinc-950/10 pt-4 dark:border-white/10 space-y-4">
                <Field>
                  <Label>Identifiers</Label>
                  <Description>Enter a domain, email address, phone number, or Web3 wallet address to add it to the allowlist.</Description>
                </Field>
                <Field>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      placeholder="Enter phone, email, domain"
                      className="flex-grow"
                      value={newEmail}
                      onChange={handleEmailInputChange}
                      onKeyDown={handleEmailKeyDown}
                    />
                    <Button plain onClick={() => addEmailToAllowlist(newEmail)}>Add</Button>
                  </div>
                </Field>

                {allowlistedEmails.length > 0 && (
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-2">
                      {allowlistedEmails.map((email) => (
                        <span
                          key={email}
                          className="bg-gray-50 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center space-x-2 border border-gray-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700"
                        >
                          <span>{email}</span>
                          <button
                            onClick={() => removeEmailFromAllowlist(email)}
                            title="Remove identifier"
                            className="text-gray-600 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <Field>
                  <Description>
                    ⓘ When enabled, only identifiers on the allowlist will be able to sign in or sign up.
                  </Description>
                </Field>
              </FieldGroup>
            )}
          </section>

          <Divider soft />

          <section className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Subheading>Blocklist</Subheading>
                <Text>Block accounts with certain identifiers.</Text>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isBlocklistEnabled} onChange={setIsBlocklistEnabled} />
              </div>
            </div>
            {isBlocklistEnabled && (
              <FieldGroup className="border-t border-zinc-950/10 pt-4 dark:border-white/10 space-y-4">
                <Field>
                  <Label>Identifiers</Label>
                  <Description>Enter a domain, email address, phone number, or Web3 wallet address to add it to the blocklist.</Description>
                </Field>
                <Field>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      placeholder="Enter phone, email, domain"
                      className="flex-grow"
                      value={newBlockedEmail}
                      onChange={handleBlockedEmailInputChange}
                      onKeyDown={handleBlockedEmailKeyDown}
                    />
                    <Button plain onClick={() => addEmailToBlocklist(newBlockedEmail)}>Add</Button>
                  </div>
                </Field>

                {blocklistedEmails.length > 0 && (
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-2">
                      {blocklistedEmails.map((email) => (
                        <span
                          key={email}
                          className="bg-gray-50 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center space-x-2 border border-gray-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700"
                        >
                          <span>{email}</span>
                          <button
                            onClick={() => removeEmailFromBlocklist(email)}
                            title="Remove identifier"
                            className="text-gray-600 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </FieldGroup>
            )}
          </section>

          <Divider soft />

          <Fieldset>
            <Legend>Restrictions</Legend>
            <Text>Specify restrictions for this application.</Text>
            <FieldGroup className="space-y-4">
              <Field>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Label>Block email subaddresses</Label>
                    <Description>
                      Prevent email addresses containing the characters +, =, or # from signing up or being added to existing accounts.                     </Description>
                  </div>
                  <Switch checked={blockSubaddresses} onChange={setBlockSubaddresses} className="ml-auto flex-shrink-0" />
                </div>
              </Field>

              <Field>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Label>Block sign-ups that use disposable email addresses</Label>
                    <Description>If enabled, all sign-up attempts using an email address from a disposable email domain will be rejected.</Description>
                  </div>
                  <Switch checked={blockDisposableEmails} onChange={setBlockDisposableEmails} className="ml-auto flex-shrink-0" />
                </div>
              </Field>
            </FieldGroup>
          </Fieldset>

          <Divider soft />

          <section className="grid gap-x-8 items-start">
            <Field>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Label>Country Restrictions</Label>
                  <Description>
                    Select countries to block sign-in and sign-up attempts.
                  </Description>
                </div>
                <Switch checked={isCountryRestrictionEnabled} onChange={setIsCountryRestrictionEnabled} id="country-restriction-toggle" />
              </div>
            </Field>
            {isCountryRestrictionEnabled && (
              <div className="flex justify-end -mt-4">
                <CountryBanSelector
                  selectedCountries={selectedCountries}
                  onCountriesChange={setSelectedCountries}
                />
              </div>
            )}
          </section>

          <Divider soft />

          <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-start">
            <Field>
              <Subheading>Banned Keywords</Subheading>
              <Text>Add keywords that will block usernames and emails.</Text>
            </Field>
            <Field>
              <div className="flex flex-col items-end space-y-2">
                <div className="flex items-center w-full max-w-xs">
                  <Input
                    type="text"
                    placeholder="Enter keyword"
                    className="flex-grow"
                    value={newKeyword}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                  />
                  <Button plain onClick={() => addKeyword(newKeyword)} className="ml-2 flex-shrink-0">Add</Button>
                </div>

                {bannedKeywords.length > 0 && (
                  <div className="w-full max-w-xs">
                    <div className="flex flex-wrap gap-2 justify-end">
                      {bannedKeywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="bg-gray-50 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center space-x-2 border border-gray-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700"
                        >
                          <span>{keyword}</span>
                          <button
                            onClick={() => removeKeyword(keyword)}
                            title="Remove keyword"
                            className="text-gray-600 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Field>
          </section>

          <Divider soft />

          <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-start">
            <Field>
              <Subheading>VOIP/ Virtual Number Restrictions</Subheading>
              <Text>Block specific number series associated with VOIP or virtual numbers.</Text>
            </Field>
            <Field>
              <div className="flex justify-end items-center">
                <Switch checked={enableVoipRestriction} onChange={setEnableVoipRestriction} />
              </div>
            </Field>
          </section>
        </div>
      </div>

      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 pl-[max(env(safe-area-inset-left),1.5rem)] pr-[max(env(safe-area-inset-right),1.5rem)] lg:pl-8 lg:pr-8">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              You have unsaved changes.
            </p>
            <div className="flex gap-3">
              <Button
                plain
                onClick={handleReset}
                disabled={isUpdatingRestrictions}
              >
                Discard
              </Button>
              <Button
                onClick={handleSave}
                disabled={isUpdatingRestrictions}
              >
                {isUpdatingRestrictions ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const COUNTRIES = [
  { name: "Afghanistan", code: "AF", dialCode: "+93", flag: "🇦🇫" },
  { name: "Albania", code: "AL", dialCode: "+355", flag: "🇦🇱" },
  { name: "Algeria", code: "DZ", dialCode: "+213", flag: "🇩🇿" },
  { name: "American Samoa", code: "AS", dialCode: "+1684", flag: "🇺🇸" },
  { name: "Andorra", code: "AD", dialCode: "+376", flag: "🇦🇩" },
  { name: "Angola", code: "AO", dialCode: "+244", flag: "🇦🇴" },
  { name: "Anguilla", code: "AI", dialCode: "+1264", flag: "🇦🇮" },
  { name: "Antarctica", code: "AQ", dialCode: "+672", flag: "🇦🇶" },
  { name: "Antigua and Barbuda", code: "AG", dialCode: "+1268", flag: "🇦🇬" },
  { name: "Argentina", code: "AR", dialCode: "+54", flag: "🇦🇷" },
  { name: "Armenia", code: "AM", dialCode: "+374", flag: "🇦🇲" },
  { name: "Aruba", code: "AW", dialCode: "+297", flag: "🇦🇼" },
  { name: "Australia", code: "AU", dialCode: "+61", flag: "🇦🇺" },
  { name: "Austria", code: "AT", dialCode: "+43", flag: "🇦🇹" },
  { name: "Azerbaijan", code: "AZ", dialCode: "+994", flag: "🇦🇿" },
  { name: "Bahamas", code: "BS", dialCode: "+1242", flag: "🇧🇸" },
  { name: "Bahrain", code: "BH", dialCode: "+973", flag: "🇧🇭" },
  { name: "Bangladesh", code: "BD", dialCode: "+880", flag: "🇧🇩" },
  { name: "Barbados", code: "BB", dialCode: "+1246", flag: "🇧🇧" },
  { name: "Belarus", code: "BY", dialCode: "+375", flag: "🇧🇾" },
  { name: "Belgium", code: "BE", dialCode: "+32", flag: "🇧🇪" },
  { name: "Belize", code: "BZ", dialCode: "+501", flag: "🇧🇿" },
  { name: "Benin", code: "BJ", dialCode: "+229", flag: "🇧🇯" },
  { name: "Bermuda", code: "BM", dialCode: "+1441", flag: "🇧🇲" },
  { name: "Bhutan", code: "BT", dialCode: "+975", flag: "🇧🇹" },
  { name: "Bolivia", code: "BO", dialCode: "+591", flag: "🇧🇴" },
  { name: "Bosnia and Herzegovina", code: "BA", dialCode: "+387", flag: "🇧🇦" },
  { name: "Botswana", code: "BW", dialCode: "+267", flag: "🇧🇼" },
  { name: "Brazil", code: "BR", dialCode: "+55", flag: "🇧🇷" },
  {
    name: "British Indian Ocean Territory",
    code: "IO",
    dialCode: "+246",
    flag: "🇮🇴",
  },
  { name: "British Virgin Islands", code: "VG", dialCode: "+1284", flag: "🇻🇬" },
  { name: "Brunei", code: "BN", dialCode: "+673", flag: "🇧🇳" },
  { name: "Bulgaria", code: "BG", dialCode: "+359", flag: "🇧🇬" },
  { name: "Burkina Faso", code: "BF", dialCode: "+226", flag: "🇧🇫" },
  { name: "Burundi", code: "BI", dialCode: "+257", flag: "🇧🇮" },
  { name: "Cambodia", code: "KH", dialCode: "+855", flag: "🇰🇭" },
  { name: "Cameroon", code: "CM", dialCode: "+237", flag: "🇨🇲" },
  { name: "Canada", code: "CA", dialCode: "+1", flag: "🇨🇦" },
  { name: "Cape Verde", code: "CV", dialCode: "+238", flag: "🇨🇻" },
  { name: "Cayman Islands", code: "KY", dialCode: "+1345", flag: "🇰🇾" },
  {
    name: "Central African Republic",
    code: "CF",
    dialCode: "+236",
    flag: "🇨🇫",
  },
  { name: "Chad", code: "TD", dialCode: "+235", flag: "🇹🇩" },
  { name: "Chile", code: "CL", dialCode: "+56", flag: "🇨🇱" },
  { name: "China", code: "CN", dialCode: "+86", flag: "🇨🇳" },
  { name: "Christmas Island", code: "CX", dialCode: "+61", flag: "🇨🇽" },
  { name: "Cocos Islands", code: "CC", dialCode: "+61", flag: "🇨🇨" },
  { name: "Colombia", code: "CO", dialCode: "+57", flag: "🇨🇴" },
  { name: "Comoros", code: "KM", dialCode: "+269", flag: "🇰🇲" },
  { name: "Cook Islands", code: "CK", dialCode: "+682", flag: "🇨🇰" },
  { name: "Costa Rica", code: "CR", dialCode: "+506", flag: "🇨🇷" },
  { name: "Croatia", code: "HR", dialCode: "+385", flag: "🇭🇷" },
  { name: "Cuba", code: "CU", dialCode: "+53", flag: "🇨🇺" },
  { name: "Curacao", code: "CW", dialCode: "+599", flag: "🇨🇼" },
  { name: "Cyprus", code: "CY", dialCode: "+357", flag: "🇨🇾" },
  { name: "Czech Republic", code: "CZ", dialCode: "+420", flag: "🇨🇿" },
  {
    name: "Democratic Republic of the Congo",
    code: "CD",
    dialCode: "+243",
    flag: "🇨🇩",
  },
  { name: "Denmark", code: "DK", dialCode: "+45", flag: "🇩🇰" },
  { name: "Djibouti", code: "DJ", dialCode: "+253", flag: "🇩🇯" },
  { name: "Dominica", code: "DM", dialCode: "+1767", flag: "🇩🇲" },
  { name: "Dominican Republic", code: "DO", dialCode: "+1849", flag: "🇩🇴" },
  { name: "East Timor", code: "TL", dialCode: "+670", flag: "🇹🇱" },
  { name: "Ecuador", code: "EC", dialCode: "+593", flag: "🇪🇨" },
  { name: "Egypt", code: "EG", dialCode: "+20", flag: "🇪🇬" },
  { name: "El Salvador", code: "SV", dialCode: "+503", flag: "🇸🇻" },
  { name: "Equatorial Guinea", code: "GQ", dialCode: "+240", flag: "🇬🇶" },
  { name: "Eritrea", code: "ER", dialCode: "+291", flag: "🇪🇷" },
  { name: "Estonia", code: "EE", dialCode: "+372", flag: "🇪🇪" },
  { name: "Ethiopia", code: "ET", dialCode: "+251", flag: "🇪🇹" },
  { name: "Falkland Islands", code: "FK", dialCode: "+500", flag: "🇫🇰" },
  { name: "Faroe Islands", code: "FO", dialCode: "+298", flag: "🇫🇴" },
  { name: "Fiji", code: "FJ", dialCode: "+679", flag: "🇫🇯" },
  { name: "Finland", code: "FI", dialCode: "+358", flag: "🇫🇮" },
  { name: "France", code: "FR", dialCode: "+33", flag: "🇫🇷" },
  { name: "French Polynesia", code: "PF", dialCode: "+689", flag: "🇵🇫" },
  { name: "Gabon", code: "GA", dialCode: "+241", flag: "🇬🇦" },
  { name: "Gambia", code: "GM", dialCode: "+220", flag: "🇬🇲" },
  { name: "Georgia", code: "GE", dialCode: "+995", flag: "🇬🇪" },
  { name: "Germany", code: "DE", dialCode: "+49", flag: "🇩🇪" },
  { name: "Ghana", code: "GH", dialCode: "+233", flag: "🇬🇭" },
  { name: "Gibraltar", code: "GI", dialCode: "+350", flag: "🇬🇮" },
  { name: "Greece", code: "GR", dialCode: "+30", flag: "🇬🇷" },
  { name: "Greenland", code: "GL", dialCode: "+299", flag: "🇬🇱" },
  { name: "Grenada", code: "GD", dialCode: "+1473", flag: "🇬🇩" },
  { name: "Guam", code: "GU", dialCode: "+1671", flag: "🇬🇺" },
  { name: "Guatemala", code: "GT", dialCode: "+502", flag: "🇬🇹" },
  { name: "Guernsey", code: "GG", dialCode: "+44", flag: "🇬🇬" },
  { name: "Guinea", code: "GN", dialCode: "+224", flag: "🇬🇳" },
  { name: "Guinea-Bissau", code: "GW", dialCode: "+245", flag: "🇬🇼" },
  { name: "Guyana", code: "GY", dialCode: "+592", flag: "🇬🇾" },
  { name: "Haiti", code: "HT", dialCode: "+509", flag: "🇭🇹" },
  { name: "Honduras", code: "HN", dialCode: "+504", flag: "🇭🇳" },
  { name: "Hong Kong", code: "HK", dialCode: "+852", flag: "🇭🇰" },
  { name: "Hungary", code: "HU", dialCode: "+36", flag: "🇭🇺" },
  { name: "Iceland", code: "IS", dialCode: "+354", flag: "🇮🇸" },
  { name: "India", code: "IN", dialCode: "+91", flag: "🇮🇳" },
  { name: "Indonesia", code: "ID", dialCode: "+62", flag: "🇮🇩" },
  { name: "Iran", code: "IR", dialCode: "+98", flag: "🇮🇷" },
  { name: "Iraq", code: "IQ", dialCode: "+964", flag: "🇮🇶" },
  { name: "Ireland", code: "IE", dialCode: "+353", flag: "🇮🇪" },
  { name: "Isle of Man", code: "IM", dialCode: "+44", flag: "🇮🇲" },
  { name: "Israel", code: "IL", dialCode: "+972", flag: "🇮🇱" },
  { name: "Italy", code: "IT", dialCode: "+39", flag: "🇮🇹" },
  { name: "Ivory Coast", code: "CI", dialCode: "+225", flag: "🇨🇮" },
  { name: "Jamaica", code: "JM", dialCode: "+1876", flag: "🇯🇲" },
  { name: "Japan", code: "JP", dialCode: "+81", flag: "🇯🇵" },
  { name: "Jersey", code: "JE", dialCode: "+44", flag: "🇬🇬" },
  { name: "Jordan", code: "JO", dialCode: "+962", flag: "🇯🇴" },
  { name: "Kazakhstan", code: "KZ", dialCode: "+7", flag: "🇰🇿" },
  { name: "Kenya", code: "KE", dialCode: "+254", flag: "🇰🇪" },
  { name: "Kiribati", code: "KI", dialCode: "+686", flag: "🇰🇮" },
  { name: "Kosovo", code: "XK", dialCode: "+383", flag: "🇽🇰" },
  { name: "Kuwait", code: "KW", dialCode: "+965", flag: "🇰🇼" },
  { name: "Kyrgyzstan", code: "KG", dialCode: "+996", flag: "🇰🇬" },
  { name: "Laos", code: "LA", dialCode: "+856", flag: "🇱🇦" },
  { name: "Latvia", code: "LV", dialCode: "+371", flag: "🇱🇻" },
  { name: "Lebanon", code: "LB", dialCode: "+961", flag: "🇱🇧" },
  { name: "Lesotho", code: "LS", dialCode: "+266", flag: "🇱🇸" },
  { name: "Liberia", code: "LR", dialCode: "+231", flag: "🇱🇷" },
  { name: "Libya", code: "LY", dialCode: "+218", flag: "🇱🇾" },
  { name: "Liechtenstein", code: "LI", dialCode: "+423", flag: "🇱🇮" },
  { name: "Lithuania", code: "LT", dialCode: "+370", flag: "🇱🇹" },
  { name: "Luxembourg", code: "LU", dialCode: "+352", flag: "🇱🇺" },
  { name: "Macau", code: "MO", dialCode: "+853", flag: "🇲🇴" },
  { name: "Macedonia", code: "MK", dialCode: "+389", flag: "🇲🇰" },
  { name: "Madagascar", code: "MG", dialCode: "+261", flag: "🇲🇬" },
  { name: "Malawi", code: "MW", dialCode: "+265", flag: "🇲🇼" },
  { name: "Malaysia", code: "MY", dialCode: "+60", flag: "🇲🇾" },
  { name: "Maldives", code: "MV", dialCode: "+960", flag: "🇲🇻" },
  { name: "Mali", code: "ML", dialCode: "+223", flag: "🇲🇱" },
  { name: "Malta", code: "MT", dialCode: "+356", flag: "🇲🇹" },
  { name: "Marshall Islands", code: "MH", dialCode: "+692", flag: "🇲🇭" },
  { name: "Mauritania", code: "MR", dialCode: "+222", flag: "🇲🇷" },
  { name: "Mauritius", code: "MU", dialCode: "+230", flag: "🇲🇺" },
  { name: "Mayotte", code: "YT", dialCode: "+262", flag: "🇾🇹" },
  { name: "Mexico", code: "MX", dialCode: "+52", flag: "🇲🇽" },
  { name: "Micronesia", code: "FM", dialCode: "+691", flag: "🇫🇲" },
  { name: "Moldova", code: "MD", dialCode: "+373", flag: "🇲🇩" },
  { name: "Monaco", code: "MC", dialCode: "+377", flag: "🇲🇨" },
  { name: "Mongolia", code: "MN", dialCode: "+976", flag: "🇲🇳" },
  { name: "Montenegro", code: "ME", dialCode: "+382", flag: "🇲🇪" },
  { name: "Montserrat", code: "MS", dialCode: "+1664", flag: "🇲🇸" },
  { name: "Morocco", code: "MA", dialCode: "+212", flag: "🇲🇦" },
  { name: "Mozambique", code: "MZ", dialCode: "+258", flag: "🇲🇿" },
  { name: "Myanmar", code: "MM", dialCode: "+95", flag: "🇲🇲" },
  { name: "Namibia", code: "NA", dialCode: "+264", flag: "🇳🇦" },
  { name: "Nauru", code: "NR", dialCode: "+674", flag: "🇳🇷" },
  { name: "Nepal", code: "NP", dialCode: "+977", flag: "🇳🇵" },
  { name: "Netherlands", code: "NL", dialCode: "+31", flag: "🇳🇱" },
  { name: "Netherlands Antilles", code: "AN", dialCode: "+599", flag: "🇳🇱" },
  { name: "New Caledonia", code: "NC", dialCode: "+687", flag: "🇳🇨" },
  { name: "New Zealand", code: "NZ", dialCode: "+64", flag: "🇳🇿" },
  { name: "Nicaragua", code: "NI", dialCode: "+505", flag: "🇳🇮" },
  { name: "Niger", code: "NE", dialCode: "+227", flag: "🇳🇪" },
  { name: "Nigeria", code: "NG", dialCode: "+234", flag: "🇳🇬" },
  { name: "Niue", code: "NU", dialCode: "+683", flag: "🇳🇺" },
  { name: "North Korea", code: "KP", dialCode: "+850", flag: "🇰🇵" },
  {
    name: "Northern Mariana Islands",
    code: "MP",
    dialCode: "+1670",
    flag: "🇲🇵",
  },
  { name: "Norway", code: "NO", dialCode: "+47", flag: "🇳🇴" },
  { name: "Oman", code: "OM", dialCode: "+968", flag: "🇴🇲" },
  { name: "Pakistan", code: "PK", dialCode: "+92", flag: "🇵🇰" },
  { name: "Palau", code: "PW", dialCode: "+680", flag: "🇵🇼" },
  { name: "Palestine", code: "PS", dialCode: "+970", flag: "🇵🇸" },
  { name: "Panama", code: "PA", dialCode: "+507", flag: "🇵🇦" },
  { name: "Papua New Guinea", code: "PG", dialCode: "+675", flag: "🇵🇬" },
  { name: "Paraguay", code: "PY", dialCode: "+595", flag: "🇵🇾" },
  { name: "Peru", code: "PE", dialCode: "+51", flag: "🇵🇪" },
  { name: "Philippines", code: "PH", dialCode: "+63", flag: "🇵🇭" },
  { name: "Pitcairn", code: "PN", dialCode: "+64", flag: "🇵🇳" },
  { name: "Poland", code: "PL", dialCode: "+48", flag: "🇵🇱" },
  { name: "Portugal", code: "PT", dialCode: "+351", flag: "🇵🇹" },
  { name: "Puerto Rico", code: "PR", dialCode: "+1939", flag: "🇵🇷" },
  { name: "Qatar", code: "QA", dialCode: "+974", flag: "🇶🇦" },
  { name: "Republic of the Congo", code: "CG", dialCode: "+242", flag: "🇨🇬" },
  { name: "Reunion", code: "RE", dialCode: "+262", flag: "🇷🇪" },
  { name: "Romania", code: "RO", dialCode: "+40", flag: "🇷🇴" },
  { name: "Russia", code: "RU", dialCode: "+7", flag: "🇷🇺" },
  { name: "Rwanda", code: "RW", dialCode: "+250", flag: "🇷🇼" },
  { name: "Saint Barthelemy", code: "BL", dialCode: "+590", flag: "🇧🇱" },
  { name: "Saint Helena", code: "SH", dialCode: "+290", flag: "🇸🇭" },
  { name: "Saint Kitts and Nevis", code: "KN", dialCode: "+1869", flag: "🇰🇳" },
  { name: "Saint Lucia", code: "LC", dialCode: "+1758", flag: "🇱🇨" },
  { name: "Saint Martin", code: "MF", dialCode: "+590", flag: "🇲🇫" },
  {
    name: "Saint Pierre and Miquelon",
    code: "PM",
    dialCode: "+508",
    flag: "🇵🇲",
  },
  {
    name: "Saint Vincent and the Grenadines",
    code: "VC",
    dialCode: "+1784",
    flag: "🇻🇨",
  },
  { name: "Samoa", code: "WS", dialCode: "+685", flag: "🇼🇸" },
  { name: "San Marino", code: "SM", dialCode: "+378", flag: "🇸🇲" },
  { name: "Sao Tome and Principe", code: "ST", dialCode: "+239", flag: "🇸🇹" },
  { name: "Saudi Arabia", code: "SA", dialCode: "+966", flag: "🇸🇦" },
  { name: "Senegal", code: "SN", dialCode: "+221", flag: "🇸🇳" },
  { name: "Serbia", code: "RS", dialCode: "+381", flag: "🇷🇸" },
  { name: "Seychelles", code: "SC", dialCode: "+248", flag: "🇸🇨" },
  { name: "Sierra Leone", code: "SL", dialCode: "+232", flag: "🇸🇱" },
  { name: "Singapore", code: "SG", dialCode: "+65", flag: "🇸🇬" },
  { name: "Sint Maarten", code: "SX", dialCode: "+1721", flag: "🇸🇽" },
  { name: "Slovakia", code: "SK", dialCode: "+421", flag: "🇸🇰" },
  { name: "Slovenia", code: "SI", dialCode: "+386", flag: "🇸🇮" },
  { name: "Solomon Islands", code: "SB", dialCode: "+677", flag: "🇸🇧" },
  { name: "Somalia", code: "SO", dialCode: "+252", flag: "🇸🇴" },
  { name: "South Africa", code: "ZA", dialCode: "+27", flag: "🇿🇦" },
  { name: "South Korea", code: "KR", dialCode: "+82", flag: "🇰🇷" },
  { name: "South Sudan", code: "SS", dialCode: "+211", flag: "🇸🇸" },
  { name: "Spain", code: "ES", dialCode: "+34", flag: "🇪🇸" },
  { name: "Sri Lanka", code: "LK", dialCode: "+94", flag: "🇱🇰" },
  { name: "Sudan", code: "SD", dialCode: "+249", flag: "🇸🇩" },
  { name: "Suriname", code: "SR", dialCode: "+597", flag: "🇸🇷" },
  { name: "Svalbard and Jan Mayen", code: "SJ", dialCode: "+47", flag: "🇸🇯" },
  { name: "Swaziland", code: "SZ", dialCode: "+268", flag: "🇸🇿" },
  { name: "Sweden", code: "SE", dialCode: "+46", flag: "🇸🇪" },
  { name: "Switzerland", code: "CH", dialCode: "+41", flag: "🇨🇭" },
  { name: "Syria", code: "SY", dialCode: "+963", flag: "🇸🇾" },
  { name: "Taiwan", code: "TW", dialCode: "+886", flag: "🇹🇼" },
  { name: "Tajikistan", code: "TJ", dialCode: "+992", flag: "🇹🇯" },
  { name: "Tanzania", code: "TZ", dialCode: "+255", flag: "🇹🇿" },
  { name: "Thailand", code: "TH", dialCode: "+66", flag: "🇹🇭" },
  { name: "Togo", code: "TG", dialCode: "+228", flag: "🇹🇬" },
  { name: "Tokelau", code: "TK", dialCode: "+690", flag: "🇹🇰" },
  { name: "Tonga", code: "TO", dialCode: "+676", flag: "🇹🇴" },
  { name: "Trinidad and Tobago", code: "TT", dialCode: "+1868", flag: "🇹🇹" },
  { name: "Tunisia", code: "TN", dialCode: "+216", flag: "🇹🇳" },
  { name: "Turkey", code: "TR", dialCode: "+90", flag: "🇹🇷" },
  { name: "Turkmenistan", code: "TM", dialCode: "+993", flag: "🇹🇲" },
  {
    name: "Turks and Caicos Islands",
    code: "TC",
    dialCode: "+1649",
    flag: "🇹🇨",
  },
  { name: "Tuvalu", code: "TV", dialCode: "+688", flag: "🇹🇻" },
  { name: "U.S. Virgin Islands", code: "VI", dialCode: "+1340", flag: "🇻🇮" },
  { name: "Uganda", code: "UG", dialCode: "+256", flag: "🇺🇬" },
  { name: "Ukraine", code: "UA", dialCode: "+380", flag: "🇺🇦" },
  { name: "United Arab Emirates", code: "AE", dialCode: "+971", flag: "🇦🇪" },
  { name: "United Kingdom", code: "GB", dialCode: "+44", flag: "🇬🇧" },
  { name: "United States", code: "US", dialCode: "+1", flag: "🇺🇸" },
  { name: "Uruguay", code: "UY", dialCode: "+598", flag: "🇺🇾" },
  { name: "Uzbekistan", code: "UZ", dialCode: "+998", flag: "🇺🇿" },
  { name: "Vanuatu", code: "VU", dialCode: "+678", flag: "🇻🇺" },
  { name: "Vatican", code: "VA", dialCode: "+379", flag: "🇻🇦" },
  { name: "Venezuela", code: "VE", dialCode: "+58", flag: "🇻🇪" },
  { name: "Vietnam", code: "VN", dialCode: "+84", flag: "🇻🇳" },
  { name: "Wallis and Futuna", code: "WF", dialCode: "+681", flag: "🇼🇫" },
  { name: "Western Sahara", code: "EH", dialCode: "+212", flag: "🇪🇭" },
  { name: "Yemen", code: "YE", dialCode: "+967", flag: "🇾🇪" },
  { name: "Zambia", code: "ZM", dialCode: "+260", flag: "🇿🇲" },
  { name: "Zimbabwe", code: "ZW", dialCode: "+263", flag: "🇿🇼" },
];

interface CountryBanSelectorProps {
  selectedCountries: string[];
  onCountriesChange: (value: React.SetStateAction<string[]>) => void;
}

export function CountryBanSelector({ selectedCountries, onCountriesChange }: CountryBanSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCountryToggle = (code: string) => {
    onCountriesChange(prev =>
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const removeCountry = (code: string) => {
    onCountriesChange(prev => prev.filter(c => c !== code));
  };

  return (
    <div className="relative w-full max-w-xs" ref={dropdownRef}>
      <div className="relative">
        <div
          className="w-full rounded-md border border-zinc-950/10 bg-white py-1.5 px-3 text-zinc-950 sm:text-sm/6 dark:border-white/10 dark:bg-zinc-900 dark:text-white data-[focus]:border-blue-500 data-[focus]:outline-none data-[focus]:ring-1 data-[focus]:ring-blue-500"
          tabIndex={0}
        >
          <input
            type="text"
            className="w-full bg-transparent focus:outline-none placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
            placeholder={selectedCountries.length > 0 ? `${selectedCountries.length} countries selected` : "Search countries..."}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              setIsOpen(true);
            }}
          />
        </div>

        {isOpen && (
          <div
            id="country-listbox"
            role="listbox"
            className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto dark:bg-zinc-800 dark:border-zinc-700">
            {filteredCountries.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500 dark:text-zinc-400">No countries found</div>
            ) : (
              filteredCountries.map(country => (
                <button
                  key={country.code}
                  role="option"
                  aria-selected={selectedCountries.includes(country.code)}
                  onClick={(e) => {
                    e.preventDefault();
                    handleCountryToggle(country.code);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center justify-between
                    ${selectedCountries.includes(country.code) ? 'bg-indigo-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-700 dark:text-zinc-200'}`}
                >
                  <div className="flex items-center gap-2">
                    <span>{country.flag}</span>
                    <span>{country.name}</span>
                  </div>
                  {selectedCountries.includes(country.code) && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-blue-600 dark:text-blue-500">
                      <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.35 2.35 4.493-6.74a.75.75 0 0 1 1.04-.208Z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {selectedCountries.map(code => {
          const country = COUNTRIES.find(c => c.code === code);
          return (
            <span
              key={code}
              className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs flex items-center space-x-1.5 dark:bg-zinc-700 dark:text-zinc-200"
            >
              <span>{country?.flag}</span>
              <span className="truncate">{country?.name}</span>
              <button
                onClick={() => removeCountry(code)}
                className="text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                aria-label={`Remove ${country?.name}`}
              >
                <TrashIcon className="w-3 h-3" />
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}
