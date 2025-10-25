"use client"

import { Calendar, Home, Inbox, Search, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Menu items.
const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Branches",
    url: "/branches",
    icon: Inbox,
  },
  {
    title: "Products",
    url: "/products",
    icon: Calendar,
  },
  {
    title: "Carts",
    url: "/carts",
    icon: Search,
  },
  {
    title: "Distributor",
    url: "/distributor",
    icon: Settings,
  },
  {
    title: "Amount",
    url: "/amount",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="sidebar-animate-in">
      <SidebarContent className="sidebar-content">
        <SidebarGroup>
          <SidebarGroupLabel className="sidebar-group-label">Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = pathname === item.url
                
                return (
                  <SidebarMenuItem key={item.title} className="sidebar-item">
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className={isActive ? 'sidebar-item-active' : 'sidebar-button'}
                    >
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}