import { Skeleton } from "@/components/ui/skeleton"

export default function PipelineLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001428] to-[#00253e] py-12">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Skeleton className="h-10 w-64 bg-[#4ecdc4]/10" />
            <Skeleton className="h-5 w-80 mt-2 bg-[#4ecdc4]/10" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-28 bg-[#4ecdc4]/10" />
            <Skeleton className="h-10 w-40 bg-[#4ecdc4]/10" />
          </div>
        </div>

        <div className="flex space-x-4 overflow-hidden">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="flex flex-col bg-[#00203a] p-3 rounded-md min-w-[320px] w-[320px]">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-6 w-32 bg-[#4ecdc4]/10" />
                  <Skeleton className="h-6 w-8 bg-[#4ecdc4]/10 rounded-full" />
                </div>

                <Skeleton className="h-10 w-full bg-[#4ecdc4]/10 mb-4" />

                <div className="space-y-3">
                  {Array(Math.floor(Math.random() * 5) + 1)
                    .fill(0)
                    .map((_, j) => (
                      <Skeleton key={j} className="h-32 w-full bg-[#4ecdc4]/10 rounded-md" />
                    ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
