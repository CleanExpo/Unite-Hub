/**
 * POST /api/leviathan/social/publish
 * Orchestrate Blogger + GSite publishing with propagation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { BloggerService } from '@/lib/services/leviathan/BloggerService';
import { BloggerContentEngine } from '@/lib/services/leviathan/BloggerContentEngine';
import { GSiteService } from '@/lib/services/leviathan/GSiteService';
import { StealthWrapperEngine } from '@/lib/services/leviathan/StealthWrapperEngine';
import { DaisyChainService } from '@/lib/services/leviathan/DaisyChainService';

interface PublishRequest {
  deploymentId?: string;
  title: string;
  content: string;
  description?: string;
  keywords?: string[];
  targetUrl: string;
  blogId?: string;
  schemaJson?: object;
  ogImageUrl?: string;
  options?: {
    publishToBlogger?: boolean;
    publishToGSite?: boolean;
    variantCount?: number;
    gsiteCount?: number;
  };
}

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;
    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    const supabase = await getSupabaseServer();

    // Get user's org
    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', userId)
      .single();

    if (!userOrg) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const body: PublishRequest = await req.json();

    // Validate required fields
    if (!body.title || !body.content || !body.targetUrl) {
      return NextResponse.json({
        error: 'Missing required fields: title, content, targetUrl'
      }, { status: 400 });
    }

    const options = body.options || {};
    const publishToBlogger = options.publishToBlogger !== false;
    const publishToGSite = options.publishToGSite !== false;
    const variantCount = options.variantCount || 1;
    const gsiteCount = options.gsiteCount || 1;

    // Initialize services
    const bloggerService = new BloggerService();
    const contentEngine = new BloggerContentEngine();
    const gsiteService = new GSiteService();
    const wrapperEngine = new StealthWrapperEngine();
    const daisyChainService = new DaisyChainService();

    const results = {
      blogger: [] as any[],
      gsite: [] as any[],
      propagation: null as any,
      socialLinks: [] as any[],
    };

    // Generate propagation chain
    const propagationChain = daisyChainService.generatePropagationChain({
      targetUrl: body.targetUrl,
      gsiteCount,
      bloggerCount: variantCount,
      cloudVariantCount: 4,
      cloudProviders: ['aws', 'gcs', 'azure', 'netlify'],
    });

    results.propagation = propagationChain;

    // Publish to Blogger
    if (publishToBlogger && bloggerService.isReady() && body.blogId) {
      // Transform content for Blogger
      const bloggerContent = contentEngine.transform({
        html: body.content,
        title: body.title,
        description: body.description,
        schemaJson: body.schemaJson,
        ogImageUrl: body.ogImageUrl,
        targetUrl: body.targetUrl,
        keywords: body.keywords,
      });

      // Create post
      const postResult = await bloggerService.createPost(body.blogId, {
        title: bloggerContent.title,
        content: bloggerContent.content,
        labels: bloggerContent.labels,
      });

      if (postResult.success) {
        // Save to database
        const { data: socialPost } = await supabase
          .from('social_posts')
          .insert({
            org_id: userOrg.org_id,
            deployment_id: body.deploymentId || null,
            platform: 'blogger',
            title: bloggerContent.title,
            content: bloggerContent.content,
            excerpt: bloggerContent.excerpt,
            external_post_id: postResult.postId,
            external_blog_id: body.blogId,
            post_url: postResult.postUrl,
            edit_url: postResult.editUrl,
            schema_json: bloggerContent.schemaJson,
            og_image_url: body.ogImageUrl,
            status: 'published',
            published_at: postResult.publishedAt,
            variant_index: 0,
            seed: contentEngine.getSeed(),
          })
          .select()
          .single();

        results.blogger.push({
          success: true,
          postId: postResult.postId,
          postUrl: postResult.postUrl,
          dbId: socialPost?.id,
        });

        // Create social links for Blogger → Cloud
        const bloggerLinks = propagationChain.links.filter(
          l => l.sourceType === 'blogger' && l.sourceLayer === 2
        );

        for (const link of bloggerLinks) {
          const { data: socialLink } = await supabase
            .from('social_links')
            .insert({
              org_id: userOrg.org_id,
              source_type: 'blogger',
              source_id: socialPost?.id,
              source_url: postResult.postUrl,
              target_type: link.targetType,
              target_url: link.targetType === 'money_site' ? body.targetUrl : null,
              anchor_text: link.anchorText,
              layer: 2,
              chain_position: parseInt(link.id.split('-')[1]),
              status: 'created',
            })
            .select()
            .single();

          results.socialLinks.push(socialLink);
        }
      } else {
        results.blogger.push({
          success: false,
          error: postResult.error,
        });
      }
    }

    // Publish to Google Sites
    if (publishToGSite) {
      try {
        await gsiteService.initialize();

        for (let i = 0; i < gsiteCount; i++) {
          // Generate wrapper content
          const wrapperContent = await wrapperEngine.generate({
            title: body.title,
            description: body.description,
            content: body.content,
            keywords: body.keywords,
            targetUrl: body.targetUrl,
            embeddedUrls: results.blogger
              .filter(b => b.success && b.postUrl)
              .map(b => b.postUrl),
          });

          // Create GSite page
          const gsiteResult = await gsiteService.createPage({
            siteName: `${body.title.substring(0, 20)}-${i}`,
            pageTitle: wrapperContent.headline,
            wrapperContent: wrapperContent.fullContent,
            embeddedUrls: results.blogger
              .filter(b => b.success && b.postUrl)
              .map(b => b.postUrl),
            targetUrl: body.targetUrl,
          });

          if (gsiteResult.success) {
            // Save to database
            const { data: gsitePage } = await supabase
              .from('gsite_pages')
              .insert({
                org_id: userOrg.org_id,
                deployment_id: body.deploymentId || null,
                site_name: `${body.title.substring(0, 20)}-${i}`,
                page_title: wrapperContent.headline,
                external_site_id: gsiteResult.externalSiteId,
                site_url: gsiteResult.siteUrl,
                page_url: gsiteResult.pageUrl,
                edit_url: gsiteResult.editUrl,
                wrapper_content: wrapperContent.fullContent,
                embedded_urls: results.blogger
                  .filter(b => b.success && b.postUrl)
                  .map(b => b.postUrl),
                status: 'created',
                variant_index: i,
                seed: wrapperEngine.getSeed(),
              })
              .select()
              .single();

            results.gsite.push({
              success: true,
              siteUrl: gsiteResult.siteUrl,
              pageUrl: gsiteResult.pageUrl,
              dbId: gsitePage?.id,
            });

            // Create social links for GSite → Blogger
            const gsiteLinks = propagationChain.links.filter(
              l => l.sourceType === 'gsite' && l.sourceId === `gsite-${i}`
            );

            for (const link of gsiteLinks) {
              await supabase
                .from('social_links')
                .insert({
                  org_id: userOrg.org_id,
                  source_type: 'gsite',
                  source_id: gsitePage?.id,
                  source_url: gsiteResult.pageUrl,
                  target_type: 'blogger',
                  target_url: results.blogger[0]?.postUrl || null,
                  anchor_text: link.anchorText,
                  layer: 1,
                  chain_position: i,
                  status: 'created',
                });
            }
          } else {
            results.gsite.push({
              success: false,
              error: gsiteResult.error,
            });
          }
        }

        await gsiteService.close();
      } catch (error) {
        results.gsite.push({
          success: false,
          error: error instanceof Error ? error.message : 'GSite error',
        });
      }
    }

    // Calculate success metrics
    const bloggerSuccess = results.blogger.filter(b => b.success).length;
    const gsiteSuccess = results.gsite.filter(g => g.success).length;

    return NextResponse.json({
      success: bloggerSuccess > 0 || gsiteSuccess > 0,
      summary: {
        bloggerPublished: bloggerSuccess,
        gsiteCreated: gsiteSuccess,
        totalLinks: results.socialLinks.length,
        propagationLinks: propagationChain.statistics.totalLinks,
      },
      results,
      message: `Published ${bloggerSuccess} Blogger posts and ${gsiteSuccess} GSite pages`,
    });

  } catch (error) {
    console.error('Social publish error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
