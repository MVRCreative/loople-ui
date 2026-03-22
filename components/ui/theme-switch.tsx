"use client";

import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { ClientOnly } from "@/components/ui/client-only";
import { Moon, Sun } from "lucide-react";

function ThemeSwitchContent() {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
  };

  return (
    <div className="flex items-center gap-2">
      <Sun className="h-4 w-4 text-muted-foreground" />
      <Switch
        checked={theme === "dark"}
        onCheckedChange={handleThemeChange}
        className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
        suppressHydrationWarning
      />
      <Moon className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

export function ThemeSwitch() {
  return (
    <ClientOnly
      fallback={
        <div className="flex items-center gap-2">
          <Sun className="h-4 w-4 text-muted-foreground" />
          <div className="h-6 w-11 rounded-full bg-input" />
          <Moon className="h-4 w-4 text-muted-foreground" />
        </div>
      }
    >
      <ThemeSwitchContent />
    </ClientOnly>
  );
}
