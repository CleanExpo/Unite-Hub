'use client';

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NewsletterSubscribe } from "@/components/blog/NewsletterSubscribe";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  User, 
  Eye, 
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  ArrowLeft,
  BookOpen,
  Tag
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { BlogPost } from "@/types/blog";

interface BlogPostContentProps {
  post: BlogPost & {
    category?: any;
    author?: any;
    tags?: any[];
  };
  relatedPosts: BlogPost[];
  authorPosts: BlogPost[];
}

export function BlogPostContent({ post, relatedPosts, authorPosts }: BlogPostContentProps) {
  const publishedDate = post.published_at 
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Draft';

  const timeAgo = post.published_at
    ? formatDistanceToNow(new Date(post.published_at), { addSuffix: true })
    : '';

  // Social share URLs
  const shareUrl = `https://unitegroup.com.au/blog/${post.slug}`;
  const shareTitle = encodeURIComponent(post.title);
  
  const socialLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`
  };

  return (
    <article className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-600/20 to-cyan-600/20 animate-pulse" />
        
        {post.featured_image && (
          <div className="absolute inset-0 opacity-20">
            <Image
              src={post.featured_image}
              alt={post.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className="relative max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>

            {post.category && (
              <Badge 
                style={{ backgroundColor: post.category.color }}
                className="text-white mb-4"
              >
                {post.category.name}
              </Badge>
            )}

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-xl text-slate-300 mb-8">
                {post.excerpt}
              </p>
            )}

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-6 text-slate-400">
              {post.author && (
                <div className="flex items-center gap-2">
                  {post.author.avatar_url ? (
                    <Image
                      src={post.author.avatar_url}
                      alt={post.author.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  )}
                  <div>
                    <p className="text-white font-medium">{post.author.name}</p>
                    <p className="text-sm">{timeAgo}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{publishedDate}</span>
              </div>

              {post.reading_time && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{post.reading_time} min read</span>
                </div>
              )}

              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{(post.views + 1).toLocaleString()} views</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Article Content */}
            <div className="lg:col-span-2">
              {post.featured_image && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                  className="mb-12"
                >
                  <Image
                    src={post.featured_image}
                    alt={post.title}
                    width={800}
                    height={450}
                    className="rounded-xl w-full"
                  />
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="prose prose-lg prose-invert max-w-none"
              >
                <div 
                  dangerouslySetInnerHTML={{ __html: post.content }}
                  className="
                    [&>h2]:text-3xl [&>h2]:font-bold [&>h2]:text-white [&>h2]:mt-12 [&>h2]:mb-6
                    [&>h3]:text-2xl [&>h3]:font-bold [&>h3]:text-white [&>h3]:mt-8 [&>h3]:mb-4
                    [&>h4]:text-xl [&>h4]:font-bold [&>h4]:text-white [&>h4]:mt-6 [&>h4]:mb-3
                    [&>p]:text-slate-300 [&>p]:mb-6 [&>p]:leading-relaxed
                    [&>ul]:text-slate-300 [&>ul]:mb-6 [&>ul]:space-y-2
                    [&>ol]:text-slate-300 [&>ol]:mb-6 [&>ol]:space-y-2
                    [&>li]:text-slate-300 [&>li]:ml-6
                    [&>blockquote]:border-l-4 [&>blockquote]:border-teal-600 [&>blockquote]:pl-6 [&>blockquote]:italic [&>blockquote]:text-slate-400
                    [&>pre]:bg-slate-800 [&>pre]:rounded-lg [&>pre]:p-4 [&>pre]:overflow-x-auto
                    [&>code]:bg-slate-800 [&>code]:text-teal-400 [&>code]:px-2 [&>code]:py-1 [&>code]:rounded
                    [&>a]:text-teal-400 [&>a]:hover:text-teal-300 [&>a]:transition-colors
                    [&>img]:rounded-lg [&>img]:my-8
                  "
                />
              </motion.div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="mt-12"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Tag className="h-5 w-5 text-teal-400" />
                    <h3 className="text-lg font-bold text-white">Tags</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <Link key={tag.id} href={`/blog?tag=${tag.slug}`}>
                        <Badge variant="secondary" className="cursor-pointer hover:bg-teal-600 hover:text-white transition-colors">
                          {tag.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Share Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-12 pt-12 border-t border-slate-700"
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-teal-400" />
                    <span className="text-white font-medium">Share this article</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="w-10 h-10 p-0 border-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600"
                    >
                      <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                        <Facebook className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="w-10 h-10 p-0 border-slate-700 hover:bg-sky-500 hover:text-white hover:border-sky-500"
                    >
                      <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                        <Twitter className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="w-10 h-10 p-0 border-slate-700 hover:bg-blue-700 hover:text-white hover:border-blue-700"
                    >
                      <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-10 h-10 p-0 border-slate-700"
                      onClick={() => navigator.clipboard.writeText(shareUrl)}
                    >
                      <LinkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>

              {/* Author Bio */}
              {post.author && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="mt-12 p-8 bg-slate-800 rounded-xl border border-slate-700"
                >
                  <h3 className="text-xl font-bold text-white mb-4">About the Author</h3>
                  <div className="flex gap-4">
                    {post.author.avatar_url ? (
                      <Image
                        src={post.author.avatar_url}
                        alt={post.author.name}
                        width={80}
                        height={80}
                        className="rounded-full flex-shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 flex items-center justify-center flex-shrink-0">
                        <User className="h-10 w-10 text-white" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-lg font-bold text-white mb-2">{post.author.name}</h4>
                      {post.author.bio && (
                        <p className="text-slate-300 mb-3">{post.author.bio}</p>
                      )}
                      <div className="flex gap-3">
                        {post.author.linkedin_url && (
                          <a
                            href={post.author.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-400 hover:text-teal-300 transition-colors"
                          >
                            <Linkedin className="h-5 w-5" />
                          </a>
                        )}
                        {post.author.twitter_url && (
                          <a
                            href={post.author.twitter_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-400 hover:text-teal-300 transition-colors"
                          >
                            <Twitter className="h-5 w-5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Newsletter */}
              <NewsletterSubscribe variant="card" />

              {/* Related Posts */}
              {relatedPosts.length > 0 && (
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-teal-400" />
                    Related Articles
                  </h3>
                  <div className="space-y-4">
                    {relatedPosts.map((relatedPost) => (
                      <Link
                        key={relatedPost.id}
                        href={`/blog/${relatedPost.slug}`}
                        className="block group"
                      >
                        <h4 className="font-medium text-white group-hover:text-teal-400 transition-colors mb-1">
                          {relatedPost.title}
                        </h4>
                        <p className="text-sm text-slate-400 line-clamp-2">
                          {relatedPost.excerpt}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* More from Author */}
              {authorPosts.length > 0 && post.author && (
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-xl font-bold text-white mb-4">
                    More from {post.author.name}
                  </h3>
                  <div className="space-y-4">
                    {authorPosts.filter(p => p.id !== post.id).map((authorPost) => (
                      <Link
                        key={authorPost.id}
                        href={`/blog/${authorPost.slug}`}
                        className="block group"
                      >
                        <h4 className="font-medium text-white group-hover:text-teal-400 transition-colors mb-1">
                          {authorPost.title}
                        </h4>
                        <p className="text-sm text-slate-400">
                          {authorPost.reading_time} min read
                        </p>
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
              Need Expert Guidance?
            </h2>
            <p className="text-xl mb-8 text-teal-100">
              Let&apos;s discuss how we can help transform your business
            </p>
            <Button asChild size="lg" className="bg-white text-teal-600 hover:bg-slate-100">
              <Link href="/book-consultation">
                Book Your $550 Consultation
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </article>
  );
}
