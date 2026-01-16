import { Outlet } from "react-router";

export default function CustomizationLayout() {
    return (
        <div className="flex flex-1 flex-col">
            <Outlet />
        </div>
    );
}
