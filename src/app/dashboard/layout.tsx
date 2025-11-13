"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { ClientProvider } from "@/contexts/ClientContext";
import ClientSelector from "@/components/client/ClientSelector";
import { Id } from "@/convex/_generated/dataModel";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [orgId, setOrgId] = useState<Id<"organizations"> | null>(null);

  useEffect(() => {
    // Get org ID from demo mode or session
    const demoOrgId = localStorage.getItem("demo_org_id");
    if (demoOrgId) {
      setOrgId(demoOrgId as Id<"organizations">);
    }
  }, []);

  const isActive = (href: string) => pathname.startsWith(href);

  if (!orgId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <ClientProvider orgId={orgId}>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
        {/* Top Navigation */}
        <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Unite-Hub
              </Link>
              <div className="hidden lg:flex gap-6">
                <NavLink href="/dashboard/overview" isActive={isActive("/dashboard/overview")}>
                  Dashboard
                </NavLink>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className={`${
                      isActive("/dashboard/campaigns")
                        ? "text-white"
                        : "text-slate-400 hover:text-white"
                    } h-auto px-2 py-1`}>
                      Campaigns
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-slate-800 border-slate-700">
                    <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                      <Link href="/dashboard/campaigns" className="w-full">Email Campaigns</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                      <Link href="/dashboard/campaigns/drip" className="w-full">Drip Sequences</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <NavLink href="/dashboard/contacts" isActive={isActive("/dashboard/contacts")}>
                  Contacts
                </NavLink>
                <NavLink href="/dashboard/workspaces" isActive={isActive("/dashboard/workspaces")}>
                  Workspaces
                </NavLink>
                <NavLink href="/billing" isActive={isActive("/billing")}>
                  Billing
                </NavLink>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <ClientSelector />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 border-slate-700 bg-slate-800 hover:bg-slate-700 text-white">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>DC</AvatarFallback>
                    </Avatar>
                    Duncan
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                  <DropdownMenuItem className="text-slate-300 hover:text-white">
                    <Link href="/dashboard/settings" className="w-full">
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-slate-300 hover:text-white">Profile</DropdownMenuItem>
                  <DropdownMenuItem className="text-slate-300 hover:text-white">Help</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-400">Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        {children}
      </div>
    </ClientProvider>
  );
}

function NavLink({ href, isActive, children }: { href: string; isActive: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`${
        isActive
          ? "text-white border-b-2 border-blue-500"
          : "text-slate-400 hover:text-white"
      } pb-1 transition`}
    >
      {children}
    </Link>
  );
}
