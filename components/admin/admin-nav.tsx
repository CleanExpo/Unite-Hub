"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Building2, FileText, Settings, AlertTriangle, ClipboardList } from "lucide-react"
import NotificationBadge from "./notification-badge"
import ErrorNotificationListener from "./error-notification"

const adminNavItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Clients",
    href: "/admin/clients",
    icon: Building2,
  },
  {
    title: "Forms",
    href: "/admin/forms",
    icon: FileText,
  },
  {
    title: "Error Logs",
    href: "/admin/errors",
    icon: AlertTriangle,
  },
  {
    title: "Error Assignments",
    href: "/admin/errors/assignments",
    icon: ClipboardList,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <>
      <ErrorNotificationListener />
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Admin Panel</h2>
        <NotificationBadge />
      </div>
      <nav className="space-y-1">
        {adminNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md",
              pathname === item.href || pathname?.startsWith(`${item.href}/`)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.title}
          </Link>
        ))}
      </nav>
    </>
  )
}
