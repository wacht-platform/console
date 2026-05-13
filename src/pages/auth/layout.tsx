import { Outlet } from "react-router";
import { useTour } from "@/lib/tour";

export default function AuthLayout() {
    useTour("first-auth-settings");
    return (
        <div className="flex flex-1 flex-col" data-tour-id="auth-page">
            <Outlet />
        </div>
    );
}
