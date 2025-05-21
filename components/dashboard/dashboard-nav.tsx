"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Building, FileText, LayoutDashboard, MessageSquare, Settings } from "lucide-react"

const items = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "CRM",
    href: "/dashboard/crm",
    icon: Building,
    submenu: [
      {
        title: "Clients",
        href: "/dashboard/crm",
      },
      {
        title: "Pipeline",
        href: "/dashboard/crm/pipeline",
      },
      {
        title: "Analytics",
        href: "/dashboard/crm/analytics",
      },
      {
        title: "Email",
        href: "/dashboard/crm/email",
      },
    ],
  },
  {
    title: "Social",
    href: "/dashboard/social",
    icon: MessageSquare,
    submenu: [
      {
        title: "Dashboard",
        href: "/dashboard/social",
      },
      {
        title: "Templates",
        href: "/dashboard/social/templates",
      },
    ],
  },
  {
    title: "Architecture",
    href: "/dashboard/architecture",
    icon: FileText,
    submenu: [
      {
        title: "Projects",
        href: "/dashboard/architecture",
      },
      {
        title: "New Project",
        href: "/dashboard/architecture/new",
      },
      {
        title: "PDF Branding",
        href: "/dashboard/architecture/branding",
      },
    ],
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
]

interface DashboardNavProps {
  className?: string
}

export function DashboardNav({ className }: DashboardNavProps) {
  const pathname = usePathname()

  return (
    <nav className={cn("grid items-start gap-2", className)}>
      {items.map((item, index) => {
        const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)

        return (
          <div key={index} className="grid gap-1">
            <Link
              href={item.href}
              className={cn(
                "group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                isActive ? "bg-accent text-accent-foreground" : "transparent",
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
            {isActive && item.submenu && (
              <div className="grid gap-1 pl-6">
                {item.submenu.map((submenuItem, submenuIndex) => {
                  const isSubmenuActive = pathname === submenuItem.href

                  return (
                    <Link
                      key={submenuIndex}
                      href={submenuItem.href}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                        isSubmenuActive ? "bg-accent/50 text-accent-foreground" : "transparent",
                      )}
                    >
                      <span>{submenuItem.title}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}
