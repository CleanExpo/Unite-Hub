#!/usr/bin/env node

/**
 * EXCELLENCE-GRADE IMAGE GENERATION
 * Using the 5 Whys Marketing Theory
 *
 * THE STORY WE'RE SELLING:
 * Businesses across Australia (and the world) struggling to get their
 * brand message out to potential customers. We help them be heard.
 *
 * 5 WHYS FOR EACH IMAGE:
 * 1. WHY this image? - What business problem does it address?
 * 2. WHY this style? - What visual approach best communicates the message?
 * 3. WHY this situation? - What scenario resonates with the target audience?
 * 4. WHY this person? - Who should the audience see themselves as?
 * 5. WHY this feeling? - What emotion do we want to evoke?
 *
 * VARIETY OF STYLES:
 * - Photorealistic: Real business scenarios, coffee shop meetings
 * - Warm illustration: Friendly, approachable brand feel
 * - Lifestyle: People enjoying success, connection
 * - Landscape: Australian locations, global reach
 *
 * NO ROBOTS. NO COLD TECH. REAL HUMAN STORIES.
 */

import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_IMAGE_MODEL = 'gemini-3-pro-image-preview';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'generated');

// CRITICAL: No text, but HUMAN stories
const HUMAN_STORY_MANDATE = `
CRITICAL REQUIREMENTS:
- NO TEXT, NO LABELS, NO WORDS, NO NUMBERS
- HUMAN-CENTERED imagery - real people, real emotions
- NO robots, NO cold tech imagery, NO sci-fi elements
- Warm, genuine, relatable imagery
- Australian/global business context
`;

// ============================================================================
// THE 5 WHYS IMAGE STRATEGY
// Each image is designed with intentional purpose
// ============================================================================

