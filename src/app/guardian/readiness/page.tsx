 "use client";

 import { useEffect, useMemo, useState } from "react";
 import { useWorkspace } from "@/hooks/useWorkspace";

 type GuardianCapability = {
   name: string;
   status: string;
   score: number;
 };

 type GuardianReadiness = {
   overall_guardian_score?: number;
   overall_status?: string;
   computed_at?: string;
   capabilities?: GuardianCapability[];
 };

 type ReadinessPayload = {
   success: boolean;
   readiness: GuardianReadiness | null;
 };

 const statusBadge = (status?: string) => {
   const normalized = status ? status.toLowerCase() : "unknown";
   const colors: Record<string, string> = {
     operational: "bg-emerald-100 text-emerald-800",
     degraded: "bg-amber-100 text-amber-900",
     "at-risk": "bg-rose-100 text-rose-800",
     unknown: "bg-slate-100 text-slate-800",
   };
   return (
     <span
       className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
         colors[normalized] ?? colors["unknown"]
       }`}
     >
       {status ?? "unknown"}
     </span>
   );
 };

 const GuardianReadinessPage = () => {
   const { workspaceId } = useWorkspace();
   const [readiness, setReadiness] = useState<GuardianReadiness | null>(null);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");

   useEffect(() => {
     if (!workspaceId) {
       return;
     }

     let isCancelled = false;
     setLoading(true);
     setError("");

     fetch(
       `/api/guardian/meta/readiness?workspaceId=${encodeURIComponent(
         workspaceId
       )}`
     )
       .then(async (res) => {
         if (!res.ok) {
           throw new Error("Failed to fetch readiness data");
         }
         const payload = (await res.json()) as ReadinessPayload;
         if (!isCancelled) {
           setReadiness(payload?.readiness ?? null);
         }
       })
       .catch((err) => {
         if (!isCancelled) {
           setError(err.message ?? "Unable to load readiness");
         }
       })
       .finally(() => {
         if (!isCancelled) {
           setLoading(false);
         }
       });

     return () => {
       isCancelled = true;
     };
   }, [workspaceId]);

   const capabilities = useMemo(
     () => readiness?.capabilities ?? [],
     [readiness?.capabilities]
   );

   if (!workspaceId) {
     return (
       <div className="px-6 py-8">
         <p className="text-sm text-slate-500">Select a workspace to continue.</p>
       </div>
     );
   }

   return (
     <div className="px-6 py-8 space-y-5">
       <header>
         <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
           Guardian
         </p>
         <h1 className="text-3xl font-semibold">Guardian Readiness Overview</h1>
       </header>

       {loading && (
         <p className="text-sm text-slate-500">Fetching readiness snapshot…</p>
       )}

       {error && (
         <p className="text-sm text-rose-500">Error: {error}</p>
       )}

       {!loading && !error && !readiness && (
         <div className="p-4 border border-dashed border-slate-200 rounded-lg bg-slate-50">
           <p className="text-sm text-slate-500">
             No readiness data available yet.
           </p>
         </div>
       )}

       {readiness && (
         <div className="space-y-6">
           <div className="grid md:grid-cols-3 gap-6">
             <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
               <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                 Overall score
               </p>
               <p className="text-4xl font-bold">
                 {typeof readiness.overall_guardian_score === "number"
                   ? readiness.overall_guardian_score.toFixed(0)
                   : "—"}
               </p>
             </div>
             <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
               <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                 Status
               </p>
               {statusBadge(readiness.overall_status)}
             </div>
             <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
               <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                 Snapshot
               </p>
               <p className="text-sm text-slate-500">
                 {readiness.computed_at ?? "—"}
               </p>
             </div>
           </div>

           {capabilities.length ? (
             <div className="space-y-3">
               <h2 className="text-lg font-semibold">Capability readiness</h2>
               <div className="grid gap-3">
                 {capabilities.map((capability) => (
                   <div
                     key={capability.name}
                     className="p-4 border border-slate-200 rounded-lg bg-white"
                   >
                     <div className="flex justify-between items-center">
                       <h3 className="font-medium">{capability.name}</h3>
                       {statusBadge(capability.status)}
                     </div>
                     <p className="text-3xl font-semibold">
                       {Math.round(capability.score ?? 0)}
                     </p>
                     <p className="text-sm text-slate-500">
                       Measured {readiness.computed_at ?? "—"}
                     </p>
                   </div>
                 ))}
               </div>
             </div>
           ) : (
             <p className="text-sm text-slate-400">
               Capability breakdown unavailable for this snapshot.
             </p>
           )}
         </div>
       )}
     </div>
   );
};

export default GuardianReadinessPage;
