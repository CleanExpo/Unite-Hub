import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="p-4 border-b">
        <Skeleton className="h-10 w-64" />
      </div>

      <div className="flex-1 overflow-hidden flex">
        <div className="w-80 border-r flex flex-col h-full">
          <div className="p-4 border-b">
            <Skeleton className="h-9 w-full mb-2" />
            <Skeleton className="h-8 w-full" />
          </div>

          <div className="p-2">
            <Skeleton className="h-8 w-full mb-1" />
            <Skeleton className="h-8 w-full mb-1" />
            <Skeleton className="h-8 w-full mb-1" />
            <Skeleton className="h-8 w-full mb-1" />
          </div>

          <div className="p-2 flex-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="mb-2">
                <Skeleton className="h-20 w-full rounded-md" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  )
}
