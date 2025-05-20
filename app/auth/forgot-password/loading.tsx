import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className="relative bg-gradient-to-br from-[#001428] to-[#00253e] py-16 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-md mx-auto">
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-8 border border-[#4ecdc4]/20">
                <div className="mb-6">
                  <Skeleton className="h-6 w-24" />
                </div>
                <div className="mb-6 text-center">
                  <Skeleton className="h-8 w-48 mx-auto" />
                  <Skeleton className="h-4 w-64 mx-auto mt-2" />
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <Skeleton className="h-11 w-full" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
