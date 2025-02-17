import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Heading, Subheading } from "@/components/ui/heading";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { ChevronDownIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function RestrictionsPage() {

  const [bannedKeywords, setBannedKeywords] = useState<string[]>([]);
  const [blockedNumbers, setBlockedNumbers] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);


  const addKeyword = (keyword: string) => {
    const trimmedKeyword = keyword.trim();
    if (trimmedKeyword && !bannedKeywords.includes(trimmedKeyword)) {
      setBannedKeywords([...bannedKeywords, trimmedKeyword]);
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


  return (
    <div className="flex flex-col gap-6 p-6">
      <Heading>Restrictions</Heading>
      <div className="mt-8 space-y-10">

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 ">
          <div className="space-y-1">
            <Subheading>Country Restrictions</Subheading>
            <Text>Select countries to block sign-in and sign-up attempts.</Text>
          </div>
          <div className="flex justify-end items-center gap-3">
            <CountryBanSelector
              selectedCountries={selectedCountries}
              onCountriesChange={setSelectedCountries}
            />
          </div>
        </section>

        <Divider soft />

        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
          <div className="space-y-1">
            <Subheading>Banned Keywords</Subheading>
            <Text>Add keywords that will block usernames and emails.</Text>
          </div>

          <div className="flex justify-end items-center px-8">
            <Input
              type="text"
              placeholder="Enter keyword"
              size={29}
              value={newKeyword}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />

            {bannedKeywords.length > 0 && (
              <div className="col-span-2 mx-2 mt-2">
                <div className="mb-2 flex flex-wrap gap-2">
                  {bannedKeywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="bg-gray-50 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center space-x-2 border border-gray-200"
                    >
                      <span>{keyword}</span>
                      <button
                        onClick={() =>
                          setBannedKeywords(bannedKeywords.filter((k) => k !== keyword))
                        }
                        title="Remove keyword"
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
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
            <Subheading>VOIP/ Virtual Number Restrictions</Subheading>
            <Text>Block specific number series associated with VOIP or virtual numbers.</Text>
          </div>

          <div>
            <div className="flex justify-end items-center gap-3 py-2">
              <Switch />
            </div>

            {blockedNumbers.length > 0 && (
              <div className="col-span-2 mx-2">
                <div className="mb-2 flex flex-wrap gap-2">
                  {blockedNumbers.map((number) => (
                    <span
                      key={number}
                      className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm flex items-center space-x-2 border border-indigo-200"
                    >
                      <span>{number}</span>
                      <button
                        onClick={() => setBlockedNumbers(blockedNumbers.filter(n => n !== number))}
                        title="Remove number"
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
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
              <Subheading className="text-sm font-medium">Block Special Characters in Email</Subheading>
              <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                Prevent email addresses that contain the characters +, = or # from signing up or being added to existing accounts.
                e.g., user+sub@clerk.com will be blocked.
              </Text>
            </div>
            <div className="flex items-center gap-2">
              <Button plain type="button">
                <Switch />
              </Button>
            </div>
          </div>
        </section>

        <Divider soft />

      </div>

    </div>
  );
}

const COUNTRIES = [
  { code: 'AF', name: 'Afghanistan' },
  { code: 'AL', name: 'Albania' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'AD', name: 'Andorra' },
  { code: 'AO', name: 'Angola' },
  { code: 'AR', name: 'Argentina' },
  { code: 'AM', name: 'Armenia' },
  { code: 'AU', name: 'Australia' },
  { code: 'AT', name: 'Austria' },
  { code: 'AZ', name: 'Azerbaijan' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'BY', name: 'Belarus' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BZ', name: 'Belize' },
  { code: 'BJ', name: 'Benin' },
  { code: 'BT', name: 'Bhutan' },
  { code: 'BO', name: 'Bolivia' },
  { code: 'BA', name: 'Bosnia and Herzegovina' },
  { code: 'BW', name: 'Botswana' },
  { code: 'BR', name: 'Brazil' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'BI', name: 'Burundi' },
  { code: 'KH', name: 'Cambodia' },
  { code: 'CM', name: 'Cameroon' },
  { code: 'CA', name: 'Canada' },
  { code: 'CF', name: 'Central African Republic' },
  { code: 'TD', name: 'Chad' },
  { code: 'CL', name: 'Chile' },
  { code: 'CN', name: 'China' },
  { code: 'CO', name: 'Colombia' },
  { code: 'CG', name: 'Congo' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'HR', name: 'Croatia' },
  { code: 'CU', name: 'Cuba' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' },
  { code: 'DJ', name: 'Djibouti' },
  { code: 'DO', name: 'Dominican Republic' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'EG', name: 'Egypt' },
  { code: 'SV', name: 'El Salvador' },
  { code: 'EE', name: 'Estonia' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'GA', name: 'Gabon' },
  { code: 'GM', name: 'Gambia' },
  { code: 'GE', name: 'Georgia' },
  { code: 'DE', name: 'Germany' },
  { code: 'GH', name: 'Ghana' },
  { code: 'GR', name: 'Greece' },
  { code: 'GT', name: 'Guatemala' },
  { code: 'GN', name: 'Guinea' },
  { code: 'HT', name: 'Haiti' },
  { code: 'HN', name: 'Honduras' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IS', name: 'Iceland' },
  { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'IR', name: 'Iran' },
  { code: 'IQ', name: 'Iraq' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'JO', name: 'Jordan' },
  { code: 'KZ', name: 'Kazakhstan' },
  { code: 'KE', name: 'Kenya' },
  { code: 'KP', name: 'North Korea' },
  { code: 'KR', name: 'South Korea' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LB', name: 'Lebanon' },
  { code: 'LY', name: 'Libya' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MG', name: 'Madagascar' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'MX', name: 'Mexico' },
  { code: 'MA', name: 'Morocco' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'NO', name: 'Norway' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'PH', name: 'Philippines' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'QA', name: 'Qatar' },
  { code: 'RO', name: 'Romania' },
  { code: 'RU', name: 'Russia' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'TH', name: 'Thailand' },
  { code: 'TR', name: 'Turkey' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'VN', name: 'Vietnam' }
].sort((a, b) => a.name.localeCompare(b.name));

interface CountryBanSelectorProps {
  selectedCountries: string[];
  onCountriesChange: (countries: string[]) => void;
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
    const newSelection = selectedCountries.includes(code)
      ? selectedCountries.filter(c => c !== code)
      : [...selectedCountries, code];
    onCountriesChange(newSelection);
  };

  const removeCountry = (code: string) => {
    onCountriesChange(selectedCountries.filter(c => c !== code));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <div
          className="w-full  rounded-lg py-2 flex items-center "
          onClick={() => setIsOpen(!isOpen)}
        >
          <Input
            type="text"
            size={29}
            placeholder="Search countries..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
          />
          <ChevronDownIcon className={`w-5 h-5 ml-4 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
        </div>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredCountries.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500">No countries found</div>
            ) : (
              filteredCountries.map(country => (
                <button
                  key={country.code}
                  onClick={() => handleCountryToggle(country.code)}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between
                    ${selectedCountries.includes(country.code) ? 'bg-indigo-50 text-blue-700' : 'text-gray-700'}`}
                >
                  <span>{country.name}</span>
                  {selectedCountries.includes(country.code) && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      <div className="mb-2 flex flex-wrap gap-2">
        {selectedCountries.map(code => {
          const country = COUNTRIES.find(c => c.code === code);
          return (
            <span
              key={code}
              className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center space-x-1"
            >
              <span>{country?.name}</span>
              <button
                onClick={() => removeCountry(code)}
                className="text-gray-600 hover:text-gray-800"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}
