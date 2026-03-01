import {
    IconDashboard,
    IconSettings,
    IconUsers,
    IconKey,
    IconBolt,
    IconRobot,
    IconLock,
    IconBuilding,
    IconCirclePlus,
    IconCreditCard,
    IconRocket,
} from "@tabler/icons-react";
import { useLocation } from "react-router";
import { NavMain } from "@/components/nav-main";
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { OrganizationSwitcher } from "@wacht/react-router";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { pathname } = useLocation();
    const isAuthRoute = /\/auth(?:\/|$)/.test(pathname);
    const isOAuthRoute = /\/oauth(?:\/|$)/.test(pathname);

    const navManagement = [
        {
            title: "Overview",
            url: "./",
            icon: IconDashboard,
            isActive: pathname === "/" || pathname.endsWith("/"),
        },
        {
            title: "Users",
            url: "users/active",
            icon: IconUsers,
            isActive: pathname.includes("users"),
        },
        {
            title: "Organizations",
            url: "organizations",
            icon: IconBuilding,
            isActive: pathname.includes("organizations"),
        },
        {
            title: "Segments",
            url: "segments",
            icon: IconCirclePlus,
            isActive: pathname.includes("segments"),
        },
    ];

    const navConfiguration = [
        {
            title: "Authentication",
            url: "auth",
            icon: IconLock,
            isActive: isAuthRoute && !pathname.includes("auth-methods"),
        },
        {
            title: "Multi Tenancy",
            url: "b2b-settings",
            icon: IconBuilding,
            isActive: pathname.includes("b2b-settings"),
        },
        {
            title: "OAuth Apps",
            url: "oauth",
            icon: IconKey,
            isActive: isOAuthRoute,
        },
        {
            title: "Manage Deployment",
            url: "setup",
            icon: IconSettings,
            isActive:
                pathname.includes("setup") ||
                pathname.includes("webhook-catalogs") ||
                pathname.includes("rate-limit-schemes"),
        },
        {
            title: "Subscription & Billing",
            url: "billing",
            icon: IconCreditCard,
            isActive: pathname.includes("billing"),
        },
    ];

    const navDevelopers = [
        {
            title: "API Keys",
            url: "api-keys",
            icon: IconKey,
            isActive: pathname.includes("api-keys"),
        },
        {
            title: "Webhooks",
            url: "webhooks",
            icon: IconBolt,
            isActive: pathname.includes("webhooks"),
        },
        {
            title: "Agents Platform",
            url: "llms/ai-agents",
            icon: IconRobot,
            isActive: pathname.includes("llms"),
        },
    ];

    const navOnboarding = [
        {
            title: "Quickstart",
            url: "getting-started",
            icon: IconRocket,
            isActive: pathname.includes("getting-started"),
        },
    ];

    return (
        <Sidebar collapsible="none" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <OrganizationSwitcher />
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navOnboarding} />
                <div className="flex flex-col gap-4 -mt-2">
                    <NavMain title="MANAGEMENT" items={navManagement} />
                    <NavMain title="CONFIGURATION" items={navConfiguration} />
                    <NavMain title="DEVELOPERS" items={navDevelopers} />
                </div>
            </SidebarContent>
        </Sidebar>
    );
}
