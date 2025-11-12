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
      <MenuButton className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900 group">
        {currentTheme && (
          <>
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-500/10 dark:to-indigo-500/5 text-indigo-600 dark:text-indigo-400 group-hover:from-indigo-100 group-hover:to-indigo-200 dark:group-hover:from-indigo-500/20 dark:group-hover:to-indigo-500/10 transition-all duration-200">
              <currentTheme.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Theme
              </div>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {currentTheme.label}
              </div>
            </div>
            <svg
              className="h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 group-hover:text-gray-600 dark:group-hover:text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
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
            Choose Theme
          </div>
          {themes.map((themeOption) => (
            <MenuItem key={themeOption.value}>
              {({ active }) => (
                <button
                  onClick={() => setTheme(themeOption.value)}
                  className={clsx(
                    "flex w-full items-center gap-3 px-3 py-2.5 mx-1 text-sm rounded-lg transition-all duration-150",
                    active
                      ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                      : "text-neutral-700 dark:text-neutral-300",
                    theme === themeOption.value && "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium"
                  )}
                >
                  <div className={clsx(
                    "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                    theme === themeOption.value
                      ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                  )}>
                    <themeOption.icon className="h-4 w-4" />
                  </div>
                  <span className="flex-1 text-left">{themeOption.label}</span>
                  {theme === themeOption.value && (
                    <div className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                  )}
                </button>
              )}
            </MenuItem>
          ))}
        </MenuItems>
      </Transition>
    </Menu>
  );
}