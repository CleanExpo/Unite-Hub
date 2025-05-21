import Link from "next/link"

export default function DashboardNav() {
  return (
    <nav className="bg-gray-100 p-4">
      <ul className="flex flex-wrap gap-4">
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
          <Link href="/dashboard/architecture" className="hover:text-blue-500">
            Architecture
          </Link>
        </li>
        <li>
          <Link href="/dashboard/architecture/branding" className="hover:text-blue-500">
            PDF Branding
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
