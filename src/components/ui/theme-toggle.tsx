import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/providers/theme";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
    const { actualTheme, setTheme } = useTheme();
    const isDark = actualTheme === "dark";

    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
            <Sun className="size-4 stroke-1 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute stroke-1 size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
