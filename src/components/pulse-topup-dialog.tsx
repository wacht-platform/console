import { useState } from "react";
import axios from "axios";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useBuyPulse } from "@/lib/api/hooks/use-billing";
import { BoltIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { Spinner } from "./ui/app-spinner";
import { toast } from "sonner";

interface PulseTopUpDialogProps {
    open: boolean;
    onClose: () => void;
}

export function PulseTopUpDialog({ open, onClose }: PulseTopUpDialogProps) {
    const [selectedAmount, setSelectedAmount] = useState<number>(1000);
    const buyPulse = useBuyPulse();

    const denominations = [
        { amount: 500, label: "$5", pulse: "500" },
        { amount: 1000, label: "$10", pulse: "1,000", popular: true },
        { amount: 2500, label: "$25", pulse: "2,500" },
        { amount: 5000, label: "$50", pulse: "5,000" },
        { amount: 10000, label: "$100", pulse: "10,000" },
    ];

    const handleBuy = async () => {
        try {
            const result = await buyPulse.mutateAsync({
                pulse_amount: selectedAmount,
                return_url: window.location.href,
            });

            if (result.checkout_url) {
                sessionStorage.setItem("pulse_checkout_initiated", "true");
                window.location.href = result.checkout_url;
            }
        } catch (error) {
            console.error("Failed to initiate Pulse purchase:", error);
            if (axios.isAxiosError(error)) {
                const message =
                    (typeof error.response?.data?.message === "string" && error.response?.data?.message) ||
                    (typeof error.response?.data?.error === "string" && error.response?.data?.error) ||
                    "Failed to initiate Pulse purchase";
                toast.error(message);
            } else {
                toast.error("Failed to initiate Pulse purchase");
            }
        }
    };

    // Math: Total = ceil((Pulse + 50c) / 0.96)
    const total = Math.ceil((selectedAmount + 50) / 0.96);
    const fee = total - selectedAmount;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[640px] border-border bg-popover text-popover-foreground p-0 overflow-hidden shadow-2xl">
                {/* Subtle accent glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -z-10 pointer-events-none" />

                <div className="p-6 border-b border-border bg-secondary">
                    <DialogHeader className="mx-0 mt-0 border-b border-border px-6 pb-4 pt-6">
                        <div className="flex items-center gap-5">
                            <div className="w-11 h-11 rounded-2xl bg-primary dark:bg-primary flex items-center justify-center border border-primary dark:border-primary shadow-inner">
                                <BoltIcon className="w-6 h-6 text-primary dark:text-primary" />
                            </div>
                            <div className="flex flex-col text-left">
                                <DialogTitle className="text-xl font-light tracking-tight text-foreground leading-tight">Refill Pulse Credits</DialogTitle>
                                <DialogDescription className="text-muted-foreground font-light text-xs mt-0.5">
                                    Power your AI Agents and SMS verifications globally.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-6">
                    {/* Section 1: Options */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-[0.2em] whitespace-nowrap">Credit Options</span>
                            <div className="h-[1px] flex-grow bg-secondary" />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {denominations.map((d) => (
                                <button
                                    key={d.amount}
                                    onClick={() => setSelectedAmount(d.amount)}
                                    className={`flex flex-col items-start p-4 rounded-xl border transition-all relative group h-22 justify-center ${selectedAmount === d.amount
                                        ? "bg-primary dark:bg-primary/[0.04] border-primary dark:border-primary text-primary dark:text-primary ring-1 ring-primary dark:ring-primary shadow-lg shadow-primary/20 dark:shadow-primary/20"
                                        : "bg-secondary border-border text-muted-foreground hover:border-border dark:hover:border-border hover:bg-secondary"
                                        }`}
                                >
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xs font-light text-muted-foreground">$</span>
                                        <span className={`text-xl font-light tracking-tighter transition-colors ${selectedAmount === d.amount ? "text-foreground" : "group-hover:text-foreground"}`}>
                                            {(d.amount / 100).toFixed(0)}
                                        </span>
                                    </div>
                                    <span className="text-[9px] uppercase tracking-[0.15em] opacity-40 font-medium mt-1">
                                        {d.pulse} Pulse
                                    </span>
                                    {d.popular && (
                                        <div className="absolute -top-2.5 -right-2 bg-primary text-[8px] px-2 py-0.5 rounded-full text-primary-foreground font-bold uppercase tracking-tighter shadow-lg shadow-primary/20 border border-border ring-4 ring-popover">
                                            Popular
                                        </div>
                                    )}
                                    {selectedAmount === d.amount && (
                                        <div className="absolute top-2 right-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary dark:bg-primary animate-pulse" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Section 2: Summary */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-[0.2em] whitespace-nowrap">Order Summary</span>
                            <div className="h-[1px] flex-grow bg-secondary" />
                        </div>

                        <div className="bg-secondary dark:bg-popover/50 rounded-xl p-5 border border-border relative overflow-hidden">
                            <div className="space-y-3 relative z-10">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-light text-muted-foreground">Credits Allocation</span>
                                    <span className="text-xs text-foreground">${(selectedAmount / 100).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-light text-muted-foreground/80">Processing Fees</span>
                                    <span className="text-xs text-muted-foreground">${(fee / 100).toFixed(2)}</span>
                                </div>
                                <div className="pt-4 mt-4 border-t border-border dark:border-border flex justify-between items-center">
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-sm text-muted-foreground font-light leading-none">$</span>
                                        <span className="text-3xl font-light text-foreground tracking-tighter tabular-nums truncate">
                                            {(total / 100).toFixed(2)}
                                        </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground dark:text-muted-foreground font-light italic">Secure one-time transaction</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground dark:text-muted-foreground font-light pt-1">
                        <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-500/60 dark:text-emerald-500/60" />
                        Encrypted transaction. No card data is stored.
                    </div>
                </div>

                <DialogFooter className="mx-0 mb-0 flex items-center justify-end gap-3 rounded-none border-t border-border bg-secondary p-6 sm:justify-end">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground text-[11px] font-normal hover:bg-secondary h-10 px-5 rounded-xl transition-all"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleBuy}
                        disabled={buyPulse.isPending}
                        className="bg-primary dark:bg-primary hover:bg-primary dark:hover:bg-primary text-primary-foreground border-transparent text-[11px] h-10 px-8 font-medium rounded-xl shadow-lg dark:shadow-2xl shadow-primary/20 dark:shadow-primary/20 transition-all active:scale-[0.98] min-w-[150px]"
                    >
                        {buyPulse.isPending ? <Spinner size="sm" className="border-t-white" /> : `Pay $${(total / 100).toFixed(2)}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
