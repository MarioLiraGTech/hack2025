"use client"

import { ShoppingCart, Home, Plane,Truck, ShoppingBasket, Layers, MapPinHouse } from "lucide-react"
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
    icon: MapPinHouse,
  },
  {
    title: "Products",
    url: "/products",
    icon: ShoppingBasket,
  },
  {
    title: "Carts",
    url: "/carts",
    icon: ShoppingCart,
  },
  {
    title: "Distributor",
    url: "/distributor",
    icon: Truck,
  },
  {
    title: "Amount",
    url: "/amount",
    icon: Layers,
  },
  {
    title: "Flight",
    url: "/flight",
    icon: Plane,
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