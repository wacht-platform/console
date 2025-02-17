import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Heading, Subheading } from "@/components/ui/heading";
import { Switch } from "@/components/ui/switch";
import { Strong, Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { TrashIcon } from "@heroicons/react/24/outline";

export default function RestrictionsPage() {

  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [bannedKeywords, setBannedKeywords] = useState<string[]>([]);
  const [blockedNumbers, setBlockedNumbers] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [newNumber, setNewNumber] = useState('');

  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'IN', name: 'India' },
    { code: 'CA', name: 'Canada' },
  ];

  const handleCountryToggle = (code: string) => {
    setSelectedCountries(prev =>
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const removeBlockedNumber = (number: string) => {
    setBlockedNumbers(prev => prev.filter(n => n !== number));
  };

  const addKeyword = () => {
    if (newKeyword && !bannedKeywords.includes(newKeyword)) {
      setBannedKeywords([...bannedKeywords, newKeyword]);
      setNewKeyword('');
    }
  };

  const addBlockedNumber = () => {
    if (newNumber && !blockedNumbers.includes(newNumber)) {
      setBlockedNumbers([...blockedNumbers, newNumber]);
      setNewNumber('');
    }
  };



  return (
    <div className="flex flex-col gap-6 p-6">
      <Heading>Restrictions</Heading>
      <div className="mt-8 space-y-10">

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <Subheading>VOIP/ Virtual Number Restrictions</Subheading>
            <Text>Block specific number series associated with VOIP or virtual numbers.</Text>
          </div>
          <div className="flex justify-end items-center gap-3">
            <Input type="text" placeholder="Enter number series (eg. +1 888)" size={29} value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)} />
            <Button onClick={addBlockedNumber}>Add</Button>
          </div>

          <div className="col-span-2">

            {blockedNumbers.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg shadow">
                <Subheading>Blocked Numbers</Subheading>
                <div className="flex flex-wrap gap-2 mt-2">
                  {blockedNumbers.map((number) => (
                    <span
                      key={number}
                      className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm flex items-center space-x-2"
                    >
                      <span>{number}</span>
                      <Button
                        outline
                        onClick={() => setBlockedNumbers(blockedNumbers.filter(n => n !== number))}
                        className="w-6 h-6 p-1 rounded-full hover:bg-gray-300"
                        title="Remove number"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <Divider soft />

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <Subheading>Banned Keywords</Subheading>
            <Text>Add keywords that will blocked the username and e-mails</Text>
          </div>
          <div className="flex justify-end items-center gap-3">
            <Input type="text" placeholder="Enter keywords" size={29} value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)} />
            <Button onClick={addKeyword}>Add</Button>
          </div>

          <div className="col-span-2">

            {bannedKeywords.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg shadow">
                <Subheading>Blocked Numbers</Subheading>
                <div className="flex flex-wrap gap-2 mt-2">
                  {bannedKeywords.map(keyword => (
                    <span
                      key={keyword}
                      className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm flex items-center space-x-2"
                    >
                      <span>{keyword}</span>
                      <Button
                        outline
                        onClick={() => setBannedKeywords(bannedKeywords.filter(k => k !== keyword))}
                        className="w-6 h-6 p-1 rounded-full hover:bg-gray-300"
                        title="Remove number"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <Divider soft />

        <section className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium">Block Special Characters in Email</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Prevent email addresses that contain the characters +, = or # from signing up or being added to existing accounts.
                e.g., user+sub@clerk.com will be blocked.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button plain type="button">
                <Switch />
              </Button>
            </div>
          </div>
        </section>

      </div>

    </div>
  );
}
