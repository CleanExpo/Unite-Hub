"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Smartphone, Laptop, Calendar, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Device {
  id: string;
  ip_address: string;
  user_agent: string;
  last_used: string;
  expires_at: string;
  created_at: string;
}

export default function DevicesPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getSession();

        if (!user) {
          router.push("/login");
          return;
        }

        // Get user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        // If not admin, redirect
        if (profile?.role !== "admin") {
          router.push("/synthex/dashboard");
          return;
        }

        // Fetch trusted devices
        const response = await fetch("/api/admin/trusted-devices");
        const data = await response.json();

        if (data.success) {
          setDevices(data.devices);
        } else {
          setError(data.error || "Failed to fetch devices");
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching devices:", err);
        setError("Failed to load devices");
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleRevokeDevice = async (deviceId: string) => {
    if (!confirm("Are you sure you want to revoke this device? You'll need approval to access from this device again.")) {
      return;
    }

    setRevoking(deviceId);

    try {
      const response = await fetch(
        `/api/admin/trusted-devices?device_id=${deviceId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.success) {
        // Remove device from list
        setDevices(devices.filter((d) => d.id !== deviceId));
      } else {
        setError(data.error || "Failed to revoke device");
      }
    } catch (err) {
      console.error("Error revoking device:", err);
      setError("Failed to revoke device");
    } finally {
      setRevoking(null);
    }
  };

  const getDeviceType = (userAgent: string) => {
    if (userAgent.toLowerCase().includes("mobile") || userAgent.toLowerCase().includes("android") || userAgent.toLowerCase().includes("iphone")) {
      return { icon: Smartphone, label: "Mobile" };
    }
    return { icon: Laptop, label: "Desktop" };
  };

  const getDeviceName = (userAgent: string) => {
    // Extract basic device info from user agent
    if (userAgent.toLowerCase().includes("chrome")) return "Chrome Browser";
    if (userAgent.toLowerCase().includes("firefox")) return "Firefox Browser";
    if (userAgent.toLowerCase().includes("safari")) return "Safari Browser";
    if (userAgent.toLowerCase().includes("edge")) return "Edge Browser";
    return "Browser";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isExpiringSoon = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const daysRemaining = (expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysRemaining < 7;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-slate-800 border-slate-700">
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-700 mb-4">
                <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-slate-300">Loading devices...</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/crm"
              className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block"
            >
              ← Back to CRM
            </Link>
            <h1 className="text-3xl font-bold text-white">
              Trusted Devices
            </h1>
            <p className="text-slate-400">Manage your approved devices for CRM access</p>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-400">Error</h3>
                <p className="text-sm text-red-200">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Devices List */}
        {devices.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <div className="p-8 text-center">
              <Smartphone className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-300 mb-2">
                No Trusted Devices
              </h3>
              <p className="text-slate-400 mb-4">
                You don't have any approved devices yet. They'll appear here once you approve a device.
              </p>
              <Link href="/crm">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Return to CRM
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {devices.map((device) => {
              const { icon: DeviceIcon, label } = getDeviceType(device.user_agent);
              const deviceName = getDeviceName(device.user_agent);
              const expiringSoon = isExpiringSoon(device.expires_at);

              return (
                <Card
                  key={device.id}
                  className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10">
                          <DeviceIcon className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-1">
                            {deviceName}
                          </h3>
                          <p className="text-sm text-slate-400">
                            {label} • {device.ip_address}
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleRevokeDevice(device.id)}
                        disabled={revoking === device.id}
                        variant="destructive"
                        size="sm"
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {revoking === device.id ? (
                          "Revoking..."
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-1" />
                            Revoke
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Device Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-slate-400 mb-1">Added</p>
                        <p className="text-white">
                          {formatDate(device.created_at)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 mb-1">Last Used</p>
                        <p className="text-white">
                          {formatDate(device.last_used)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 mb-1 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Expires
                        </p>
                        <p
                          className={
                            expiringSoon ? "text-yellow-400" : "text-white"
                          }
                        >
                          {formatDate(device.expires_at)}
                        </p>
                      </div>
                    </div>

                    {/* Expiration Warning */}
                    {expiringSoon && (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2 text-xs text-yellow-200 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>This device will expire soon. You'll need approval when accessing again.</span>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Info Section */}
        <Card className="bg-slate-700/50 border-slate-600 mt-8">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              About Trusted Devices
            </h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-3">
                <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 flex-shrink-0" />
                <span>Devices are trusted for 90 days from the approval date</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 flex-shrink-0" />
                <span>Revoking a device means you'll need Phill's approval when using it again</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 flex-shrink-0" />
                <span>Each device is identified by a unique fingerprint (user agent + IP address)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 flex-shrink-0" />
                <span>All access attempts are logged for security auditing</span>
              </li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
