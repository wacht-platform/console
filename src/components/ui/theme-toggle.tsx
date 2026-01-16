import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "@/lib/providers/theme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <SunIcon className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <MoonIcon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {themes.map((themeOption) => (
          <DropdownMenuItem
            key={themeOption.value}
            onClick={() => setTheme(themeOption.value)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <themeOption.icon className={cn(
              "h-4 w-4",
              theme === themeOption.value ? "text-primary" : "text-muted-foreground"
            )} />
            <span className={cn(
              theme === themeOption.value ? "font-medium text-primary" : ""
            )}>
              {themeOption.label}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
