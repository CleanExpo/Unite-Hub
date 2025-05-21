"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, MessageSquare, Settings, FileImage } from "lucide-react"

const navItems = [
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
        href: "/dashboard/crm/clients",
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
    children: [
      {
        title: "Feed",
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
    icon: FileImage,
    children: [
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
      {
        title: "Template Gallery",
        href: "/dashboard/architecture/branding/gallery",
      },
    ],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)

        return (
          <div key={item.href} className="space-y-1">
            <Link
              href={item.href}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
              {item.title}
            </Link>

            {item.children && isActive && (
              <div className="ml-8 space-y-1">
                {item.children.map((child) => {
                  const isChildActive = pathname === child.href

                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={`block px-3 py-2 text-sm font-medium rounded-md ${
                        isChildActive
                          ? "bg-gray-100 text-gray-900"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      {child.title}
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
