import { Fragment } from "react";
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from "@headlessui/react";
import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "@/lib/providers/theme";
import clsx from "clsx";

const themes = [
  {
    value: "light" as const,
    label: "Light",
    icon: SunIcon,
  },
  {
    value: "dark" as const,
    label: "Dark", 
    icon: MoonIcon,
  },
  {
    value: "system" as const,
    label: "System",
    icon: ComputerDesktopIcon,
  },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const currentTheme = themes.find(t => t.value === theme);

  return (
    <Menu as="div" className="relative w-full">
      <MenuButton className="flex items-center gap-x-3 w-full px-2 py-2 rounded-lg text-gray-800 dark:text-gray-300 hover:bg-gray-50/70 hover:text-gray-900 dark:hover:bg-gray-800/50 dark:hover:text-gray-200 transition-all duration-150 focus:outline-none group">
        {currentTheme && (
          <>
            <currentTheme.icon className="size-5 shrink-0 text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400 transition-colors duration-150" />
            <span className="text-sm font-normal flex-1 text-left">{currentTheme.label}</span>
          </>
        )}
      </MenuButton>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-150"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems className="absolute bottom-full left-0 right-0 z-50 mb-2 w-full origin-bottom rounded-xl bg-white dark:bg-neutral-900 py-2 shadow-lg ring-1 ring-neutral-200 dark:ring-neutral-700 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-700/50 focus:outline-none">
          <div className="px-3 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
            Theme
          </div>
          {themes.map((themeOption) => (
            <MenuItem key={themeOption.value}>
              {({ active }) => (
                <button
                  onClick={() => setTheme(themeOption.value)}
                  className={clsx(
                    "flex w-full items-center gap-x-3 px-3 py-2 mx-1 text-sm rounded-lg transition-all duration-150",
                    active
                      ? "bg-gray-50/70 text-gray-900 dark:bg-gray-800/50 dark:text-gray-200"
                      : "text-gray-800 dark:text-gray-300",
                    theme === themeOption.value && "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 font-normal"
                  )}
                >
                  <themeOption.icon className={clsx(
                    "size-5 shrink-0 transition-colors duration-150",
                    theme === themeOption.value
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-gray-400 dark:text-gray-500"
                  )} />
                  <span className="flex-1 text-left">{themeOption.label}</span>
                </button>
              )}
            </MenuItem>
          ))}
        </MenuItems>
      </Transition>
    </Menu>
  );
}