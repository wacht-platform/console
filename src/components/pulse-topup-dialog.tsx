import { useState } from "react";
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
import { Spinner } from "./ui/spinner";

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
        }
    };

    // Math: Total = ceil((Pulse + 50c) / 0.96)
    const total = Math.ceil((selectedAmount + 50) / 0.96);
    const fee = total - selectedAmount;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[640px] bg-[#09090b] border-zinc-800/80 text-zinc-100 p-0 overflow-hidden shadow-2xl">
                {/* Subtle indigo glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] -z-10 pointer-events-none" />

                <div className="p-6 border-b border-zinc-800/50 bg-zinc-900/10">
                    <DialogHeader>
                        <div className="flex items-center gap-5">
                            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                                <BoltIcon className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div className="flex flex-col text-left">
                                <DialogTitle className="text-xl font-light tracking-tight text-white leading-tight">Refill Pulse Credits</DialogTitle>
                                <DialogDescription className="text-zinc-500 font-light text-xs mt-0.5">
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
                            <span className="text-[9px] font-medium text-zinc-500 uppercase tracking-[0.2em] whitespace-nowrap">Credit Options</span>
                            <div className="h-[1px] flex-grow bg-zinc-800/20" />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {denominations.map((d) => (
                                <button
                                    key={d.amount}
                                    onClick={() => setSelectedAmount(d.amount)}
                                    className={`flex flex-col items-start p-4 rounded-xl border transition-all relative group h-22 justify-center ${selectedAmount === d.amount
                                        ? "bg-indigo-500/[0.04] border-indigo-500/60 text-indigo-400 ring-1 ring-indigo-500/20 shadow-lg shadow-indigo-500/5"
                                        : "bg-zinc-900/40 border-zinc-800/60 text-zinc-500 hover:border-zinc-700 hover:bg-zinc-900/60"
                                        }`}
                                >
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xs font-light text-zinc-500">$</span>
                                        <span className={`text-xl font-light tracking-tighter transition-colors ${selectedAmount === d.amount ? "text-white" : "group-hover:text-white"}`}>
                                            {(d.amount / 100).toFixed(0)}
                                        </span>
                                    </div>
                                    <span className="text-[9px] uppercase tracking-[0.15em] opacity-40 font-medium mt-1">
                                        {d.pulse} Pulse
                                    </span>
                                    {d.popular && (
                                        <div className="absolute -top-2.5 -right-2 bg-indigo-500 text-[8px] px-2 py-0.5 rounded-full text-white font-bold uppercase tracking-tighter shadow-lg shadow-indigo-500/30 border border-white/10 ring-4 ring-[#09090b]">
                                            Popular
                                        </div>
                                    )}
                                    {selectedAmount === d.amount && (
                                        <div className="absolute top-2 right-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Section 2: Summary */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <span className="text-[9px] font-medium text-zinc-500 uppercase tracking-[0.2em] whitespace-nowrap">Order Summary</span>
                            <div className="h-[1px] flex-grow bg-zinc-800/20" />
                        </div>

                        <div className="bg-[#111113]/50 rounded-xl p-5 border border-zinc-800/60 relative overflow-hidden">
                            <div className="space-y-3 relative z-10">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-light text-zinc-400">Credits Allocation</span>
                                    <span className="text-xs font-mono text-zinc-200">${(selectedAmount / 100).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-light text-zinc-500/80">Processing Fees</span>
                                    <span className="text-xs font-mono text-zinc-400">${(fee / 100).toFixed(2)}</span>
                                </div>
                                <div className="pt-4 mt-4 border-t border-zinc-800/50 flex justify-between items-center">
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-sm text-zinc-500 font-light leading-none">$</span>
                                        <span className="text-3xl font-light text-white tracking-tighter tabular-nums truncate">
                                            {(total / 100).toFixed(2)}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-zinc-600 font-light italic">Secure one-time transaction</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-3 text-[10px] text-zinc-600 font-light pt-1">
                        <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-500/60" />
                        Encrypted transaction. No card data is stored.
                    </div>
                </div>

                <DialogFooter className="p-6 bg-zinc-900/20 border-t border-zinc-800/50 flex items-center justify-end gap-3 sm:justify-end">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-zinc-500 hover:text-zinc-300 text-[11px] font-normal hover:bg-zinc-800/30 h-10 px-5 rounded-xl transition-all"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleBuy}
                        disabled={buyPulse.isPending}
                        className="bg-indigo-600/90 hover:bg-indigo-500 text-white border-transparent text-[11px] h-10 px-8 font-medium rounded-xl shadow-2xl shadow-indigo-500/20 transition-all active:scale-[0.98] min-w-[150px]"
                    >
                        {buyPulse.isPending ? <Spinner size="sm" className="border-t-white" /> : `Pay $${(total / 100).toFixed(2)}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
