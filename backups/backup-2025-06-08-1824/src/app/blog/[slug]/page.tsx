import { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPostContent } from "@/components/blog/BlogPostContent";
import {
  getBlogPostBySlug,
  incrementBlogPostViews,
  getRelatedPosts,
  getAuthorPosts
} from "@/lib/services/blog";

interface BlogPostPageProps {
  params: {
    slug: string;
    locale: string;
  };
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  try {
    const post = await getBlogPostBySlug(params.slug);
    
    return {
      title: post.meta_title || `${post.title} | Unite Group Blog`,
      description: post.meta_description || post.excerpt || post.content.substring(0, 160),
      openGraph: {
        title: post.title,
        description: post.excerpt || post.content.substring(0, 160),
        images: post.featured_image ? [post.featured_image] : [],
        type: 'article',
        publishedTime: post.published_at || undefined,
        authors: post.author ? [post.author.name] : [],
        tags: post.tags?.map(tag => tag.name) || []
      }
    };
  } catch (error) {
    return {
      title: 'Blog Post | Unite Group',
      description: 'Read our latest insights and articles'
    };
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  let post;
  
  try {
    post = await getBlogPostBySlug(params.slug);
  } catch (error) {
    notFound();
  }

  // Increment views
  await incrementBlogPostViews(post.id);

  // Get related posts
  const [relatedPosts, authorPosts] = await Promise.all([
    getRelatedPosts(post.id, post.category_id, 3),
    post.author_id ? getAuthorPosts(post.author_id, 3) : Promise.resolve([])
  ]);

  return (
    <BlogPostContent 
      post={post} 
      relatedPosts={relatedPosts} 
      authorPosts={authorPosts} 
    />
  );
}
