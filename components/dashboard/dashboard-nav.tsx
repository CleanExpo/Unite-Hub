"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Users, PieChart, LayoutGrid, Settings, KanbanSquare, Mail, Share2 } from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
}

export function DashboardNav() {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutGrid className="h-5 w-5" />,
    },
    {
      title: "CRM",
      href: "/dashboard/crm",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Pipeline",
      href: "/dashboard/crm/pipeline",
      icon: <KanbanSquare className="h-5 w-5" />,
    },
    {
      title: "Analytics",
      href: "/dashboard/crm/analytics",
      icon: <PieChart className="h-5 w-5" />,
    },
    {
      title: "Email",
      href: "/dashboard/crm/email",
      icon: <Mail className="h-5 w-5" />,
    },
    {
      title: "Social",
      href: "/dashboard/social",
      icon: <Share2 className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  return (
    <nav className="space-y-1">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center px-3 py-2 text-sm font-medium rounded-md group",
            pathname === item.href || pathname.startsWith(`${item.href}/`)
              ? "bg-gray-100 text-gray-900"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
          )}
        >
          <span className="mr-3">{item.icon}</span>
          {item.title}
        </Link>
      ))}
    </nav>
  )
}
