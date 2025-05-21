"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Building, LayoutDashboard, MessageSquare, Users } from "lucide-react"

const items = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "CRM",
    href: "/dashboard/crm",
    icon: Users,
    children: [
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
  },
  {
    title: "Architecture",
    href: "/dashboard/architecture",
    icon: Building,
    children: [
      {
        title: "Projects",
        href: "/dashboard/architecture",
      },
      {
        title: "New Project",
        href: "/dashboard/architecture/new",
      },
    ],
  },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="grid items-start gap-2">
      {items.map((item, index) => (
        <div key={index} className="mb-2">
          <Link
            href={item.href}
            className={cn(
              "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              pathname === item.href ? "bg-accent text-accent-foreground" : "transparent",
            )}
          >
            <item.icon className="mr-2 h-4 w-4" />
            <span>{item.title}</span>
          </Link>
          {item.children && (
            <div className="ml-4 mt-1 space-y-1">
              {item.children.map((child, childIndex) => (
                <Link
                  key={childIndex}
                  href={child.href}
                  className={cn(
                    "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    pathname === child.href ? "bg-accent/50 text-accent-foreground" : "transparent",
                  )}
                >
                  <span>{child.title}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  )
}
