import { Outlet } from "react-router";

export default function B2BSettingsLayout() {
    return (
        <div className="flex flex-1 flex-col">
            <Outlet />
        </div>
    );
}
