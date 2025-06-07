import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BlogCard } from "@/components/blog/BlogCard";
import { NewsletterSubscribe } from "@/components/blog/NewsletterSubscribe";
import { motion } from "framer-motion";
import { 
  Search, 
  Filter, 
  BookOpen, 
  TrendingUp,
  Calendar,
  Eye,
  ChevronRight
} from "lucide-react";
import {
  getBlogPosts,
  getBlogCategories,
  getBlogTags,
  getFeaturedPosts,
  getPopularPosts
} from "@/lib/services/blog";

export const metadata: Metadata = {
  title: "Blog & Resources | Unite Group - Business Insights",
  description: "Explore our latest articles on business strategy, technology, SEO, and digital transformation. Get insights from industry experts.",
};

export default async function BlogPage({
  searchParams
}: {
  searchParams: { category?: string; tag?: string; search?: string; page?: string }
}) {
  const currentPage = parseInt(searchParams.page || '1');
  const postsPerPage = 9;

  // Fetch data
  const [posts, categories, tags, featuredPosts, popularPosts] = await Promise.all([
    getBlogPosts({
      category: searchParams.category,
      tag: searchParams.tag,
      search: searchParams.search,
      limit: postsPerPage,
      offset: (currentPage - 1) * postsPerPage
    }),
    getBlogCategories(),
    getBlogTags(),
    getFeaturedPosts(3),
    getPopularPosts(5)
  ]);

  const totalPosts = posts.length; // In a real app, you'd get total count from DB
  const totalPages = Math.ceil(totalPosts / postsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-600/20 to-cyan-600/20 animate-pulse" />
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex p-3 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-full mb-6">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Blog & Resources
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
              Insights, tutorials, and strategies to help you grow your business 
              and stay ahead of the competition
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <form action="/blog" method="get" className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    name="search"
                    type="search"
                    placeholder="Search articles..."
                    defaultValue={searchParams.search}
                    className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 h-12"
                  />
                </div>
                <Button type="submit" className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 h-12">
                  Search
                </Button>
              </form>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories Filter */}
      <section className="py-8 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            <Link href="/blog">
              <Badge 
                variant={!searchParams.category ? "default" : "secondary"}
                className="whitespace-nowrap cursor-pointer hover:bg-teal-600 hover:text-white transition-colors"
              >
                All Posts
              </Badge>
            </Link>
            {categories.map((category) => (
              <Link key={category.id} href={`/blog?category=${category.slug}`}>
                <Badge
                  variant={searchParams.category === category.slug ? "default" : "secondary"}
                  className="whitespace-nowrap cursor-pointer hover:bg-teal-600 hover:text-white transition-colors"
                  style={searchParams.category === category.slug ? { backgroundColor: category.color } : {}}
                >
                  {category.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Blog Posts */}
            <div className="lg:col-span-2">
              {/* Featured Posts */}
              {currentPage === 1 && !searchParams.category && !searchParams.tag && !searchParams.search && featuredPosts.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-teal-400" />
                    Featured Articles
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {featuredPosts.map((post) => (
                      <BlogCard key={post.id} post={post} featured />
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Posts */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-teal-400" />
                  {searchParams.category ? `${categories.find(c => c.slug === searchParams.category)?.name} Articles` : 'Latest Articles'}
                </h2>
                
                {posts.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {posts.map((post, index) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                      >
                        <BlogCard post={post} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-400 text-lg">No articles found.</p>
                    <Button asChild className="mt-4">
                      <Link href="/blog">View All Articles</Link>
                    </Button>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex justify-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Link
                        key={page}
                        href={`/blog?${new URLSearchParams({
                          ...searchParams,
                          page: page.toString()
                        }).toString()}`}
                      >
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          className={currentPage === page ? "bg-teal-600 hover:bg-teal-700" : ""}
                        >
                          {page}
                        </Button>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Newsletter */}
              <NewsletterSubscribe variant="card" showCategories />

              {/* Popular Posts */}
              {popularPosts.length > 0 && (
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Eye className="h-5 w-5 text-teal-400" />
                    Popular Articles
                  </h3>
                  <div className="space-y-4">
                    {popularPosts.map((post) => (
                      <Link
                        key={post.id}
                        href={`/blog/${post.slug}`}
                        className="block group"
                      >
                        <h4 className="font-medium text-white group-hover:text-teal-400 transition-colors mb-1">
                          {post.title}
                        </h4>
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                          <span>{post.views.toLocaleString()} views</span>
                          {post.reading_time && (
                            <span>{post.reading_time} min read</span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {tags.length > 0 && (
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Filter className="h-5 w-5 text-teal-400" />
                    Popular Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Link key={tag.id} href={`/blog?tag=${tag.slug}`}>
                        <Badge
                          variant="secondary"
                          className="cursor-pointer hover:bg-teal-600 hover:text-white transition-colors"
                        >
                          {tag.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-teal-600 to-cyan-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl mb-8 text-teal-100">
              Let our expertise guide your digital transformation journey
            </p>
            <Button asChild size="lg" className="bg-white text-teal-600 hover:bg-slate-100">
              <Link href="/book-consultation">
                Book Your $550 Consultation
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
