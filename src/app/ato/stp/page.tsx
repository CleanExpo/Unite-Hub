/**
 * STP Phase 2 Compliance Dashboard
 *
 * Single Touch Payroll management:
 * - Employee records
 * - Pay run processing
 * - PAYG and super calculations
 * - STP submissions to ATO
 *
 * Related to: UNI-178 [ATO] STP Phase 2 Compliance
 */

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Users,
  DollarSign,
  Send,
  CheckCircle,
  AlertCircle,
  Calendar,
  FileText,
  Plus,
} from 'lucide-react';

interface Employee {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  employment_type: string;
  employment_start_date: string;
  tax_free_threshold: boolean;
  is_active: boolean;
}

interface PayRun {
  id: string;
  employee_id: string;
  pay_period_start: string;
  pay_period_end: string;
  payment_date: string;
  financial_year: number;
  gross_earnings: number;
  tax_withheld: number;
  super_employer_contribution: number;
  net_pay: number;
  status: string;
}

interface Submission {
  id: string;
  submission_type: string;
  financial_year: number;
  pay_event_date: string;
  submission_date: string;
  employee_count: number;
  total_gross_earnings: number;
  total_tax_withheld: number;
  status: string;
}

export default function STPDashboard() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId');

  const [activeTab, setActiveTab] = useState<'employees' | 'payruns' | 'submissions'>(
    'employees'
  );

  // Employee state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Pay run state
  const [payRuns, setPayRuns] = useState<PayRun[]>([]);
  const [loadingPayRuns, setLoadingPayRuns] = useState(false);

  // Submission state
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Form states
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showPayRunForm, setShowPayRunForm] = useState(false);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);

  // Load data
  useEffect(() => {
    if (!workspaceId) return;

    if (activeTab === 'employees') {
      loadEmployees();
    } else if (activeTab === 'payruns') {
      loadPayRuns();
    } else if (activeTab === 'submissions') {
      loadSubmissions();
    }
  }, [workspaceId, activeTab]);

  const loadEmployees = async () => {
    if (!workspaceId) return;
    setLoadingEmployees(true);
    try {
      const response = await fetch(
        `/api/integrations/ato/stp/employees?workspaceId=${workspaceId}`
      );
      const data = await response.json();
      if (data.success) {
        setEmployees(data.employees);
      }
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const loadPayRuns = async () => {
    if (!workspaceId) return;
    setLoadingPayRuns(true);
    try {
      const response = await fetch(
        `/api/integrations/ato/stp/pay-runs?workspaceId=${workspaceId}`
      );
      const data = await response.json();
      if (data.success) {
        setPayRuns(data.payRuns);
      }
    } catch (error) {
      console.error('Failed to load pay runs:', error);
    } finally {
      setLoadingPayRuns(false);
    }
  };

  const loadSubmissions = async () => {
    if (!workspaceId) return;
    setLoadingSubmissions(true);
    try {
      const response = await fetch(
        `/api/integrations/ato/stp/submissions?workspaceId=${workspaceId}`
      );
      const data = await response.json();
      if (data.success) {
        setSubmissions(data.submissions);
      }
    } catch (error) {
      console.error('Failed to load submissions:', error);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const employeeData = {
      workspaceId,
      employee_id: formData.get('employee_id'),
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      email: formData.get('email'),
      employment_type: formData.get('employment_type'),
      employment_start_date: formData.get('employment_start_date'),
      tax_free_threshold: formData.get('tax_free_threshold') === 'on',
      hecs_help_debt: formData.get('hecs_help_debt') === 'on',
      tax_scale: formData.get('tax_scale') || 'regular',
    };

    try {
      const response = await fetch('/api/integrations/ato/stp/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeData),
      });

      const data = await response.json();

      if (data.success) {
        alert('Employee created successfully');
        setShowEmployeeForm(false);
        loadEmployees();
      } else {
        alert(`Failed to create employee: ${data.error}`);
      }
    } catch (error) {
      console.error('Create employee error:', error);
      alert('Failed to create employee');
    }
  };

  const handleCreatePayRun = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const payRunData = {
      workspaceId,
      employee_id: formData.get('employee_id'),
      pay_period_start: formData.get('pay_period_start'),
      pay_period_end: formData.get('pay_period_end'),
      payment_date: formData.get('payment_date'),
      gross_earnings: parseFloat(formData.get('gross_earnings') as string),
      ordinary_hours: parseFloat(formData.get('ordinary_hours') as string) || undefined,
      allowances: parseFloat(formData.get('allowances') as string) || 0,
      bonuses: parseFloat(formData.get('bonuses') as string) || 0,
    };

    try {
      const response = await fetch('/api/integrations/ato/stp/pay-runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payRunData),
      });

      const data = await response.json();

      if (data.success) {
        alert('Pay run created successfully');
        setShowPayRunForm(false);
        loadPayRuns();
      } else {
        alert(`Failed to create pay run: ${data.error}`);
      }
    } catch (error) {
      console.error('Create pay run error:', error);
      alert('Failed to create pay run');
    }
  };

  const handleFinalizePayRun = async (payRunId: string) => {
    if (!confirm('Finalize this pay run? It will be ready for STP submission.')) return;

    try {
      const response = await fetch(`/api/integrations/ato/stp/pay-runs/${payRunId}/finalize`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Pay run finalized');
        loadPayRuns();
      } else {
        alert(`Failed to finalize: ${data.error}`);
      }
    } catch (error) {
      console.error('Finalize error:', error);
      alert('Failed to finalize pay run');
    }
  };

  const handleCreateSubmission = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const submissionData = {
      workspaceId,
      submission_type: formData.get('submission_type'),
      pay_event_date: formData.get('pay_event_date'),
      financial_year: parseInt(formData.get('financial_year') as string),
      payer_abn: formData.get('payer_abn'),
      payer_name: formData.get('payer_name'),
    };

    try {
      const response = await fetch('/api/integrations/ato/stp/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();

      if (data.success) {
        alert(`STP submission created. Submitted ${data.summary.pay_runs_submitted} pay runs.`);
        setShowSubmissionForm(false);
        loadSubmissions();
        loadPayRuns(); // Refresh to show submitted status
      } else {
        alert(`Failed to create submission: ${data.error}`);
      }
    } catch (error) {
      console.error('Create submission error:', error);
      alert('Failed to create submission');
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: 'bg-gray-700 text-gray-300',
      finalized: 'bg-blue-600 text-blue-100',
      submitted: 'bg-emerald-600 text-emerald-100',
      accepted: 'bg-green-600 text-green-100',
      rejected: 'bg-red-600 text-red-100',
    };

    return (
      <span
        className={`px-2 py-1 rounded text-xs font-semibold ${
          colors[status as keyof typeof colors] || 'bg-gray-600 text-gray-200'
        }`}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-400" />
            STP Phase 2 Compliance
          </h1>
          <p className="text-gray-400 mt-2">Single Touch Payroll reporting to ATO</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-800 flex gap-6">
          <button
            onClick={() => setActiveTab('employees')}
            className={`pb-3 px-2 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'employees'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <Users className="h-4 w-4" />
            Employees
          </button>
          <button
            onClick={() => setActiveTab('payruns')}
            className={`pb-3 px-2 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'payruns'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <DollarSign className="h-4 w-4" />
            Pay Runs
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`pb-3 px-2 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'submissions'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <Send className="h-4 w-4" />
            Submissions
          </button>
        </div>

        {/* Employees Tab */}
        {activeTab === 'employees' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Employees ({employees.length})</h2>
              <button
                onClick={() => setShowEmployeeForm(!showEmployeeForm)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Employee
              </button>
            </div>

            {/* Employee Form */}
            {showEmployeeForm && (
              <form
                onSubmit={handleCreateEmployee}
                className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4"
              >
                <h3 className="font-semibold text-lg">New Employee</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Employee ID</label>
                    <input
                      type="text"
                      name="employee_id"
                      required
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">First Name</label>
                    <input
                      type="text"
                      name="first_name"
                      required
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Last Name</label>
                    <input
                      type="text"
                      name="last_name"
                      required
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Employment Type</label>
                    <select
                      name="employment_type"
                      required
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100"
                    >
                      <option value="full_time">Full Time</option>
                      <option value="part_time">Part Time</option>
                      <option value="casual">Casual</option>
                      <option value="contractor">Contractor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Start Date</label>
                    <input
                      type="date"
                      name="employment_start_date"
                      required
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="tax_free_threshold" className="rounded" />
                      <span className="text-sm text-gray-300">Claim tax-free threshold</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="hecs_help_debt" className="rounded" />
                      <span className="text-sm text-gray-300">HECS/HELP debt</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  >
                    Create Employee
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEmployeeForm(false)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Employee List */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
              {loadingEmployees ? (
                <div className="p-6 text-center text-gray-400">Loading...</div>
              ) : employees.length === 0 ? (
                <div className="p-6 text-center text-gray-400">No employees yet</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-800 text-gray-400 text-sm">
                    <tr>
                      <th className="text-left p-3">ID</th>
                      <th className="text-left p-3">Name</th>
                      <th className="text-left p-3">Type</th>
                      <th className="text-left p-3">Start Date</th>
                      <th className="text-left p-3">TFT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {employees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-gray-800/50">
                        <td className="p-3 font-mono text-sm">{emp.employee_id}</td>
                        <td className="p-3">
                          {emp.first_name} {emp.last_name}
                        </td>
                        <td className="p-3 capitalize text-sm text-gray-400">
                          {emp.employment_type.replace('_', ' ')}
                        </td>
                        <td className="p-3 text-sm text-gray-400">{emp.employment_start_date}</td>
                        <td className="p-3">
                          {emp.tax_free_threshold ? (
                            <CheckCircle className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <span className="text-gray-500 text-sm">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Pay Runs Tab */}
        {activeTab === 'payruns' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Pay Runs ({payRuns.length})</h2>
              <button
                onClick={() => setShowPayRunForm(!showPayRunForm)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                disabled={employees.length === 0}
              >
                <Plus className="h-4 w-4" />
                Create Pay Run
              </button>
            </div>

            {/* Pay Run Form */}
            {showPayRunForm && (
              <form
                onSubmit={handleCreatePayRun}
                className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4"
              >
                <h3 className="font-semibold text-lg">New Pay Run</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Employee</label>
                    <select
                      name="employee_id"
                      required
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100"
                    >
                      <option value="">Select employee</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.first_name} {emp.last_name} ({emp.employee_id})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Gross Earnings ($)</label>
                    <input
                      type="number"
                      name="gross_earnings"
                      step="0.01"
                      required
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Period Start</label>
                    <input
                      type="date"
                      name="pay_period_start"
                      required
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Period End</label>
                    <input
                      type="date"
                      name="pay_period_end"
                      required
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Payment Date</label>
                    <input
                      type="date"
                      name="payment_date"
                      required
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Ordinary Hours</label>
                    <input
                      type="number"
                      name="ordinary_hours"
                      step="0.01"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Allowances ($)</label>
                    <input
                      type="number"
                      name="allowances"
                      step="0.01"
                      defaultValue={0}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Bonuses ($)</label>
                    <input
                      type="number"
                      name="bonuses"
                      step="0.01"
                      defaultValue={0}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  >
                    Create Pay Run
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPayRunForm(false)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Pay Run List */}
            <div className="space-y-3">
              {loadingPayRuns ? (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center text-gray-400">
                  Loading...
                </div>
              ) : payRuns.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center text-gray-400">
                  No pay runs yet
                </div>
              ) : (
                payRuns.map((pr) => (
                  <div
                    key={pr.id}
                    className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex justify-between items-start"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">
                          {pr.pay_period_start} to {pr.pay_period_end}
                        </span>
                        {getStatusBadge(pr.status)}
                      </div>
                      <div className="text-sm text-gray-400 space-y-1">
                        <div>Payment Date: {pr.payment_date}</div>
                        <div>FY {pr.financial_year}</div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm mt-3">
                        <div>
                          <div className="text-gray-500">Gross</div>
                          <div className="font-semibold">{formatCurrency(pr.gross_earnings)}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Tax Withheld</div>
                          <div className="font-semibold text-red-400">
                            {formatCurrency(pr.tax_withheld)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Super</div>
                          <div className="font-semibold text-blue-400">
                            {formatCurrency(pr.super_employer_contribution)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Net Pay</div>
                          <div className="font-semibold text-emerald-400">
                            {formatCurrency(pr.net_pay)}
                          </div>
                        </div>
                      </div>
                    </div>
                    {pr.status === 'draft' && (
                      <button
                        onClick={() => handleFinalizePayRun(pr.id)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Finalize
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Submissions Tab */}
        {activeTab === 'submissions' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">STP Submissions ({submissions.length})</h2>
              <button
                onClick={() => setShowSubmissionForm(!showSubmissionForm)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Create Submission
              </button>
            </div>

            {/* Submission Form */}
            {showSubmissionForm && (
              <form
                onSubmit={handleCreateSubmission}
                className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4"
              >
                <h3 className="font-semibold text-lg">New STP Submission</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Submission Type</label>
                    <select
                      name="submission_type"
                      required
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100"
                    >
                      <option value="update">Update (Regular)</option>
                      <option value="finalisation">Finalisation (End of Year)</option>
                      <option value="amendment">Amendment (Correction)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Pay Event Date</label>
                    <input
                      type="date"
                      name="pay_event_date"
                      required
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Financial Year</label>
                    <input
                      type="number"
                      name="financial_year"
                      required
                      defaultValue={new Date().getFullYear() + 1}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Payer ABN</label>
                    <input
                      type="text"
                      name="payer_abn"
                      required
                      placeholder="51 824 753 556"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm text-gray-400 mb-1">Payer Name</label>
                    <input
                      type="text"
                      name="payer_name"
                      required
                      placeholder="Your Company Name"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100"
                    />
                  </div>
                </div>
                <div className="bg-blue-950/30 border border-blue-500/30 rounded p-3 text-sm text-blue-300">
                  <AlertCircle className="h-4 w-4 inline mr-2" />
                  This will submit all finalized pay runs for the selected pay event date.
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  >
                    Create Submission
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSubmissionForm(false)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Submission List */}
            <div className="space-y-3">
              {loadingSubmissions ? (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center text-gray-400">
                  Loading...
                </div>
              ) : submissions.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center text-gray-400">
                  No submissions yet
                </div>
              ) : (
                submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="bg-gray-900 border border-gray-800 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold capitalize">
                            {sub.submission_type} - FY {sub.financial_year}
                          </span>
                          {getStatusBadge(sub.status)}
                        </div>
                        <div className="text-sm text-gray-400">
                          Pay Event: {sub.pay_event_date} | Submitted:{' '}
                          {new Date(sub.submission_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Employees</div>
                        <div className="font-semibold">{sub.employee_count}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Gross Earnings</div>
                        <div className="font-semibold">
                          {formatCurrency(sub.total_gross_earnings)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Tax Withheld</div>
                        <div className="font-semibold text-red-400">
                          {formatCurrency(sub.total_tax_withheld)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Submission ID</div>
                        <div className="font-mono text-xs text-gray-400">{sub.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
