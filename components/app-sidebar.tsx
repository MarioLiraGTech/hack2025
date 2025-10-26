"use client";

import {
  ShoppingCart,
  Home,
  Plane,
  Truck,
  ShoppingBasket,
  Layers,
  MapPinHouse,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import Image from "next/image";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { UserButton, useUser } from "@clerk/nextjs";

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
];

export function AppSidebar() {
  const pathname = usePathname();

  const { user } = useUser();

  return (
    <Sidebar className="sidebar-animate-in border-transparent">
      <SidebarContent className="sidebar-content flex flex-col h-full">
        <div className="flex-1">
          <SidebarGroup>
              <SidebarGroupLabel className="sidebar-group-label">
                <div className="w-full flex justify-center items-center">
                  <div className="h-26 w-auto flex items-center m-10">
                    <Image
                      src="/images/LogotipoBlanco.png"
                      alt="Logotipo Blanco"
                      width={160}
                      height={68}
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>
              </SidebarGroupLabel>
            <SidebarGroupContent className="mt-2">
              <SidebarMenu>
                {items.map((item) => {
                  const isActive = pathname === item.url;

                  return (
                    <SidebarMenuItem key={item.title} className="sidebar-item">
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={
                          isActive ? "sidebar-item-active" : "sidebar-button"
                        }
                      >
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        <div className="p-4 border-t flex items-center gap-x-4">
          <UserButton afterSignOutUrl="/" />
          <div className="flex-1 truncate">
            <h2 className="font-semibold text-sm text-white truncate">
              {user?.fullName}
            </h2>
            <p className="text-xs truncate">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
