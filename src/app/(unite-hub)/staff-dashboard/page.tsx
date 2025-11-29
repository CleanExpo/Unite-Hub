/**
 * Unite-Hub Dashboard (Staff CRM)
 * Main dashboard for staff users
 */

export default function UniteHubDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-100">
          Unite-Hub Dashboard
        </h1>
        <p className="text-gray-400 mt-2">
          Staff CRM - Contact Management & Campaign Analytics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-2">
            Total Contacts
          </h3>
          <p className="text-3xl font-bold text-blue-400">
            0
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-2">
            Active Campaigns
          </h3>
          <p className="text-3xl font-bold text-purple-400">
            0
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-2">
            Hot Leads
          </h3>
          <p className="text-3xl font-bold text-amber-400">
            0
          </p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">
          Route Group: (unite-hub)
        </h3>
        <p className="text-gray-400">
          This is the Unite-Hub staff CRM area. Only users with FOUNDER, STAFF, or ADMIN roles can access this section.
        </p>
      </div>
    </div>
  );
}
