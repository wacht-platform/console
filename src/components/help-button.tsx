import { useEffect } from "react";
import { BoltIcon } from "@heroicons/react/24/outline";

type BeaconFn = (method: string, options?: unknown, data?: unknown) => void;

function getBeacon(): BeaconFn | undefined {
  return (window as unknown as { Beacon?: BeaconFn }).Beacon;
}

// HelpScout Beacon ships its own floating button; we hide it and drive the
// panel from a button that matches the design language (the `wa-help` pill).
export function HelpButton() {
  useEffect(() => {
    getBeacon()?.("config", { display: { style: "manual" } });
  }, []);

  return (
    <button
      type="button"
      onClick={() => getBeacon()?.("toggle")}
      aria-label="Help"
      className="fixed bottom-5 right-5 z-50 flex h-8 items-center gap-1.5 rounded-md border border-input bg-card px-3.5 text-[13px] font-medium text-foreground shadow-md shadow-black/10 transition-colors hover:bg-accent hover:text-foreground"
    >
      <BoltIcon className="h-3.5 w-3.5" />
      Help
    </button>
  );
}
