import { Link } from "react-router";
import { type Icon } from "@tabler/icons-react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
  title,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
    isActive?: boolean
  }[]
  title?: string
}) {
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <SidebarGroup>
      {title && <div className="px-1.5 pt-2 pb-1 font-mono text-[10px] font-medium uppercase tracking-[0.07em] text-muted-foreground/70">{title}</div>}
      <SidebarGroupContent className="flex flex-col gap-0.5">

        <SidebarMenu className="gap-0.5">
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title} isActive={item.isActive}>
                <Link
                  to={item.url}
                  onClick={() => {
                    if (isMobile) setOpenMobile(false)
                  }}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
