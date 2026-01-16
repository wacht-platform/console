import { Outlet } from "react-router";

export default function AuthLayout() {
    return (
        <div className="flex flex-1 flex-col">
            <Outlet />
        </div>
    );
}
