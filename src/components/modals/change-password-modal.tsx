import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Label, ErrorMessage } from "@/components/ui/fieldset";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { useMutation } from "@tanstack/react-query";

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    hasPassword: boolean;
}

interface ChangePasswordRequest {
    new_password: string;
    skip_password_check?: boolean;
}

export function ChangePasswordModal({
    isOpen,
    onClose,
    userId,
    hasPassword,
}: ChangePasswordModalProps) {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [skipChecks, setSkipChecks] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    const { selectedDeployment } = useProjects();

    // Change password mutation
    const changePasswordMutation = useMutation({
        mutationFn: async (data: ChangePasswordRequest) => {
            if (!selectedDeployment) {
                throw new Error("No deployment selected");
            }

            const response = await apiClient.patch(
                `/deployments/${selectedDeployment.id}/users/${userId}/password`,
                data,
            );
            return response.data;
        },
    });

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!newPassword.trim()) {
            newErrors.newPassword = "New password is required";
        } else if (!skipChecks && newPassword.length < 8) {
            newErrors.newPassword =
                "Password must be at least 8 characters long";
        }

        if (!confirmPassword.trim()) {
            newErrors.confirmPassword = "Please confirm your new password";
        } else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        try {
            const requestData: ChangePasswordRequest = {
                new_password: newPassword,
                skip_password_check: skipChecks,
            };

            await changePasswordMutation.mutateAsync(requestData);
            toast.success("Password changed successfully!");
            handleClose();
        } catch (error: unknown) {
            console.error("Failed to change password:", error);
            toast.error("Failed to change password. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setNewPassword("");
        setConfirmPassword("");
        setSkipChecks(false);
        setErrors({});
        setIsLoading(false);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(val) => !val && handleClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {hasPassword ? "Change Password" : "Set Password"}
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Field>
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter your new password"
                            />
                            {errors.newPassword && (
                                <ErrorMessage>
                                    {errors.newPassword}
                                </ErrorMessage>
                            )}
                        </Field>

                        <Field>
                            <Label htmlFor="confirmPassword">
                                Confirm New Password
                            </Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                placeholder="Confirm your new password"
                            />
                            {errors.confirmPassword && (
                                <ErrorMessage>
                                    {errors.confirmPassword}
                                </ErrorMessage>
                            )}
                        </Field>

                        <Field className="flex gap-2">
                            <input
                                type="checkbox"
                                id="skipChecks"
                                checked={skipChecks}
                                onChange={(e) =>
                                    setSkipChecks(e.target.checked)
                                }
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <Label
                                htmlFor="skipChecks"
                                className="text-sm font-normal mb-0"
                            >
                                Skip password validation checks
                            </Label>
                        </Field>
                    </form>
                </div>

                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading
                            ? "Changing..."
                            : hasPassword
                              ? "Change Password"
                              : "Set Password"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
