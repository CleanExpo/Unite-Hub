"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DownloadCloud, CreditCard, FileText } from "lucide-react";

export default function BillingPage() {
  const invoices = [
    { id: "INV-001", date: "2024-11-01", amount: "$299.00", status: "Paid", dueDate: "2024-11-15" },
    { id: "INV-002", date: "2024-10-01", amount: "$299.00", status: "Paid", dueDate: "2024-10-15" },
    { id: "INV-003", date: "2024-09-01", amount: "$99.00", status: "Paid", dueDate: "2024-09-15" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Billing & Invoices</h1>
          <p className="text-slate-400">Manage your subscription and download invoices</p>
        </div>

        {/* Current Plan */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Current Plan</CardTitle>
            <CardDescription>Professional Plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-slate-400 text-sm">Monthly Cost</p>
                <p className="text-2xl font-bold text-white">$299</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Billing Cycle</p>
                <p className="text-2xl font-bold text-white">Monthly</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Next Renewal</p>
                <p className="text-2xl font-bold text-white">Dec 1, 2024</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Status</p>
                <Badge className="mt-2 bg-green-600">Active</Badge>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-6 flex gap-3">
              <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                <CreditCard className="w-4 h-4" />
                Update Payment Method
              </Button>
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                Change Plan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Invoice History */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Invoice History</CardTitle>
            <CardDescription>Download and view your past invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-700/50">
                  <TableHead className="text-slate-300">Invoice ID</TableHead>
                  <TableHead className="text-slate-300">Date</TableHead>
                  <TableHead className="text-slate-300">Amount</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Due Date</TableHead>
                  <TableHead className="text-slate-300">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id} className="border-slate-700 hover:bg-slate-700/50">
                    <TableCell className="text-white font-mono">{invoice.id}</TableCell>
                    <TableCell className="text-slate-400">{invoice.date}</TableCell>
                    <TableCell className="text-white font-semibold">{invoice.amount}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-600/20 text-green-300 border-green-600/30">
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400">{invoice.dueDate}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300">
                        <DownloadCloud className="w-4 h-4 mr-1" />
                        PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Billing Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Billing Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-slate-300">
                <p className="font-semibold">Duncan's Marketing Agency</p>
                <p>123 Business St</p>
                <p>New York, NY 10001</p>
                <p>United States</p>
                <Button variant="outline" className="mt-4 border-slate-600 text-slate-300 w-full">
                  Edit Address
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-slate-700 rounded p-4 border border-slate-600">
                  <p className="text-sm text-slate-400 mb-2">Visa ending in 4242</p>
                  <p className="text-white font-semibold">Expires 12/26</p>
                </div>
                <Button variant="outline" className="w-full border-slate-600 text-slate-300">
                  Update Payment Method
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Billing FAQ */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Billing FAQ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold text-white mb-2">When will I be charged?</p>
              <p className="text-slate-400 text-sm">
                You'll be charged on the same day each month. For example, if you signed up on the 15th, you'll be charged on the 15th of every month.
              </p>
            </div>
            <div className="border-t border-slate-700 pt-4">
              <p className="font-semibold text-white mb-2">Can I change my plan?</p>
              <p className="text-slate-400 text-sm">
                Yes! You can upgrade or downgrade your plan anytime. Changes take effect immediately.
              </p>
            </div>
            <div className="border-t border-slate-700 pt-4">
              <p className="font-semibold text-white mb-2">Do you offer annual billing?</p>
              <p className="text-slate-400 text-sm">
                Yes! Annual billing is available at a 15% discount. Contact sales for details.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