const IMAGES_WITH_5WHYS = [
  // ============================================================================
  // HERO IMAGES - First Impressions Matter
  // ============================================================================
  {
    id: 'hero-trades-owner',
    category: 'hero',
    fiveWhys: {
      why1_image: 'Show a tradesperson who has escaped the paperwork nightmare',
      why2_style: 'Photorealistic - trades people trust authentic imagery',
      why3_situation: 'On a job site but confident, phone in hand, work flowing smoothly',
      why4_person: 'Australian tradie, 35-50, weathered hands but modern approach',
      why5_feeling: 'Relief and control - finally on top of the business side',
    },
    prompt: `Photorealistic image of a confident Australian tradesperson, male or female,
mid-40s, standing on a construction site during golden hour. They're holding a smartphone
casually, looking satisfied and in control. Work boots, high-vis vest, but clean and
professional. Behind them, a well-organized job site with happy workers. Their expression
shows relief - the stress of chasing leads is gone. Warm natural lighting, shallow depth
of field. No text, no logos. The feeling is: "I've got this handled."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'hero-agency-owner',
    category: 'hero',
    fiveWhys: {
      why1_image: 'Show agency owner who has time for creativity again',
      why2_style: 'Modern lifestyle photography - agencies value aesthetics',
      why3_situation: 'In a beautiful office space, relaxed but productive',
      why4_person: 'Creative professional, diverse, stylish but approachable',
      why5_feeling: 'Creative freedom - automation handles the busywork',
    },
    prompt: `Modern lifestyle photograph of a creative agency owner in their 30s, sitting
in a bright, plant-filled office space with exposed brick. They're leaning back in their
chair with a genuine smile, laptop open but not stressing over it. Coffee cup nearby.
Large windows showing city skyline. Mood board and creative work visible in background.
Natural light streaming in. Expression of creative satisfaction and peace. Modern,
diverse representation. No text, no screens with content visible. The feeling is:
"I have time to create again."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'hero-nonprofit-leader',
    category: 'hero',
    fiveWhys: {
      why1_image: 'Show nonprofit leader whose message is finally reaching people',
      why2_style: 'Warm documentary style - authentic community connection',
      why3_situation: 'In the community they serve, making real impact',
      why4_person: 'Passionate community leader, any age, genuine warmth',
      why5_feeling: 'Purpose fulfilled - their cause is being heard',
    },
    prompt: `Warm documentary-style photograph of a nonprofit leader in their community.
They're surrounded by diverse volunteers and community members, all engaged and smiling.
Outdoor setting in an Australian park or community center. The leader is speaking
passionately but approachably to a small group. Dappled sunlight, natural colors.
Everyone looks genuinely connected and hopeful. Age 40-60, any ethnicity. The feeling
is: "Our message is finally reaching the people who need to hear it."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'hero-consultant',
    category: 'hero',
    fiveWhys: {
      why1_image: 'Show consultant who has clients coming to them',
      why2_style: 'Professional lifestyle - trust and expertise',
      why3_situation: 'Successful meeting with a new client, deal closing',
      why4_person: 'Expert professional, confident but warm',
      why5_feeling: 'Professional success - expertise is being recognized',
    },
    prompt: `Professional lifestyle photograph of a business consultant finishing a
successful meeting with a client. Coffee shop setting with warm wood tones and natural
light. Two people shaking hands across the table, both genuinely smiling. Laptops closed,
papers put away - deal is done. Professional but relaxed attire. Australian cafe
aesthetic with good coffee cups. Age 35-55, diverse representation. The feeling is:
"Clients find me now - I don't have to chase them."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'hero-marketing-manager',
    category: 'hero',
    fiveWhys: {
      why1_image: 'Show marketing manager who finally has work-life balance',
      why2_style: 'Modern office lifestyle - relatable corporate setting',
      why3_situation: 'Leaving office on time, weekend plans happening',
      why4_person: 'Marketing professional who used to burn out',
      why5_feeling: 'Balance achieved - work is handled, life is lived',
    },
    prompt: `Lifestyle photograph of a marketing professional walking out of a modern
office building at 5pm, golden hour light. They're putting on sunglasses with a relaxed
smile, phone in pocket (not in hand), casual Friday attire. Behind them, the office
lights are dimming - the automated systems handle the rest. Other happy colleagues
also leaving. Australian city background. The feeling is: "The systems work so I can
have a life."
${HUMAN_STORY_MANDATE}`
  },

  // ============================================================================
  // PROBLEM/STRUGGLE IMAGES - Show the pain we solve
  // ============================================================================
  {
    id: 'carousel-crm-intelligence',
    category: 'carousel',
    fiveWhys: {
      why1_image: 'Show the overwhelming nature of managing customer relationships manually',
      why2_style: 'Soft illustration - makes the pain approachable, not depressing',
      why3_situation: 'Business owner drowning in sticky notes and spreadsheets',
      why4_person: 'Every small business owner who has been there',
      why5_feeling: 'Recognition - "That was me before"',
    },
    prompt: `Warm, soft illustration style showing a small business owner at their desk,
surrounded by colorful sticky notes, overflowing inbox on screen, coffee going cold.
Their expression is overwhelmed but sympathetic - we've all been there. Soft pastel
color palette with warm oranges and teals. Cartoon-ish but not childish. The mess is
visual but the person is likeable. No text on the sticky notes - just colors.
Australian home office setting. The feeling is: "I understand this struggle."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'carousel-email-automation',
    category: 'carousel',
    fiveWhys: {
      why1_image: 'Show the freedom of automated communication',
      why2_style: 'Bright illustration - optimistic future state',
      why3_situation: 'Person relaxing while their emails send themselves',
      why4_person: 'Business owner enjoying peace of mind',
      why5_feeling: 'Relief and liberation - the hamster wheel stopped',
    },
    prompt: `Bright, optimistic illustration of a business owner relaxing in a hammock
with a book, while stylized envelope icons float away peacefully in the background.
The person is smiling, completely at ease. Sunset colors - warm oranges, soft purples.
Australian backyard setting with gum trees. The envelopes are simple shapes, no text.
A small laptop sits closed on a nearby table. The feeling is: "My business runs
while I rest."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'carousel-social-media',
    category: 'carousel',
    fiveWhys: {
      why1_image: 'Show the joy of content that creates real connections',
      why2_style: 'Lifestyle photography - social media is about real life',
      why3_situation: 'Friends enjoying moment that gets shared authentically',
      why4_person: 'Real people having real moments',
      why5_feeling: 'Authentic connection - what social media should be',
    },
    prompt: `Lifestyle photograph of a group of friends at a beach-side Australian cafe,
laughing together over brunch. One person is naturally taking a photo of the moment -
not staged, not posed. Beautiful morning light, ocean visible in background. Diverse
group, age 25-40. Avocado toast and good coffee on the table. Everyone genuinely happy.
The photo being taken will be the kind that gets real engagement. The feeling is:
"Real moments create real connections."
${HUMAN_STORY_MANDATE}`
  },

  // ============================================================================
  // CASE STUDY IMAGES - Success Stories
  // ============================================================================
  {
    id: 'case-study-construction',
    category: 'case-study',
    fiveWhys: {
      why1_image: 'Show construction business owner who scaled up successfully',
      why2_style: 'Documentary photography - authentic success',
      why3_situation: 'New trucks, happy crew, business thriving',
      why4_person: 'Builder who went from struggling to succeeding',
      why5_feeling: 'Pride and growth - hard work paid off',
    },
    prompt: `Documentary-style photograph of a construction business owner standing
proudly in front of their fleet of three work vehicles. Crew members in background
loading equipment, everyone looking productive and happy. The owner has their arms
crossed confidently, genuine smile. Early morning light, Australian suburban setting.
Clean vehicles with no visible text/branding. The business has clearly grown.
The feeling is: "From one truck to a fleet - this is what success looks like."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'case-study-agency',
    category: 'case-study',
    fiveWhys: {
      why1_image: 'Show agency team celebrating a big win',
      why2_style: 'Candid office photography - real celebration',
      why3_situation: 'Team just landed their biggest client',
      why4_person: 'Creative team who worked together and won',
      why5_feeling: 'Team triumph - we did this together',
    },
    prompt: `Candid photograph of a creative agency team celebrating in their modern
office. High fives, hugging, genuine excitement. Diverse team of 5-8 people, age 25-45.
One person popping a champagne bottle. Whiteboard in background showing campaign
success (abstract shapes, no readable text). Afternoon light through big windows.
Everyone dressed creatively but professionally. The feeling is: "We just won big,
together."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'case-study-fitness',
    category: 'case-study',
    fiveWhys: {
      why1_image: 'Show fitness coach with thriving community',
      why2_style: 'Energetic lifestyle photography - fitness is about community',
      why3_situation: 'Full class, engaged clients, business booming',
      why4_person: 'Coach who built something meaningful',
      why5_feeling: 'Impact and community - changing lives together',
    },
    prompt: `Energetic lifestyle photograph of a fitness coach leading a packed outdoor
bootcamp class in an Australian park. Coach is front and center, demonstrating an
exercise with infectious enthusiasm. 15-20 participants of all ages and fitness levels,
all giving their best effort with big smiles. Early morning golden light. Beautiful
park setting with city skyline visible. The feeling is: "From struggling for clients
to building a community."
${HUMAN_STORY_MANDATE}`
  },

  // ============================================================================
  // FEATURE IMAGES - Benefits, not features
  // ============================================================================
  {
    id: 'feature-lead-scoring',
    category: 'feature',
    fiveWhys: {
      why1_image: 'Show knowing exactly who to focus on',
      why2_style: 'Warm illustration - makes data human',
      why3_situation: 'Sales person having coffee with their best prospect',
      why4_person: 'Sales professional who no longer wastes time',
      why5_feeling: 'Confidence - knowing you are talking to the right person',
    },
    prompt: `Warm illustration of two business people having an engaged conversation
over coffee. One is clearly the salesperson (with a subtle warm glow around them),
the other is their ideal prospect (indicated by visual chemistry, leaning in).
Cozy cafe setting with soft lighting. The salesperson looks confident and relaxed -
they know this is the right person to be talking to. Friendly cartoon style with
realistic proportions. No text, no screens. The feeling is: "No more chasing
the wrong people."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'feature-email-campaigns',
    category: 'feature',
    fiveWhys: {
      why1_image: 'Show personal messages at scale',
      why2_style: 'Friendly illustration - personal touch',
      why3_situation: 'One person reaching many, each feeling special',
      why4_person: 'Business owner who cares about every customer',
      why5_feeling: 'Personal connection - everyone feels valued',
    },
    prompt: `Friendly illustration of a business owner at a desk, surrounded by floating
stylized letters/envelopes, each one slightly different in color. The envelopes are
flying toward small groups of happy, diverse people in the distance. The business
owner is smiling, touching one envelope gently. Warm color palette - oranges, soft
blues, creams. The feeling is: "Every customer gets a personal touch, even when
there are thousands."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'feature-drip-sequences',
    category: 'feature',
    fiveWhys: {
      why1_image: 'Show relationships that build over time',
      why2_style: 'Story illustration - progression and care',
      why3_situation: 'Stranger becoming friend becoming customer',
      why4_person: 'Customer on their journey with a brand',
      why5_feeling: 'Trust building - patience pays off',
    },
    prompt: `Story-style illustration showing three scenes from left to right:
1) A person noticing a friendly wave from a distance
2) The same person having coffee with the waver, getting to know them
3) The same person happily shaking hands in a business deal
Warm progression in colors from cool to warm left to right. Simple, friendly
illustration style. No text. Australian cafe and office settings. The feeling is:
"Relationships take time, but they're worth it."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'feature-contact-intelligence',
    category: 'feature',
    fiveWhys: {
      why1_image: 'Show understanding customers as real people',
      why2_style: 'Warm photorealistic - real human connection',
      why3_situation: 'Business owner remembering personal details about customer',
      why4_person: 'Local business owner who knows their regulars',
      why5_feeling: 'Personal service - being known and valued',
    },
    prompt: `Photorealistic image of a local cafe owner greeting a regular customer by
name, already preparing their usual order. Both are smiling warmly. The customer looks
pleasantly surprised. Cozy Australian cafe with warm wood tones and morning light.
Other customers in background, relaxed atmosphere. The owner has kind eyes and
genuine warmth. The feeling is: "They remember me - I matter here."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'feature-analytics-dashboard',
    category: 'feature',
    fiveWhys: {
      why1_image: 'Show clarity and confidence in decisions',
      why2_style: 'Clean illustration - simplicity from complexity',
      why3_situation: 'Business owner seeing clearly what works',
      why4_person: 'Owner who used to guess, now knows',
      why5_feeling: 'Clarity - fog has lifted',
    },
    prompt: `Clean illustration of a business owner looking at a simple, clear path
through what was once a maze. The maze behind them is foggy and complex. The path
ahead is lit with warm light. Their posture is confident, pointing forward.
Minimalist style with soft gradients. Colors transition from grey/confused to
warm/clear. No data visualizations, no screens - just the metaphor. The feeling is:
"I can finally see what's working."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'feature-integrations-hub',
    category: 'feature',
    fiveWhys: {
      why1_image: 'Show everything working together smoothly',
      why2_style: 'Playful illustration - integration as harmony',
      why3_situation: 'Orchestra of tools playing in sync',
      why4_person: 'Business owner as conductor',
      why5_feeling: 'Harmony - no more juggling',
    },
    prompt: `Playful illustration of a business owner as a happy orchestra conductor,
with friendly cartoon versions of business tools (briefcase, envelope, calendar,
phone) as musicians all playing together harmoniously. Musical notes floating in air.
Warm, joyful colors. The conductor looks relaxed and pleased. No brand logos -
just symbolic objects. The feeling is: "Everything works together now."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'feature-workflow-automation',
    category: 'feature',
    fiveWhys: {
      why1_image: 'Show reclaiming time for what matters',
      why2_style: 'Lifestyle photography - time is the real benefit',
      why3_situation: 'Parent at school pickup, business running itself',
      why4_person: 'Business owner who is present for their family',
      why5_feeling: 'Freedom - being there for moments that matter',
    },
    prompt: `Heartwarming lifestyle photograph of a business owner picking up their
excited child from school. The child is running toward them with arms open. Other
parents in background. Australian school setting with gum trees. The business owner
looks completely present - not checking phone, not stressed. Afternoon golden light.
Casual but put-together attire. The feeling is: "My business runs so I can be here
for this."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'feature-ai-content-generation',
    category: 'feature',
    fiveWhys: {
      why1_image: 'Show creative collaboration, not replacement',
      why2_style: 'Warm illustration - AI as helpful assistant',
      why3_situation: 'Human and helpful tool working together',
      why4_person: 'Creative person with a great assistant',
      why5_feeling: 'Enhancement - like having a brilliant colleague',
    },
    prompt: `Warm illustration of a creative professional at their desk with a friendly,
abstract helper figure beside them (NOT a robot - more like a warm glowing presence).
Together they're looking at creative work on a canvas. The human is clearly in charge,
the helper is offering gentle suggestions. Soft warm colors, cozy studio setting.
Art supplies visible. The feeling is: "It's like having the best brainstorming
partner ever."
${HUMAN_STORY_MANDATE}`
  },

  // ============================================================================
  // INTEGRATION IMAGES - Connection and Flow
  // ============================================================================
  {
    id: 'integration-email-provider',
    category: 'integration',
    fiveWhys: {
      why1_image: 'Show email feeling personal again',
      why2_style: 'Nostalgic warm illustration - email as connection',
      why3_situation: 'Real letters connecting real people',
      why4_person: 'Anyone who values genuine communication',
      why5_feeling: 'Connection - email that feels like a letter',
    },
    prompt: `Warm, nostalgic illustration of a person reading a letter with a smile,
sitting in a comfortable chair by a window. The letter has brought them joy - you can
see it in their expression. Stylized envelope on the table. Golden afternoon light.
Cozy Australian living room. The illustration style is soft and emotional. No visible
text on the letter. The feeling is: "This email made someone's day."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'integration-team-chat',
    category: 'integration',
    fiveWhys: {
      why1_image: 'Show team that stays connected even apart',
      why2_style: 'Modern illustration - remote work connection',
      why3_situation: 'Team members in different places, all connected',
      why4_person: 'Remote teams who feel close',
      why5_feeling: 'Togetherness - distance doesn not mean disconnection',
    },
    prompt: `Modern illustration showing a split scene: different people in different
settings (home office, cafe, beach with laptop, city apartment) all connected by
warm glowing lines. Each person is smiling, engaged, clearly in conversation.
Diverse team, various ages. Each setting has personality. The connecting lines
are warm and organic, not tech-like. The feeling is: "We're apart but together."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'integration-automation',
    category: 'integration',
    fiveWhys: {
      why1_image: 'Show the magic of things just working',
      why2_style: 'Whimsical illustration - automation as magic',
      why3_situation: 'Helpful invisible hands taking care of tasks',
      why4_person: 'Anyone who wished they had more help',
      why5_feeling: 'Wonder - how did that get done?',
    },
    prompt: `Whimsical illustration of a business owner at their desk, with friendly
floating hands (not creepy - think helping hand emoticons) organizing papers,
sending envelopes, watering a plant. The owner is relaxed, sipping coffee, watching
with pleased surprise. Soft magical sparkles. Warm color palette with touches of
gold. Cozy home office. The feeling is: "It's like having invisible helpers."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'integration-crm',
    category: 'integration',
    fiveWhys: {
      why1_image: 'Show customer relationships being treasured',
      why2_style: 'Warm illustration - relationships are precious',
      why3_situation: 'Business owner caring for their customer garden',
      why4_person: 'Business owner who values every relationship',
      why5_feeling: 'Care - every customer is precious',
    },
    prompt: `Warm illustration of a business owner tending to a beautiful garden where
each plant represents a customer relationship. Some plants are small seedlings
(new customers), some are flowering (happy customers), some are fruiting (loyal
advocates). The gardener is nurturing them all with care. Soft morning light,
Australian native plants. The feeling is: "Every relationship deserves attention."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'integration-payment',
    category: 'integration',
    fiveWhys: {
      why1_image: 'Show the joy of getting paid smoothly',
      why2_style: 'Clean illustration - money matters done easily',
      why3_situation: 'Payment received notification bringing smile',
      why4_person: 'Business owner who used to chase invoices',
      why5_feeling: 'Relief - money arrived without the stress',
    },
    prompt: `Clean, cheerful illustration of a business owner doing a small happy dance
at their kitchen counter, coffee in hand. A stylized notification (glowing check mark)
floats nearby indicating good news. Morning light through window. Australian home
setting. Their expression is relieved and happy. Simple, warm colors. The feeling is:
"Another payment, without me having to chase it."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'integration-analytics',
    category: 'integration',
    fiveWhys: {
      why1_image: 'Show growth that you can feel',
      why2_style: 'Lifestyle photography - tangible success',
      why3_situation: 'Business that has visibly grown',
      why4_person: 'Owner looking at their expanded business',
      why5_feeling: 'Pride - we built this',
    },
    prompt: `Lifestyle photograph of a retail store owner standing at the doorway of
their newly expanded shop, arms proudly crossed. Behind them, a busy, beautiful store
with happy customers browsing. The expansion is visible - fresh paint, new section.
Australian main street setting. Golden hour light. Their expression shows pride and
gratitude. The feeling is: "Look how far we've come."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'integration-marketing-email',
    category: 'integration',
    fiveWhys: {
      why1_image: 'Show message reaching the right ears',
      why2_style: 'Storytelling illustration - message in motion',
      why3_situation: 'Story/message traveling to find its audience',
      why4_person: 'Anyone with a story worth sharing',
      why5_feeling: 'Hope - my message will find its people',
    },
    prompt: `Storytelling illustration of a paper airplane carrying a heart, flying
over a landscape toward a group of people who are looking up with excitement and
open arms. The sender in the background waves with hope. Australian landscape -
hills, eucalyptus trees. Warm sunset colors. The paper airplane leaves a gentle
trail. The feeling is: "My message is finding its people."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'integration-sales-pipeline',
    category: 'integration',
    fiveWhys: {
      why1_image: 'Show the journey from stranger to friend to customer',
      why2_style: 'Warm illustration - relationships evolve',
      why3_situation: 'A friendship that became a partnership',
      why4_person: 'Two people who met and built something',
      why5_feeling: 'Partnership - relationships lead to opportunity',
    },
    prompt: `Warm illustration showing two people at different stages: first meeting
at a networking event (looking uncertain), then having coffee as friends (laughing),
then shaking hands on a deal (both happy). Same two people, growing relationship.
Australian settings throughout. Soft color progression from cool to warm. The feeling
is: "The best business comes from real relationships."
${HUMAN_STORY_MANDATE}`
  },

  // ============================================================================
  // EMPTY STATE IMAGES - Encouraging First Steps
  // ============================================================================
  {
    id: 'empty-state-contacts',
    category: 'empty-state',
    fiveWhys: {
      why1_image: 'Encourage adding first contact without pressure',
      why2_style: 'Friendly illustration - inviting not demanding',
      why3_situation: 'Blank page as opportunity not emptiness',
      why4_person: 'Someone about to start something good',
      why5_feeling: 'Possibility - exciting beginnings',
    },
    prompt: `Friendly illustration of an open address book with blank pages,
but with a single golden pen resting on it invitingly. Sunlight falling across
the page. A cup of coffee nearby. The blank page looks full of possibility,
not empty. Warm, encouraging colors. A small plant is starting to grow from
the corner of the desk. The feeling is: "Every great network starts with
one name."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'empty-state-campaigns',
    category: 'empty-state',
    fiveWhys: {
      why1_image: 'Make starting a campaign feel exciting',
      why2_style: 'Playful illustration - adventure awaits',
      why3_situation: 'Standing at the start of an exciting journey',
      why4_person: 'Someone about to launch something great',
      why5_feeling: 'Anticipation - the best is ahead',
    },
    prompt: `Playful illustration of a person standing at a launchpad, looking up
at a beautiful sky full of possibilities. A friendly rocket (not realistic -
whimsical) waits beside them. The horizon shows distant mountains and opportunities.
Australian landscape elements. Warm sunrise colors. Their posture shows excitement
and readiness. The feeling is: "Your first campaign is going to be amazing."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'empty-state-emails',
    category: 'empty-state',
    fiveWhys: {
      why1_image: 'Make empty inbox feel like peace not lack',
      why2_style: 'Serene illustration - calm is good',
      why3_situation: 'Beautiful empty space ready for the good stuff',
      why4_person: 'Someone whose inbox is a peaceful place',
      why5_feeling: 'Calm - everything is handled',
    },
    prompt: `Serene illustration of a clean, organized desk with an old-fashioned
empty mail tray. A window shows a peaceful garden outside. A bird is perched
nearby. Morning light creates calm shadows. Everything is tidy and ready.
One fresh flower in a small vase. The feeling is: "Clean slate, fresh start."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'empty-state-analytics',
    category: 'empty-state',
    fiveWhys: {
      why1_image: 'Make no data feel like potential not failure',
      why2_style: 'Optimistic illustration - story about to be written',
      why3_situation: 'Artist canvas before the masterpiece',
      why4_person: 'Someone about to create something beautiful',
      why5_feeling: 'Potential - your story starts here',
    },
    prompt: `Optimistic illustration of an artist easel with a blank canvas,
but surrounded by beautiful paint colors ready to be used. Brushes laid out
neatly. Window showing inspiring Australian landscape. Soft morning light.
The blank canvas feels full of potential, not empty. The feeling is:
"Your success story starts here."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'empty-state-content',
    category: 'empty-state',
    fiveWhys: {
      why1_image: 'Make blank page feel like creative freedom',
      why2_style: 'Creative illustration - imagination unleashed',
      why3_situation: 'Writer with ideas ready to flow',
      why4_person: 'Creative person full of stories to tell',
      why5_feeling: 'Inspiration - so much to say',
    },
    prompt: `Creative illustration of a person at a typewriter (vintage, charming)
with colorful thought bubbles floating up containing abstract shapes representing
ideas. They're smiling, fingers ready on keys. Cozy Australian home office with
plants. Coffee steaming nearby. The thought bubbles are colorful and numerous.
The feeling is: "So many stories to tell."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'empty-state-integrations',
    category: 'empty-state',
    fiveWhys: {
      why1_image: 'Make connecting tools feel like building bridges',
      why2_style: 'Friendly illustration - connection is natural',
      why3_situation: 'Friendly tools wanting to work together',
      why4_person: 'Someone bringing their tools together',
      why5_feeling: 'Possibility - together we are stronger',
    },
    prompt: `Friendly illustration of various abstract shapes representing
different tools, all facing each other as if in friendly conversation,
ready to connect. Bridge pieces lying nearby ready to be placed. Warm
colors, soft rounded shapes. Not robotic - organic and friendly. The
shapes have subtle happy expressions. The feeling is: "Let's bring
everything together."
${HUMAN_STORY_MANDATE}`
  },

  // ============================================================================
  // ONBOARDING IMAGES - Welcoming Journey
  // ============================================================================
  {
    id: 'onboarding-welcome',
    category: 'onboarding',
    fiveWhys: {
      why1_image: 'Make new users feel genuinely welcomed',
      why2_style: 'Warm photography - real welcome',
      why3_situation: 'Being welcomed into a friendly space',
      why4_person: 'New member being embraced',
      why5_feeling: 'Belonging - you are in the right place',
    },
    prompt: `Warm photograph of a diverse group of friendly business people
welcoming someone new into their coworking space. Open arms, genuine smiles.
The newcomer looks pleasantly surprised by the warm welcome. Beautiful
Australian coworking space with plants and natural light. Everyone looks
approachable and supportive. The feeling is: "Welcome to the family."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'onboarding-connect-email',
    category: 'onboarding',
    fiveWhys: {
      why1_image: 'Make email connection feel like opening a door',
      why2_style: 'Hopeful illustration - new possibilities',
      why3_situation: 'Opening door to new world',
      why4_person: 'Someone ready for new opportunities',
      why5_feeling: 'Excitement - world is opening up',
    },
    prompt: `Hopeful illustration of a person opening a beautiful door that
reveals a bright, colorful world of possibilities. Letters and envelopes
are floating through peacefully. The person is silhouetted against the
bright light, stepping forward eagerly. Warm colors beyond the door.
Australian native birds visible. The feeling is: "A whole world is
opening up."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'onboarding-import-contacts',
    category: 'onboarding',
    fiveWhys: {
      why1_image: 'Make importing feel like gathering friends',
      why2_style: 'Friendly illustration - contacts are people',
      why3_situation: 'Gathering your community together',
      why4_person: 'Someone bringing their people together',
      why5_feeling: 'Community - your people in one place',
    },
    prompt: `Friendly illustration of a person standing at the center, with
diverse, friendly faces floating toward them in a gentle swirl. Each face
is smiling and happy to be gathered. Warm, soft colors. The person has
their arms open in welcome. Abstract but clearly representing human
connection. The feeling is: "Gathering all your people in one place."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'onboarding-first-campaign',
    category: 'onboarding',
    fiveWhys: {
      why1_image: 'Make first campaign feel like exciting launch',
      why2_style: 'Celebratory illustration - achievement',
      why3_situation: 'Pressing the button on something big',
      why4_person: 'Someone about to launch their creation',
      why5_feeling: 'Triumph - you did it',
    },
    prompt: `Celebratory illustration of a person about to press a large,
friendly button. Their expression is excited and proud. Confetti is ready
to burst. Friends are watching supportively in background. Warm, festive
colors. The button glows invitingly. Australian office party atmosphere.
The feeling is: "You're about to launch something great!"
${HUMAN_STORY_MANDATE}`
  },

  // ============================================================================
  // AI FEATURE IMAGES - AI as Helper, Not Threat
  // ============================================================================
  {
    id: 'ai-email-processing',
    category: 'ai',
    fiveWhys: {
      why1_image: 'Show AI as a helpful assistant sorting mail',
      why2_style: 'Warm illustration - AI as friendly helper',
      why3_situation: 'Helpful presence organizing the chaos',
      why4_person: 'Business owner with a great assistant',
      why5_feeling: 'Supported - someone has my back',
    },
    prompt: `Warm illustration of a business owner relaxing with coffee while
a friendly, abstract helper presence (warm glowing shape, NOT a robot)
cheerfully sorts through a pile of mail nearby. The mail is being
organized into neat, colorful stacks. The owner looks relieved and
grateful. Cozy home office setting. Australian morning light. The
feeling is: "Someone is helping me manage all this."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'ai-lead-qualification',
    category: 'ai',
    fiveWhys: {
      why1_image: 'Show finding the right customers like finding friends',
      why2_style: 'Warm illustration - connection not sorting',
      why3_situation: 'Right people finding each other',
      why4_person: 'Business finding their perfect customers',
      why5_feeling: 'Destiny - meant to work together',
    },
    prompt: `Warm illustration of two groups of friendly abstract people
figures, with certain ones from each group being gently drawn together
by soft golden light. The connected ones are smiling brightly at each
other. Others wait patiently, their time will come. Soft, warm colors.
The feeling is: "The right people always find each other."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'ai-content-personalization',
    category: 'ai',
    fiveWhys: {
      why1_image: 'Show making everyone feel special',
      why2_style: 'Heartfelt illustration - personal attention',
      why3_situation: 'Each person getting something just for them',
      why4_person: 'Customers feeling individually valued',
      why5_feeling: 'Special - this was made for me',
    },
    prompt: `Heartfelt illustration of a business owner hand-writing
different notes, each floating toward different happy recipients.
Each recipient has a unique appearance and is delighted by their
personal message. The notes have different soft colors but no
readable text. The sender is focused and caring. The feeling is:
"Everyone gets something made just for them."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'ai-predictive-insights',
    category: 'ai',
    fiveWhys: {
      why1_image: 'Show being prepared for what comes next',
      why2_style: 'Wise illustration - foresight not magic',
      why3_situation: 'Experienced guide showing the way',
      why4_person: 'Business owner with a wise mentor',
      why5_feeling: 'Guidance - I know what to do next',
    },
    prompt: `Wise illustration of an experienced mentor figure pointing
toward a sunlit path while a business owner listens attentively. The
path ahead shows gentle hills with opportunities visible. Behind them,
a complex maze they've navigated. Australian bush walking trail setting.
Warm afternoon light. The feeling is: "Someone wise is showing me
the way."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'ai-smart-recommendations',
    category: 'ai',
    fiveWhys: {
      why1_image: 'Show getting great advice from a trusted friend',
      why2_style: 'Friendly illustration - advice from a friend',
      why3_situation: 'Friend suggesting something perfect',
      why4_person: 'Someone receiving great advice',
      why5_feeling: 'Trust - good advice from good friends',
    },
    prompt: `Friendly illustration of two friends at a cafe, one
excitedly suggesting something (hand gestures showing enthusiasm)
while the other has a lightbulb moment. Coffee cups between them.
Australian cafe with good vibes. The suggester is clearly excited
to help. The receiver looks grateful and inspired. The feeling is:
"Thanks for the perfect suggestion!"
${HUMAN_STORY_MANDATE}`
  },

  // ============================================================================
  // TRUST IMAGES - Reliability and Care
  // ============================================================================
  {
    id: 'trust-data-security',
    category: 'trust',
    fiveWhys: {
      why1_image: 'Show data being cared for like something precious',
      why2_style: 'Reassuring illustration - safety and care',
      why3_situation: 'Precious things being protected',
      why4_person: 'Someone who trusts us with what matters',
      why5_feeling: 'Safe - my precious things are protected',
    },
    prompt: `Reassuring illustration of precious items (abstract
representing data/memories) being carefully placed in a beautiful,
secure chest by caring hands. The chest has a warm glow, indicating
safety. Soft, protective lighting. Colors are warm and comforting.
The hands are gentle and respectful. The feeling is: "What matters
to you is safe with us."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'trust-uptime-reliability',
    category: 'trust',
    fiveWhys: {
      why1_image: 'Show always being there when needed',
      why2_style: 'Reliable illustration - consistent presence',
      why3_situation: 'Lighthouse always guiding the way',
      why4_person: 'Someone who needs to count on something',
      why5_feeling: 'Reliability - always there when I need it',
    },
    prompt: `Reliable illustration of a lighthouse on the Australian
coast, beam shining steadily through various weather conditions
shown around it (sun, rain, night, storm). Ships navigate safely
in the background. The lighthouse stands strong and consistent.
Warm golden light from the beacon. The feeling is: "No matter what,
we'll be here."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'trust-customer-support',
    category: 'trust',
    fiveWhys: {
      why1_image: 'Show real people ready to help',
      why2_style: 'Genuine photography - real human support',
      why3_situation: 'Friendly expert solving a problem',
      why4_person: 'Support team member who genuinely cares',
      why5_feeling: 'Relief - someone understands and helps',
    },
    prompt: `Genuine photograph of a friendly customer support person
on a video call, with warm smile and attentive expression. They're
in a comfortable home office with plants. On their screen (blurred
for privacy) is a happy customer. Australian home office aesthetic.
Natural light. They look like someone you'd trust immediately. The
feeling is: "Real people who actually want to help."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'trust-privacy-compliance',
    category: 'trust',
    fiveWhys: {
      why1_image: 'Show respecting boundaries like a good neighbor',
      why2_style: 'Respectful illustration - trust through boundaries',
      why3_situation: 'Good neighbor respecting your space',
      why4_person: 'Someone who values privacy',
      why5_feeling: 'Respected - my boundaries matter',
    },
    prompt: `Respectful illustration of two neighboring houses with
a beautiful shared fence. Both neighbors are waving friendly to
each other but respecting the boundary. Gardens are beautiful on
both sides. Australian suburban setting. Clear boundaries but warm
relationship. The feeling is: "We respect your boundaries."
${HUMAN_STORY_MANDATE}`
  },

  // ============================================================================
  // PRICING IMAGES - Value and Growth
  // ============================================================================
  {
    id: 'pricing-starter',
    category: 'pricing',
    fiveWhys: {
      why1_image: 'Show first step on an exciting journey',
      why2_style: 'Encouraging illustration - humble beginnings',
      why3_situation: 'Someone taking their first business step',
      why4_person: 'New business owner full of potential',
      why5_feeling: 'Beginning - every journey starts here',
    },
    prompt: `Encouraging illustration of someone planting a small
seedling in a pot on their apartment balcony. They look hopeful
and excited about what this seedling will become. Sun is rising.
Australian apartment setting. The seedling has potential energy
around it. Simple but meaningful. The feeling is: "Great things
start small."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'pricing-professional',
    category: 'pricing',
    fiveWhys: {
      why1_image: 'Show growing confidence and capability',
      why2_style: 'Confident illustration - growing business',
      why3_situation: 'Business that has found its stride',
      why4_person: 'Growing business owner',
      why5_feeling: 'Momentum - we are really doing this',
    },
    prompt: `Confident illustration of a small team (3-4 people) in
their growing office space, working energetically together. Plants
are thriving in corners. Natural light fills the space. Everyone
looks engaged and purposeful. Australian small business aesthetic.
The feeling is: "We've found our rhythm and we're growing."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'pricing-business',
    category: 'pricing',
    fiveWhys: {
      why1_image: 'Show established success and expansion',
      why2_style: 'Successful photography - real achievement',
      why3_situation: 'Business that has expanded significantly',
      why4_person: 'Successful business owner with growing team',
      why5_feeling: 'Achievement - hard work has paid off',
    },
    prompt: `Successful photograph of a business owner standing in
front of their second location opening. Small crowd of supporters
and team members celebrating. Ribbon cutting moment. Australian
main street setting. Genuine pride and happiness on everyone's
faces. The original location visible nearby. The feeling is:
"From one location to many - dreams do come true."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'pricing-enterprise',
    category: 'pricing',
    fiveWhys: {
      why1_image: 'Show becoming an industry leader',
      why2_style: 'Inspiring photography - leadership achieved',
      why3_situation: 'Leader speaking at industry event',
      why4_person: 'Business leader who made it',
      why5_feeling: 'Leadership - we became the example',
    },
    prompt: `Inspiring photograph of a business leader on stage at
an Australian conference, sharing their story with an engaged
audience. Confident but humble posture. The audience is diverse
professionals, some taking notes. Professional conference setting
with warm lighting. The feeling is: "From small start to industry
leader."
${HUMAN_STORY_MANDATE}`
  },

  // ============================================================================
  // CTA IMAGES - Taking Action
  // ============================================================================
  {
    id: 'cta-get-started',
    category: 'cta',
    fiveWhys: {
      why1_image: 'Make starting feel exciting not scary',
      why2_style: 'Adventure photography - journey begins',
      why3_situation: 'First step on an amazing path',
      why4_person: 'Someone about to start something great',
      why5_feeling: 'Excitement - adventure awaits',
    },
    prompt: `Adventure photograph of a person taking their first step
onto a beautiful hiking trail. The path ahead shows stunning
Australian landscape - mountains, ocean visible in distance.
Morning golden hour light. They're looking ahead with excitement
and determination. Hiking boots stepping onto the trail. The
feeling is: "The best adventures start with one step."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'cta-book-demo',
    category: 'cta',
    fiveWhys: {
      why1_image: 'Make booking a demo feel like meeting a friend',
      why2_style: 'Warm photography - friendly meeting',
      why3_situation: 'Coffee meeting with someone helpful',
      why4_person: 'Someone about to get great advice',
      why5_feeling: 'Anticipation - about to learn something useful',
    },
    prompt: `Warm photograph of two people about to meet for coffee,
one arriving at the cafe, the other waving from inside with a
friendly smile. The arriving person looks relieved to find someone
so welcoming. Beautiful Australian cafe. Morning light. The table
has two coffees ready. The feeling is: "This is going to be helpful,
not a sales pitch."
${HUMAN_STORY_MANDATE}`
  },
  {
    id: 'cta-free-trial',
    category: 'cta',
    fiveWhys: {
      why1_image: 'Make free trial feel like a gift',
      why2_style: 'Delightful illustration - gift receiving',
      why3_situation: 'Receiving an unexpected wonderful gift',
      why4_person: 'Someone receiving something generous',
      why5_feeling: 'Delight - this is too good',
    },
    prompt: `Delightful illustration of a person receiving a beautifully
wrapped gift box that has just opened to reveal golden light and
possibilities inside. Their expression is surprised delight. The
gift giver (abstract, friendly presence) watches happily. Warm,
festive colors. Australian living room setting. The feeling is:
"This is really free? What a gift!"
${HUMAN_STORY_MANDATE}`
  },
];

// Initialize Gemini client
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateImage(imageConfig, index, total) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`[${index + 1}/${total}] Generating: ${imageConfig.id}`);
  console.log(`Category: ${imageConfig.category}`);
  console.log(`\n5 WHYS ANALYSIS:`);
  console.log(`  1. WHY this image?    ${imageConfig.fiveWhys.why1_image}`);
  console.log(`  2. WHY this style?    ${imageConfig.fiveWhys.why2_style}`);
  console.log(`  3. WHY this situation? ${imageConfig.fiveWhys.why3_situation}`);
  console.log(`  4. WHY this person?   ${imageConfig.fiveWhys.why4_person}`);
  console.log(`  5. WHY this feeling?  ${imageConfig.fiveWhys.why5_feeling}`);
  console.log(`${'═'.repeat(70)}`);

  try {
    const response = await genAI.models.generateContent({
      model: ALLOWED_IMAGE_MODEL,
      contents: [{ parts: [{ text: imageConfig.prompt }] }],
      generationConfig: {
        responseModalities: ['IMAGE', 'TEXT'],
      },
    });

    if (response.candidates && response.candidates[0]) {
      const candidate = response.candidates[0];

      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const imageData = part.inlineData.data;
            const mimeType = part.inlineData.mimeType || 'image/png';
            const extension = mimeType.includes('jpeg') ? 'jpg' : 'png';

            const outputPath = path.join(OUTPUT_DIR, `${imageConfig.id}.${extension}`);
            const imageBuffer = Buffer.from(imageData, 'base64');

            fs.writeFileSync(outputPath, imageBuffer);
            console.log(`\n✅ SUCCESS: Saved ${outputPath}`);
            console.log(`   Size: ${(imageBuffer.length / 1024).toFixed(1)} KB`);
            console.log(`   Feeling achieved: "${imageConfig.fiveWhys.why5_feeling}"`);
            return true;
          }
        }
      }
    }

    console.log(`\n❌ FAILED: No image data in response`);
    return false;

  } catch (error) {
    console.log(`\n❌ ERROR: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║     EXCELLENCE-GRADE IMAGE GENERATION                                  ║');
  console.log('║     5 WHYS MARKETING THEORY                                           ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════╣');
  console.log('║  THE STORY: Businesses struggling to get their brand message out.     ║');
  console.log('║  THE SOLUTION: Synthex helps them be heard.                           ║');
  console.log('║  THE IMAGES: Real humans, real emotions, real stories.               ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════╣');
  console.log('║  VARIETY: Photorealistic, Illustration, Lifestyle, Landscape          ║');
  console.log('║  NO: Robots, cold tech, sci-fi, generic stock                        ║');
  console.log('║  YES: Coffee shop meetings, success celebrations, human connection   ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝');
  console.log(`\nTotal images to generate: ${IMAGES_WITH_5WHYS.length}`);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let successCount = 0;
  let failCount = 0;
  const failedImages = [];

  for (let i = 0; i < IMAGES_WITH_5WHYS.length; i++) {
    const success = await generateImage(IMAGES_WITH_5WHYS[i], i, IMAGES_WITH_5WHYS.length);
    if (success) {
      successCount++;
    } else {
      failCount++;
      failedImages.push(IMAGES_WITH_5WHYS[i].id);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║                    GENERATION COMPLETE                                 ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝');
  console.log(`\nResults:`);
  console.log(`  ✅ Success: ${successCount}/${IMAGES_WITH_5WHYS.length}`);
  console.log(`  ❌ Failed:  ${failCount}/${IMAGES_WITH_5WHYS.length}`);

  if (failedImages.length > 0) {
    console.log(`\nFailed images:`);
    failedImages.forEach(id => console.log(`  - ${id}`));
  }

  console.log('\n');
  console.log('NEXT STEPS:');
  console.log('1. Visual QA each image with Playwright');
  console.log('2. Verify each image evokes the intended feeling');
  console.log('3. Apply to codebase locations');
  console.log('4. Run final build verification');
}

main().catch(console.error);
