"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, User, Eye, ArrowRight } from "lucide-react";
import { BlogPostWithRelations } from "@/types/blog";
import { formatDistanceToNow } from "date-fns";

interface BlogCardProps {
  post: BlogPostWithRelations;
  featured?: boolean;
}

export function BlogCard({ post, featured = false }: BlogCardProps) {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full"
    >
      <Card className={`h-full bg-slate-800 border-slate-700 hover:border-teal-600 transition-all hover:shadow-xl group overflow-hidden ${
        featured ? 'md:col-span-2 lg:col-span-1' : ''
      }`}>
        <Link href={`/blog/${post.slug}`} className="block h-full">
          {/* Featured Image */}
          {post.featured_image && (
            <div className="relative h-48 md:h-56 overflow-hidden">
              <Image
                src={post.featured_image}
                alt={post.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {featured && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
                    Featured
                  </Badge>
                </div>
              )}
              {post.category && (
                <div className="absolute bottom-4 left-4">
                  <Badge 
                    style={{ backgroundColor: post.category.color }}
                    className="text-white"
                  >
                    {post.category.name}
                  </Badge>
                </div>
              )}
            </div>
          )}

          <CardContent className="p-6 flex flex-col h-full">
            {/* Meta Information */}
            <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
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
              {post.views > 0 && (
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{post.views.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Title */}
            <h3 className={`font-bold text-white mb-3 group-hover:text-teal-400 transition-colors ${
              featured ? 'text-2xl' : 'text-xl'
            }`}>
              {post.title}
            </h3>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-slate-300 mb-4 flex-grow line-clamp-3">
                {post.excerpt}
              </p>
            )}

            {/* Author and Read More */}
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-700">
              {post.author && (
                <div className="flex items-center gap-2">
                  {post.author.avatar_url ? (
                    <Image
                      src={post.author.avatar_url}
                      alt={post.author.name}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-white">
                      {post.author.name}
                    </p>
                    <p className="text-xs text-slate-400">{timeAgo}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center text-teal-400 group-hover:text-teal-300 text-sm font-medium">
                Read More
                <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {post.tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="text-xs"
                  >
                    {tag.name}
                  </Badge>
                ))}
                {post.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{post.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Link>
      </Card>
    </motion.div>
  );
}
