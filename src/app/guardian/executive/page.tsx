 "use client";

 import { useEffect, useMemo, useState } from "react";
 import { narrativeService } from "@/lib/guardian/services/narrativeService";
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

 const renderStatus = (status?: string) => {
   const normalized = status ? status.toLowerCase() : "unknown";
   const palette: Record<string, string> = {
     operational: "bg-success-100 text-success-800",
     degraded: "bg-warning-100 text-warning-900",
     "at-risk": "bg-error-100 text-error-800",
     unknown: "bg-bg-hover text-text-secondary",
   };
   return (
     <span
       className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
         palette[normalized] ?? palette["unknown"]
       }`}
     >
       {status ?? "unknown"}
     </span>
   );
 };

 const GuardianExecutivePage = () => {
   const { workspaceId } = useWorkspace();
   const [readiness, setReadiness] = useState<GuardianReadiness | null>(null);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");

   useEffect(() => {
     if (!workspaceId) {
       return;
     }

     let aborted = false;
     setLoading(true);
     setError("");

     fetch(
       `/api/guardian/meta/readiness?workspaceId=${encodeURIComponent(
         workspaceId
       )}`
     )
       .then(async (res) => {
         if (!res.ok) {
           throw new Error("Unable to load readiness");
         }
         const payload = await res.json();
         if (!aborted) {
           setReadiness(payload?.readiness ?? null);
         }
       })
       .catch((err) => {
         if (!aborted) {
           setError(err.message ?? "Unknown error");
         }
       })
       .finally(() => {
         if (!aborted) {
           setLoading(false);
         }
       });

     return () => {
       aborted = true;
     };
   }, [workspaceId]);

   const narrative = useMemo(() => {
     if (!readiness) {
       return "";
     }
     try {
       return narrativeService.generateExecutiveBrief({
         readinessSnapshot: readiness,
       });
     } catch (err) {
       return "";
     }
   }, [readiness]);

   if (!workspaceId) {
     return (
       <div className="px-6 py-8 space-y-4">
         <p className="text-sm text-text-muted">
           Pending workspace selection...
         </p>
       </div>
     );
   }

   return (
     <div className="px-6 py-8 space-y-6">
       <header className="space-y-2">
         <p className="text-sm uppercase tracking-[0.2em] text-text-tertiary">
           Guardian
         </p>
         <h1 className="text-3xl font-semibold">Executive Overview</h1>
       </header>

       {loading && !readiness && (
         <p className="text-sm text-text-muted">Loading readiness...</p>
       )}

       {error && (
         <p className="text-sm text-error-500">Error: {error}</p>
       )}

       {!readiness && !loading && !error && (
         <div className="p-4 border border-dashed border-border rounded-lg bg-bg-hover">
           <p className="text-sm text-text-muted">
             No readiness data available yet.
           </p>
         </div>
       )}

       {readiness && (
         <div className="space-y-5">
           <div className="flex flex-wrap items-center gap-4">
             <div>
               <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
                 Overall Awareness
               </p>
               <p className="text-5xl font-bold">
                 {typeof readiness.overall_guardian_score === "number"
                   ? readiness.overall_guardian_score.toFixed(0)
                   : "—"}
               </p>
             </div>
             {renderStatus(readiness.overall_status)}
             <p className="text-xs text-text-tertiary">
               Computed {readiness.computed_at ?? "—"}
             </p>
           </div>

           {narrative && (
             <div className="p-4 rounded-lg bg-bg-base text-text-primary">
               <p className="text-sm leading-relaxed">{narrative}</p>
             </div>
           )}

           {readiness.capabilities?.length ? (
             <div className="space-y-3">
               <h2 className="text-lg font-semibold">Capabilities</h2>
               <div className="grid gap-3">
                 {readiness.capabilities.map((capability) => (
                   <div
                     key={capability.name}
                     className="p-3 border border-border rounded-lg bg-bg-card"
                   >
                     <div className="flex justify-between items-center">
                       <p className="font-medium">{capability.name}</p>
                       {renderStatus(capability.status)}
                     </div>
                     <p className="text-3xl font-semibold">
                       {Math.round(capability.score ?? 0)}
                     </p>

                     <p className="text-sm text-text-muted">
                       Score measured at {readiness.computed_at ?? "—"}
                     </p>
                   </div>
                 ))}
               </div>
             </div>
           ) : (
             <p className="text-sm text-text-tertiary">
               Capability data unavailable for this snapshot.
             </p>
           )}
         </div>
       )}
     </div>
   );
};

export default GuardianExecutivePage;
