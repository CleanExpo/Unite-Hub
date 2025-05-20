import Link from "next/link"

export default function DashboardNav() {
  return (
    <nav className="bg-gray-100 p-4">
      <ul className="flex space-x-4">
        <li>
          <Link href="/dashboard" className="hover:text-blue-500">
            Dashboard Home
          </Link>
        </li>
        <li>
          <Link href="/dashboard/crm" className="hover:text-blue-500">
            CRM
          </Link>
        </li>
        <li>
          <Link href="/dashboard/analytics" className="hover:text-blue-500">
            Analytics
          </Link>
        </li>
        <li>
          <Link href="/dashboard/settings" className="hover:text-blue-500">
            Settings
          </Link>
        </li>
      </ul>
    </nav>
  )
}
