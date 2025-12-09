"use client";

/**
 * Sandbox Control Panel
 * Phase 30.1: Admin UI for managing sandbox billing users
 */

import { useState, useEffect } from "react";
import { Plus, Trash2, Search, Shield, Users } from "lucide-react";

interface SandboxUser {
  id: string;
  email: string;
  name: string;
  role: string;
  sandbox_enabled: boolean;
  created_at: string;
  updated_at: string;
  notes?: string;
}

const ROLES = [
  { value: "founder", label: "Founder" },
  { value: "staff_admin", label: "Staff Admin" },
  { value: "admin", label: "Admin" },
  { value: "engineering", label: "Engineering" },
  { value: "support", label: "Support" },
];

const DOMAIN_DEFAULTS = [
  { domain: "unite-group.in", mode: "TEST", description: "Internal Unite-Group domain" },
  { domain: "carsi.com.au", mode: "TEST", description: "Partner domain" },
  { domain: "disasterrecoveryqld.au", mode: "TEST", description: "Partner domain" },
];

export default function SandboxControlPage() {
  const [users, setUsers] = useState<SandboxUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for adding user
  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    role: "engineering",
    notes: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/sandbox-users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      } else {
        setError(data.error?.message || "Failed to load users");
      }
    } catch {
      setError("Failed to load sandbox users");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/sandbox-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (data.success) {
        setUsers([data.data, ...users]);
        setShowAddModal(false);
        setNewUser({ email: "", name: "", role: "engineering", notes: "" });
      } else {
        setError(data.error?.message || "Failed to add user");
      }
    } catch {
      setError("Failed to add user");
    }
  }

  async function handleUpdateRole(id: string, role: string) {
    try {
      const res = await fetch("/api/admin/sandbox-users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map(u => u.id === id ? data.data : u));
      } else {
        setError(data.error?.message || "Failed to update role");
      }
    } catch {
      setError("Failed to update role");
    }
  }

  async function handleToggleSandbox(id: string, sandbox_enabled: boolean) {
    try {
      const res = await fetch("/api/admin/sandbox-users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, sandbox_enabled }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map(u => u.id === id ? data.data : u));
      } else {
        setError(data.error?.message || "Failed to toggle sandbox");
      }
    } catch {
      setError("Failed to toggle sandbox");
    }
  }

  async function handleDeleteUser(id: string) {
    if (!confirm("Are you sure you want to remove this user from sandbox?")) {
return;
}
    try {
      const res = await fetch(`/api/admin/sandbox-users?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.filter(u => u.id !== id));
      } else {
        setError(data.error?.message || "Failed to delete user");
      }
    } catch {
      setError("Failed to delete user");
    }
  }

  const filteredUsers = users.filter(
    u =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="h-6 w-6 text-yellow-500" />
          Sandbox Control Panel
        </h1>
        <p className="text-slate-400 mt-1">
          Manage staff accounts for Stripe TEST mode billing
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-red-400 hover:text-red-300">
            Dismiss
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="text-sm text-slate-400">Total Staff</div>
          <div className="text-2xl font-bold text-white">{users.length}</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="text-sm text-slate-400">Sandbox Enabled</div>
          <div className="text-2xl font-bold text-yellow-500">
            {users.filter(u => u.sandbox_enabled).length}
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="text-sm text-slate-400">Domain Defaults</div>
          <div className="text-2xl font-bold text-blue-500">{DOMAIN_DEFAULTS.length}</div>
        </div>
      </div>

      {/* Domain Defaults Section */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 mb-6">
        <h2 className="text-lg font-semibold text-white mb-3">Domain Defaults</h2>
        <p className="text-sm text-slate-400 mb-3">
          All emails from these domains automatically use TEST mode
        </p>
        <div className="space-y-2">
          {DOMAIN_DEFAULTS.map(d => (
            <div key={d.domain} className="flex items-center justify-between bg-slate-900 rounded p-3">
              <div>
                <span className="text-white font-mono">@{d.domain}</span>
                <span className="ml-2 text-xs text-slate-500">{d.description}</span>
              </div>
              <span className="px-2 py-1 bg-yellow-900 text-yellow-300 text-xs rounded">
                {d.mode}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Staff Management Section */}
      <div className="bg-slate-800 rounded-lg border border-slate-700">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="h-5 w-5" />
              Staff Registry
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-600 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Staff
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-4 text-xs font-medium text-slate-400 uppercase">Email</th>
                <th className="text-left p-4 text-xs font-medium text-slate-400 uppercase">Name</th>
                <th className="text-left p-4 text-xs font-medium text-slate-400 uppercase">Role</th>
                <th className="text-left p-4 text-xs font-medium text-slate-400 uppercase">Sandbox</th>
                <th className="text-left p-4 text-xs font-medium text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="p-4 text-white font-mono text-sm">{user.email}</td>
                  <td className="p-4 text-white">{user.name}</td>
                  <td className="p-4">
                    <select
                      value={user.role}
                      onChange={e => handleUpdateRole(user.id, e.target.value)}
                      className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                    >
                      {ROLES.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleSandbox(user.id, !user.sandbox_enabled)}
                      className={`px-3 py-1 rounded text-xs font-medium ${
                        user.sandbox_enabled
                          ? "bg-yellow-900 text-yellow-300"
                          : "bg-slate-900 text-slate-400"
                      }`}
                    >
                      {user.sandbox_enabled ? "TEST" : "LIVE"}
                    </button>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                      title="Remove from sandbox"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No staff members found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Add Staff to Sandbox</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white"
                  placeholder="staff@example.com"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white"
                  placeholder="Full Name"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white"
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Notes (optional)</label>
                <textarea
                  value={newUser.notes}
                  onChange={e => setNewUser({ ...newUser, notes: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white"
                  rows={2}
                  placeholder="Optional notes..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  Add to Sandbox
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
