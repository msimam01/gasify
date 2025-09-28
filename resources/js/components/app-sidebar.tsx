import * as React from "react"
import { 
  IconDashboard,
  IconInnerShadowTop,
  IconUsers,
  IconWallet,
  IconCreditCard,
  IconSettings,
  IconFileCertificate,
  IconExchange,
  IconRocket,
  IconBlockquote,
} from "@tabler/icons-react"
import { Link, usePage } from "@inertiajs/react"
import { type PageProps } from "@/types"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navItems = [
  {
    title: "Dashboard",
    url: '/dashboard',
    icon: IconDashboard,
  },
  {
    title: "Users",
    url: "/users",
    icon: IconUsers,
  },
  {
    title: "My Wallet",
    url: "/wallet",
    icon: IconWallet,
  },
  {
    title: "Top up",
    url: "/topup",
    icon: IconCreditCard,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: IconSettings,
  },
  {
    title: "KYC",
    url: "/kyc",
    icon: IconFileCertificate,
  },
  {
    title: "Transactions",
    url: "/transactions",
    icon: IconExchange,
  },
  {
    title: "Airdrops",
    url: "/airdrops",
    icon: IconRocket,
  },
  {
    title: "Blockchains",
    url: "/blockchains",
    icon: IconBlockquote,
  },
  {
    title: "Manage Wallets",
    url: "/manage-wallets",
    icon: IconWallet,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { auth } = usePage<PageProps>().props

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Gasify</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{
          name: auth.user?.name || 'User',
          email: auth.user?.email || '',
          avatar: auth.user?.avatar || ''
        }} />
      </SidebarFooter>
    </Sidebar>
  )
}
