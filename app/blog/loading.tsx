import { Skeleton } from "@/components/ui/skeleton"

export default function BlogLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#001428] to-[#00253e] py-16 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto text-center">
              <Skeleton className="h-12 w-3/4 mx-auto bg-[#002a42]" />
              <Skeleton className="h-6 w-1/2 mx-auto mt-6 bg-[#002a42]" />
            </div>
          </div>
        </section>

        {/* Featured Posts Section */}
        <section className="py-16 md:py-24 bg-[#001428]">
          <div className="container px-4 md:px-6 mx-auto">
            <Skeleton className="h-10 w-64 mb-8 bg-[#002a42]" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg overflow-hidden border border-[#4ecdc4]/20"
                >
                  <Skeleton className="h-64 w-full bg-[#002a42]" />
                  <div className="p-6">
                    <Skeleton className="h-8 w-3/4 mb-3 bg-[#001428]" />
                    <Skeleton className="h-4 w-full mb-2 bg-[#001428]" />
                    <Skeleton className="h-4 w-full mb-4 bg-[#001428]" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Skeleton className="h-10 w-10 rounded-full mr-3 bg-[#001428]" />
                        <div>
                          <Skeleton className="h-4 w-24 mb-1 bg-[#001428]" />
                          <Skeleton className="h-3 w-16 bg-[#001428]" />
                        </div>
                      </div>
                      <Skeleton className="h-4 w-24 bg-[#001428]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* All Posts Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-[#002a42] to-[#00395d]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <Skeleton className="h-10 w-48 mb-4 md:mb-0 bg-[#001428]" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-10 w-32 rounded-full bg-[#001428]" />
                <Skeleton className="h-10 w-32 rounded-full bg-[#001428]" />
                <Skeleton className="h-10 w-32 rounded-full bg-[#001428]" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-gradient-to-br from-[#001428] to-[#00253e] rounded-lg overflow-hidden border border-[#4ecdc4]/20"
                >
                  <Skeleton className="h-48 w-full bg-[#002a42]" />
                  <div className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2 bg-[#002a42]" />
                    <Skeleton className="h-4 w-full mb-4 bg-[#002a42]" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Skeleton className="h-8 w-8 rounded-full mr-2 bg-[#002a42]" />
                        <Skeleton className="h-4 w-20 bg-[#002a42]" />
                      </div>
                      <Skeleton className="h-4 w-16 bg-[#002a42]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
