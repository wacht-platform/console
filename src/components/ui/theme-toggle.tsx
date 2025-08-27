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
    <Menu as="div" className="relative">
      <MenuButton className="flex items-center justify-center w-8 h-8 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-neutral-900">
        {currentTheme && (
          <currentTheme.icon className="h-4 w-4" />
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
        <MenuItems className="absolute right-0 z-50 mt-2 w-44 origin-top-right rounded-xl bg-white dark:bg-neutral-900 py-2 shadow-lg ring-1 ring-neutral-200 dark:ring-neutral-700 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-700/50 focus:outline-none">
          <div className="px-3 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
            Theme
          </div>
          {themes.map((themeOption) => (
            <MenuItem key={themeOption.value}>
              {({ active }) => (
                <button
                  onClick={() => setTheme(themeOption.value)}
                  className={clsx(
                    "flex w-full items-center gap-3 px-3 py-2 mx-1 text-sm rounded-lg transition-all duration-150",
                    active
                      ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                      : "text-neutral-700 dark:text-neutral-300",
                    theme === themeOption.value && "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium"
                  )}
                >
                  <div className={clsx(
                    "flex items-center justify-center w-7 h-7 rounded-lg transition-colors",
                    theme === themeOption.value
                      ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                  )}>
                    <themeOption.icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="flex-1 text-left">{themeOption.label}</span>
                  {theme === themeOption.value && (
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
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