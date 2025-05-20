import { Skeleton } from "@/components/ui/skeleton"

export default function BlogPostLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#001428] to-[#00253e] py-16 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto">
              <Skeleton className="h-8 w-32 mb-6 bg-[#002a42]" />
              <Skeleton className="h-12 w-full mb-4 bg-[#002a42]" />
              <Skeleton className="h-12 w-3/4 mb-6 bg-[#002a42]" />
              <div className="flex flex-wrap items-center gap-6 mb-8">
                <div className="flex items-center">
                  <Skeleton className="h-10 w-10 rounded-full mr-3 bg-[#002a42]" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-1 bg-[#002a42]" />
                    <Skeleton className="h-3 w-16 bg-[#002a42]" />
                  </div>
                </div>
                <Skeleton className="h-4 w-24 bg-[#002a42]" />
                <Skeleton className="h-4 w-24 bg-[#002a42]" />
              </div>
            </div>
          </div>
        </section>

        {/* Featured Image */}
        <section className="py-8 bg-[#001428]">
          <div className="container px-4 md:px-6 mx-auto">
            <Skeleton className="h-[300px] md:h-[500px] rounded-lg bg-[#002a42]" />
          </div>
        </section>

        {/* Article Content */}
        <section className="py-16 md:py-24 bg-[#001428]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2">
                <article className="prose prose-invert prose-lg max-w-none">
                  <Skeleton className="h-6 w-full mb-4 bg-[#002a42]" />
                  <Skeleton className="h-6 w-11/12 mb-4 bg-[#002a42]" />
                  <Skeleton className="h-6 w-10/12 mb-8 bg-[#002a42]" />

                  <Skeleton className="h-8 w-64 mb-4 bg-[#002a42]" />
                  <Skeleton className="h-6 w-full mb-4 bg-[#002a42]" />
                  <Skeleton className="h-6 w-full mb-4 bg-[#002a42]" />
                  <Skeleton className="h-6 w-3/4 mb-8 bg-[#002a42]" />

                  <Skeleton className="h-8 w-64 mb-4 bg-[#002a42]" />
                  <Skeleton className="h-6 w-full mb-4 bg-[#002a42]" />
                  <Skeleton className="h-6 w-full mb-4 bg-[#002a42]" />
                  <Skeleton className="h-6 w-11/12 mb-4 bg-[#002a42]" />
                  <Skeleton className="h-6 w-10/12 mb-8 bg-[#002a42]" />
                </article>

                {/* Tags */}
                <div className="mt-12 pt-8 border-t border-[#4ecdc4]/20">
                  <Skeleton className="h-6 w-24 mb-4 bg-[#002a42]" />
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-8 w-24 rounded-full bg-[#002a42]" />
                    <Skeleton className="h-8 w-32 rounded-full bg-[#002a42]" />
                    <Skeleton className="h-8 w-28 rounded-full bg-[#002a42]" />
                  </div>
                </div>

                {/* Share */}
                <div className="mt-8 pt-8 border-t border-[#4ecdc4]/20">
                  <Skeleton className="h-6 w-48 mb-4 bg-[#002a42]" />
                  <div className="flex space-x-4">
                    <Skeleton className="h-10 w-10 rounded-md bg-[#002a42]" />
                    <Skeleton className="h-10 w-10 rounded-md bg-[#002a42]" />
                    <Skeleton className="h-10 w-10 rounded-md bg-[#002a42]" />
                    <Skeleton className="h-10 w-10 rounded-md bg-[#002a42]" />
                  </div>
                </div>

                {/* Author Bio */}
                <div className="mt-12 bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20">
                  <div className="flex items-start space-x-4">
                    <Skeleton className="h-16 w-16 rounded-full bg-[#001428]" />
                    <div className="flex-1">
                      <Skeleton className="h-6 w-48 mb-2 bg-[#001428]" />
                      <Skeleton className="h-4 w-32 mb-2 bg-[#001428]" />
                      <Skeleton className="h-4 w-full mb-1 bg-[#001428]" />
                      <Skeleton className="h-4 w-full mb-1 bg-[#001428]" />
                      <Skeleton className="h-4 w-3/4 bg-[#001428]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                {/* Related Posts */}
                <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20 mb-8">
                  <Skeleton className="h-6 w-48 mb-4 bg-[#001428]" />
                  <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-start space-x-4">
                        <Skeleton className="w-20 h-20 rounded-md flex-shrink-0 bg-[#001428]" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-full mb-1 bg-[#001428]" />
                          <Skeleton className="h-4 w-full mb-1 bg-[#001428]" />
                          <Skeleton className="h-3 w-24 bg-[#001428]" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20 mb-8">
                  <Skeleton className="h-6 w-32 mb-4 bg-[#001428]" />
                  <ul className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <li key={i}>
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-32 bg-[#001428]" />
                          <Skeleton className="h-6 w-8 rounded-full bg-[#001428]" />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Newsletter */}
                <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20">
                  <Skeleton className="h-6 w-48 mb-4 bg-[#001428]" />
                  <Skeleton className="h-4 w-full mb-4 bg-[#001428]" />
                  <Skeleton className="h-10 w-full mb-4 rounded-md bg-[#001428]" />
                  <Skeleton className="h-10 w-full rounded-md bg-[#001428]" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
