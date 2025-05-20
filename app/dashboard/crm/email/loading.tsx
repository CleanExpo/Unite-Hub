import { Skeleton } from "@/components/ui/skeleton"

export default function EmailLoading() {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="p-4 border-b">
        <Skeleton className="h-10 w-64" />
      </div>

      <div className="flex-1 overflow-hidden flex">
        <div className="w-80 border-r border-gray-200 p-4">
          <Skeleton className="h-10 w-full mb-4" />

          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 p-6">
          <div className="max-w-3xl mx-auto">
            <Skeleton className="h-8 w-3/4 mb-6" />

            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24 mt-1" />
                    </div>
                  </div>
                  <Skeleton className="h-24 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
