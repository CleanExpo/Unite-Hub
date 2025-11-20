/**
 * POST /api/leviathan/cloud/deploy
 * Deploy fabricated content to quad-cloud infrastructure
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { CloudAWSService } from '@/lib/services/leviathan/CloudAWSService';
import { CloudGCSService } from '@/lib/services/leviathan/CloudGCSService';
import { CloudAzureService } from '@/lib/services/leviathan/CloudAzureService';
import { CloudNetlifyService } from '@/lib/services/leviathan/CloudNetlifyService';
import { CloudRandomisationEngine, VariantSpec } from '@/lib/services/leviathan/CloudRandomisationEngine';
import { DaisyChainService } from '@/lib/services/leviathan/DaisyChainService';

interface DeployRequest {
  graphId: string;
  name: string;
  description?: string;
  deploymentType: 'single' | 'ring' | 'daisy_chain' | 'full_network';
  targetUrl: string;
  variantCount?: number;
  providers?: ('aws' | 'gcs' | 'azure' | 'netlify')[];
  enableCDN?: boolean;
  anchorTextVariants?: string[];
  content: {
    html: string;
    css?: string;
    ogImage?: string;
    schema?: string;
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

    const body: DeployRequest = await req.json();

    // Validate required fields
    if (!body.graphId || !body.name || !body.deploymentType || !body.targetUrl || !body.content?.html) {
      return NextResponse.json({
        error: 'Missing required fields: graphId, name, deploymentType, targetUrl, content.html'
      }, { status: 400 });
    }

    const variantCount = body.variantCount || 4;
    const providers = body.providers || ['aws', 'gcs', 'azure', 'netlify'];

    // Create deployment record
    const { data: deployment, error: deploymentError } = await supabase
      .from('cloud_deployments')
      .insert({
        org_id: userOrg.org_id,
        graph_id: body.graphId,
        name: body.name,
        description: body.description,
        deployment_type: body.deploymentType,
        target_url: body.targetUrl,
        status: 'deploying',
        config: {
          variantCount,
          providers,
          enableCDN: body.enableCDN,
          anchorTextVariants: body.anchorTextVariants,
        },
      })
      .select()
      .single();

    if (deploymentError || !deployment) {
      return NextResponse.json({
        error: 'Failed to create deployment record',
        details: deploymentError?.message
      }, { status: 500 });
    }

    // Initialize services
    const randomEngine = new CloudRandomisationEngine();
    const daisyChainService = new DaisyChainService(randomEngine.getSeed());

    // Generate variants
    const variants = randomEngine.generateVariants({
      variantCount,
      providers,
      seed: randomEngine.getSeed(),
    });

    // Generate link structure
    const linkStructure = daisyChainService.generateLinkStructure({
      deploymentType: body.deploymentType,
      targetUrl: body.targetUrl,
      variantCount,
      anchorTextVariants: body.anchorTextVariants,
      maxLinksPerPage: 3,
      moneySiteLinkRatio: 0.3,
    });

    // Initialize cloud services
    const cloudServices = {
      aws: new CloudAWSService(),
      gcs: new CloudGCSService(),
      azure: new CloudAzureService(),
      netlify: new CloudNetlifyService(),
    };

    // Deploy each variant
    const deploymentResults = [];
    const variantRecords = [];
    const assetRecords = [];
    const linkRecords = [];

    for (const variant of variants) {
      // Apply randomization to content
      const randomizedHTML = randomEngine.applyToHTML(body.content.html, variant);
      const randomizedCSS = body.content.css
        ? randomEngine.applyToCSS(body.content.css, variant)
        : '';

      // Prepare assets
      const assets = [
        {
          filename: 'index.html',
          content: randomizedHTML,
          contentType: 'text/html',
        },
      ];

      if (randomizedCSS) {
        assets.push({
          filename: 'styles.css',
          content: randomizedCSS,
          contentType: 'text/css',
        });
      }

      if (body.content.ogImage) {
        assets.push({
          filename: 'og-image.svg',
          content: body.content.ogImage,
          contentType: 'image/svg+xml',
        });
      }

      if (body.content.schema) {
        assets.push({
          filename: 'schema.json',
          content: body.content.schema,
          contentType: 'application/ld+json',
        });
      }

      // Deploy to provider
      const service = cloudServices[variant.provider];
      const deployId = `${deployment.id}-v${variant.variantIndex}`;

      let result;
      switch (variant.provider) {
        case 'aws':
          result = await (service as CloudAWSService).deploy(deployId, assets, {
            enableCDN: body.enableCDN,
          });
          break;
        case 'gcs':
          result = await (service as CloudGCSService).deploy(deployId, assets);
          break;
        case 'azure':
          result = await (service as CloudAzureService).deploy(deployId, assets);
          break;
        case 'netlify':
          result = await (service as CloudNetlifyService).deploy(deployId, assets);
          break;
      }

      deploymentResults.push({
        variantIndex: variant.variantIndex,
        provider: variant.provider,
        success: result.success,
        websiteUrl: result.websiteUrl,
        error: result.error,
      });

      // Record variant in database
      variantRecords.push({
        deployment_id: deployment.id,
        variant_index: variant.variantIndex,
        seed: variant.seed,
        provider: variant.provider,
        template_variant: variant.templateVariant,
        color_scheme: variant.colorScheme.primary,
        font_family: variant.fontFamily,
        layout_variant: variant.layoutVariant,
        source_url: body.targetUrl,
        deployed_url: result.websiteUrl,
        publish_delay_ms: variant.publishDelayMs,
        metadata: {
          cssModifications: variant.cssModifications,
          htmlModifications: variant.htmlModifications,
        },
      });

      // Record assets
      for (const asset of result.assets || []) {
        assetRecords.push({
          deployment_id: deployment.id,
          asset_type: asset.filename.includes('.html') ? 'html' :
                      asset.filename.includes('.css') ? 'css' :
                      asset.filename.includes('og-image') ? 'og_image' :
                      asset.filename.includes('schema') ? 'schema' : 'html',
          filename: asset.filename,
          content_type: assets.find(a => a.filename === asset.filename)?.contentType || 'text/plain',
          size_bytes: asset.size,
          provider: variant.provider,
          storage_path: 'storageKey' in asset ? asset.storageKey : asset.filename,
          public_url: asset.publicUrl,
          cdn_url: 'cdnUrl' in asset ? asset.cdnUrl : null,
          content_hash: asset.contentHash,
          status: 'uploaded',
        });
      }
    }

    // Insert variant records
    if (variantRecords.length > 0) {
      const { data: insertedVariants } = await supabase
        .from('cloud_variants')
        .insert(variantRecords)
        .select();

      // Create variant ID mapping
      const variantIdMap = new Map<number, string>();
      if (insertedVariants) {
        for (const v of insertedVariants) {
          variantIdMap.set(v.variant_index, v.id);
        }
      }

      // Record links
      for (const link of linkStructure.links) {
        linkRecords.push({
          deployment_id: deployment.id,
          source_variant_id: variantIdMap.get(link.sourceVariantIndex) || null,
          target_variant_id: link.targetVariantIndex !== null
            ? variantIdMap.get(link.targetVariantIndex)
            : null,
          link_type: link.linkType,
          anchor_text: link.anchorText,
          rel_attribute: link.relAttribute || null,
          chain_position: link.chainPosition,
          is_money_site_link: link.isMoneySiteLink,
          source_url: variantRecords[link.sourceVariantIndex]?.deployed_url,
          target_url: link.isMoneySiteLink
            ? body.targetUrl
            : variantRecords[link.targetVariantIndex!]?.deployed_url,
          link_order: link.linkOrder,
        });
      }
    }

    // Insert asset records
    if (assetRecords.length > 0) {
      await supabase.from('cloud_assets').insert(assetRecords);
    }

    // Insert link records
    if (linkRecords.length > 0) {
      await supabase.from('cloud_links').insert(linkRecords);
    }

    // Update deployment status
    const allSuccessful = deploymentResults.every(r => r.success);
    await supabase
      .from('cloud_deployments')
      .update({
        status: allSuccessful ? 'deployed' : 'failed',
        deployed_at: allSuccessful ? new Date().toISOString() : null,
        metadata: {
          results: deploymentResults,
          linkStatistics: linkStructure.statistics,
        },
      })
      .eq('id', deployment.id);

    return NextResponse.json({
      success: allSuccessful,
      deploymentId: deployment.id,
      variantCount: variants.length,
      results: deploymentResults,
      linkStatistics: linkStructure.statistics,
      message: allSuccessful
        ? `Successfully deployed ${variants.length} variants across ${providers.length} cloud providers`
        : 'Deployment completed with some failures',
    });

  } catch (error) {
    console.error('Cloud deployment error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
