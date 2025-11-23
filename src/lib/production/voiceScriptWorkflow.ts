/**
 * Voice Script Workflow
 * Phase 50: Process voice script generation jobs (ElevenLabs compatible)
 */

import { ProductionJob, addJobOutput, updateJobSafety } from './productionEngine';

export async function processVoiceJob(
  job: ProductionJob
): Promise<{ success: boolean; error?: string }> {
  try {
    const { input_data } = job;
    const scriptType = input_data.scriptType || 'intro';
    const duration = input_data.duration || 60; // seconds
    const tone = input_data.tone || 'professional';
    const businessName = input_data.businessName || 'Business';
    const topic = input_data.topic || '';

    const script = generateVoiceScript(scriptType, duration, tone, businessName, topic);
    const title = `Voice Script - ${scriptType}`;

    // Calculate estimated duration based on word count (150 wpm average)
    const wordCount = script.split(/\s+/).length;
    const estimatedSeconds = Math.round((wordCount / 150) * 60);

    await addJobOutput(job.id, job.client_id, {
      outputType: 'script',
      title,
      content: script,
      metadata: {
        scriptType,
        targetDuration: duration,
        estimatedDuration: estimatedSeconds,
        tone,
        wordCount,
        // ElevenLabs recommended settings
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.3,
          useSpeakerBoost: true,
        },
      },
    });

    // Safety check for voice content
    const safetyFlags: string[] = [];
    if (estimatedSeconds > duration * 1.2) {
      safetyFlags.push('exceeds_duration');
    }

    await updateJobSafety(
      job.id,
      safetyFlags.length === 0 ? 100 : 85,
      safetyFlags,
      true
    );

    return { success: true };
  } catch (error) {
    console.error('Error processing voice job:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Voice script generation failed',
    };
  }
}

function generateVoiceScript(
  scriptType: string,
  duration: number,
  tone: string,
  businessName: string,
  topic: string
): string {
  switch (scriptType) {
    case 'intro':
      return generateIntroScript(duration, businessName);
    case 'explainer':
      return generateExplainerScript(duration, businessName, topic);
    case 'testimonial':
      return generateTestimonialScript(duration, topic);
    case 'promo':
      return generatePromoScript(duration, businessName, topic);
    default:
      return generateGenericScript(duration, businessName, topic);
  }
}

function generateIntroScript(duration: number, businessName: string): string {
  if (duration <= 30) {
    return `Welcome to ${businessName}.

We help businesses achieve their marketing goals with AI-powered automation.

Get started today and see the difference.`;
  }

  return `Welcome to ${businessName}.

We're here to transform the way you approach marketing.

Our platform combines AI-powered automation with human expertise to deliver results that matter.

Whether you're looking to generate more leads, create compelling content, or build your brand, we've got you covered.

Let's get started on your journey to marketing success.`;
}

function generateExplainerScript(duration: number, businessName: string, topic: string): string {
  return `Let's talk about ${topic || 'how we can help you'}.

Many businesses struggle with [common problem].

That's where ${businessName} comes in.

Our approach is simple:

First, we analyze your current situation.

Then, we create a customized strategy.

Finally, we execute and optimize for results.

The best part? You'll see real progress within the first week.

Ready to learn more? Let's connect.`;
}

function generateTestimonialScript(duration: number, topic: string): string {
  return `Before working with the team, I was struggling with ${topic || 'my marketing'}.

I had tried everything, but nothing seemed to work.

Then I found this solution.

Within just a few weeks, I started seeing real results.

My [metric] improved by [percentage].

I can't recommend them enough.

If you're on the fence, just try it. You won't regret it.`;
}

function generatePromoScript(duration: number, businessName: string, topic: string): string {
  return `Attention business owners!

Are you tired of [common pain point]?

${businessName} has the solution you've been looking for.

For a limited time, we're offering [special offer].

Here's what you'll get:

- Benefit one
- Benefit two
- Benefit three

Don't miss out on this opportunity.

Visit our website today and use code [CODE] to get started.

${businessName}. Your success starts here.`;
}

function generateGenericScript(duration: number, businessName: string, topic: string): string {
  return `Hello, and thank you for your interest in ${businessName}.

Today, we're going to talk about ${topic || 'how we can help you succeed'}.

[Main content here]

We hope you found this helpful.

For more information, visit our website or reach out to our team.

We look forward to working with you.`;
}

export default { processVoiceJob };
