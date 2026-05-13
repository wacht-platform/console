import { Outlet } from "react-router";
import { useTour } from "@/lib/tour";

export default function SetupLayout() {
    useTour("first-deployment-settings");
    return (
        <div className="flex flex-1 flex-col" data-tour-id="setup-page">
            <Outlet />
        </div>
    );
}
