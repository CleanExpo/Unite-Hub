#!/usr/bin/env node

/**
 * VEO Video Generation Script
 * Generates 6 professional 4K videos using Gemini API
 * with Synthex logo watermarking
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, "..");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY not found in environment variables");
  process.exit(1);
}

const client = new GoogleGenerativeAI(GEMINI_API_KEY);

// VEO video prompts from our research
const VEO_PROMPTS = [
  {
    id: "video-scattered-leads",
    title: "Your Best Leads Are Hiding in 5 Different Places",
    prompt: `
Create a professional 4K marketing video (30 seconds) with Synthex watermark.

SCENE 1 (0-4s): THE CHAOS MOMENT
- VISUAL: Split-screen showing 5 different business tools simultaneously
  - Left side: Gmail inbox with 35 unread emails, chaotic notifications
  - Top-right corner: Facebook Messenger conversation thread
  - Bottom-right: Google Sheet with outdated contact list (timestamp "3 weeks ago")
  - Center overlay: Slack notification pinging
  - Bottom: Handwritten notepad with barely legible lead names
- VOICEOVER (professional, slightly frustrated): "Your leads are everywhere. Gmail. Facebook. Text. Google Sheets. Your notebook. No one knows which lead is actually hot."
- SOUND DESIGN: Chaotic notification layer (email ping, message ding, slack bloop)
- TEXT ON SCREEN: "35 unread emails", "5 tools", "1 chance to respond"
- EMOTION: Chaos, overwhelm, helplessness

SCENE 2 (5-10s): THE TIME COST
- VISUAL: Salesperson frantically searching through emails
  - Quick cuts: typing in Gmail search box, getting 47 results, scrolling endlessly
  - Corner timer display: "6:45 wasted looking for one lead"
  - Frustrated facial expression, sighing
- VOICEOVER (direct, matter-of-fact): "You spend 6-8 hours per week just digging. And half the time? You still miss the hot ones."
- TEXT ON SCREEN: "6-8 hours/week on email searches"
- STAT DISPLAY: "21x less likely to qualify a lead if you wait 30 min vs 5 min (MIT)"
- EMOTION: Frustration, wasted time, futility

SCENE 3 (11-20s): THE MISSED OPPORTUNITY
- VISUAL: Close-up of email from hot prospect
  - Subject: "We'd love to learn more, we're ready to move forward this month"
  - This email gets buried in the 47 unread messages
  - Animation: Email sinking into inbox, disappearing
  - Cut to: Same prospect closing deal with competitor
  - On-screen notification appears: "Your competitor just won this deal"
  - Timeline shows only 3 hours elapsed between inquiry and competitor close
- VOICEOVER (regretful, emotional): "That prospect waited 3 hours for a response. Your competitor responded in 15 minutes. They closed the deal."
- TEXT ON SCREEN: "78% of customers buy from the FIRST company that responds"
- VISUAL STAT: "3-hour delay = Lost deal"
- EMOTION: Regret, lost revenue, competitive disadvantage

SCENE 4 (21-30s): SYNTHEX SOLVES IT
- VISUAL: Same 5 chaotic tools transition into ONE unified Synthex dashboard
  - Animation: All leads flowing and consolidating into single clean interface
  - Dashboard appears: Modern, professional, organized
  - All leads auto-organize by urgency color-coding (RED=hot, ORANGE=warm, GREEN=follow-up)
  - Top lead highlighted in RED: High-intent prospect clearly marked
  - Salesperson finds the hot lead in 10 seconds (not 8 hours)
  - One-click response interface appears with pre-written personalized suggestion
  - Message sends immediately
- VOICEOVER (relief, confidence): "Synthex pulls every lead into one place. It reads each one. Tells you which ones are actually ready to buy. You respond in minutes, not hours."
- VISUAL CONFIRMATION: Green checkmark appears—deal closing notification
  - Money in account notification flashes briefly
- TEXT ON SCREEN: "Found in 10 seconds. Responded in 3 minutes. Deal closed."
- CTA TEXT (prominent): "Stop losing deals to disorganization. Try Synthex free."
- CLOSING FRAME: Synthex logo (professionally watermarked bottom-right), tagline "Every lead. One place. Zero chaos."
- EMOTION: Relief, control, winning, momentum

WATERMARK SPECIFICATIONS:
- Apply Synthex logo (professional, clean design)
- Position: Bottom-right corner throughout main content
- Size: 120px x 120px (main scenes), 200px x 200px (final frame)
- Opacity: 40-50% (visible but non-intrusive)
- Style: White logo with subtle glow effect
- Final frame: Logo at full size with clear tagline and CTA button
- Duration: Visible from scene 4 onwards, prominent hold 2-3 seconds

PRODUCTION QUALITY:
- 4K resolution (3840 x 2160)
- Professional color grading
- Smooth transitions between scenes
- Realistic business tool mockups (Gmail, Slack, Facebook, Google Sheets)
- High-quality stock footage or motion graphics
- Clear, professional voiceover
- Emotional pacing (chaos → frustration → regret → relief → winning)
- Professional audio mixing with notification sounds
- Text overlays crisp and readable
- Final frame holds for 3 seconds with clear Synthex branding

OUTPUT FORMAT: MP4, H.264 codec, AAC audio, 30 seconds duration
    `,
  },
  {
    id: "video-5-minute-rule",
    title: "The 5-Minute Conversion Rule Nobody Talks About",
    prompt: `
Create a professional 4K marketing video (30 seconds) about speed-to-lead impact.

SCENE 1 (0-5s): THE RESEARCH-BACKED RULE
- VISUAL: Clean data visualization on white background
  - Professional timeline with milestone markers
  - At 5-minute mark: GREEN zone labeled "30% conversion rate" with upward arrow
  - At 30-minute mark: ORANGE zone labeled "10% conversion rate" with declining arrow
  - At 1-hour mark: RED zone labeled "1% conversion rate" with sharp drop
  - Graph overlays showing dramatic conversion cliff after 5-minute mark
  - MIT research citation displayed
- VOICEOVER (authoritative, serious): "There's a rule in sales that MIT studied. Your window to convert a lead is 5 minutes. After that? Your odds drop 20 times."
- TEXT ON SCREEN: "MIT Lead Response Management Study", red stat: "21x more likely to qualify a lead in 5 min vs 30 min"
- AUDIO: Serious, authoritative background tone
- EMOTION: Urgency, high stakes

SCENE 2 (6-12s): WHY IT HAPPENS
- VISUAL: Prospect perspective—they submit inquiry form
  - Thought bubble: "I hope they respond quickly?"
  - Animation: Clock ticking, 5 minutes pass visually
  - Prospect gets distracted: Opens competitor website in new tab
  - Competitor's chat appears: "Hi! Thanks for reaching out. How can we help?"
  - YOUR response finally arrives (45 minutes later): "Thanks for contacting us"
  - Prospect's reaction: "Too late, I already talked to them"
  - Prospect closes your email, engages with competitor
- VOICEOVER (understanding, sympathetic): "Your prospect just submitted their contact info. They're ready to talk. But if you're not there in 5 minutes? They move on. To your competitor."
- TEXT ON SCREEN: "78% of customers buy from the FIRST company that responds"
- VISUAL: "First responder wins" badge/emphasis
- EMOTION: FOMO, competitive threat, inevitability

SCENE 3 (13-22s): THE FINANCIAL COST
- VISUAL: Week-long calendar showing cascading losses
  - Monday: 5 leads missed (slow Friday responses)
  - Tuesday: 3 leads missed
  - Wednesday: 4 leads missed
  - Thursday: 6 leads missed
  - Friday: 7 leads missed
  - Weekly loss total counter climbing: "$47,000 in lost deals"
  - Real-time impact badge: "1 lead lost every 2 hours"
  - Cumulative revenue loss chart trending downward
  - Crisis mode indicator (red warning)
- VOICEOVER (direct, hitting pain): "One company was losing a lead every 2 hours. That's $47,000 per week in lost revenue. Just because they responded in 45 minutes instead of 5."
- TEXT ON SCREEN: "1 missed lead every 2 hours = $47K/week"
- VISUAL: Dollar signs appearing and disappearing (wasted money)
- SOUND: Tension-building background music
- EMOTION: Financial pain, urgency, business crisis

SCENE 4 (23-30s): SYNTHEX CHANGES THE GAME
- VISUAL: Synthex dashboard in real-time action
  - Lead arrives: Email notification appears
  - AI analysis triggers: Immediate alert "Hot prospect. Likelihood to buy: 92%"
  - Dashboard highlights prospect in RED (highest priority)
  - One-click response interface appears with smart suggestion
  - Salesperson clicking "respond" button
  - Message sends in seconds
  - Timestamp display: "Responded in 3 minutes" (green checkmark)
  - 2-week timeline jump to deal closure
  - Deal closing celebration: Success notification with deal value ($28,000)
  - Upward-trending conversion graph appears
- VOICEOVER (confident, victorious): "Synthex alerts you instantly. You respond in minutes, not hours. One client went from 12% to 25% conversion rate. Just by being faster."
- VISUAL: Clear success moment, celebration animation
- TEXT ON SCREEN: "Responded in 3 minutes. Deal closed in 2 weeks."
- CTA TEXT (prominent): "Respond in 5 minutes. Close more deals. Try free for 14 days."
- CLOSING: Large Synthex logo, tagline "Speed wins deals."
- EMOTION: Winning, confidence, momentum, relief

WATERMARK: Synthex logo bottom-right, 120px, 45% opacity, throughout video

PRODUCTION QUALITY: 4K, professional color grading, H.264, 30 seconds
    `,
  },
  {
    id: "video-lead-scoring",
    title: "Why Your Salesperson Is Wasting 40+ Hours on Cold Leads",
    prompt: `
Create a professional 4K marketing video (30 seconds) about lead scoring impact.

SCENE 1 (0-5s): THE REALITY CHECK
- VISUAL: Salesperson's calendar showing 12 scheduled calls
  - Quick montage of actual call interactions:
    - Call 1: "We're not ready yet" → Hangs up, call ends
    - Call 2: "Still evaluating options" → Dead end
    - Call 3: "Checking with the team" → No buying signal
    - Call 4-12: Similar rejections, dead ends
  - Time counter visible: "6 hours spent on non-deals"
  - Meanwhile: Inbox shows unread emails (clearly hot prospects in subject lines: "We want to move forward THIS month", "Budget approved", "Decision made")
  - Those hot prospects never get called—sitting ignored in inbox
- VOICEOVER (sympathetic): "Your salesperson makes 12 calls today. 9 of them go nowhere. 6 hours wasted on leads that'll never buy. Meanwhile, the hot ones? Sitting in the inbox, untouched."
- TEXT ON SCREEN: "9 cold calls. 0 conversions. 6 wasted hours."
- EMOTION: Frustration, wasted effort, demoralization

SCENE 2 (6-13s): THE QUALIFICATION GAP
- VISUAL: Same inbox from salesperson view
  - All emails appear identical on surface (no visual differentiation)
  - Quick interviews with different reps:
    - Rep 1: "I just call them in order"
    - Rep 2: "I call the ones I remember"
    - Rep 3: *Shrugs* "Honestly, I don't know"
  - Animation: Hot leads and cold leads mixed randomly, no way to distinguish
  - Chaos indicator (jumbled leads)
- VOICEOVER (honest, matter-of-fact): "Without scoring, it's just luck. You call them in order. Or the ones you remember. The actually hot leads? The ones ready to buy right now? You miss them."
- TEXT ON SCREEN: "26% conversion improvement with proper lead scoring (Gartner)"
- VISUAL: "Guessing doesn't work" emphasized
- EMOTION: Helplessness, system failure

SCENE 3 (14-22s): THE COST OF GUESSING
- VISUAL: Deal opportunity timeline showing massive waste
  - Monday morning: Rep calls COLD lead (wasting time)
  - Hours shown ticking by: Rep on call with unqualified prospect
  - Meanwhile: HOT PROSPECT enters the system but never gets attention
  - Tuesday: Rep still working cold lead, zero progress
  - Wednesday: Hot prospect gets impatient, looks at competitors
  - Friday: Your competitor closes the deal with HOT PROSPECT
  - Notification appears: "Competitor won: $45,000 deal"
  - Meanwhile: Rep's cold lead still hasn't moved or converted
  - Timestamp emphasis: "Only 3-day window was open, opportunity missed"
  - Financial impact visualization: Revenue to competitor shown
- VOICEOVER (regretful): "A hot prospect entered your system Tuesday. Your team never called them. They bought from your competitor Friday. Meanwhile, you've been working unqualified leads all week."
- TEXT ON SCREEN: "3-day window. Missed. Deal went to competitor."
- VISUAL: Competitor wins, your company loses (clear contrast)
- EMOTION: Regret, lost revenue, competitive disadvantage

SCENE 4 (23-30s): SYNTHEX AI SCORING
- VISUAL: Synthex lead scoring engine in action
  - Email arrives in inbox
  - AI analysis begins (showing thinking process visually)
  - Real-time scoring factors appear on screen with values:
    - "Budget mentioned: Yes (+25 points)" ✓
    - "Timeline stated: This month (+30 points)" ✓
    - "Authority: Decision-maker (+20 points)" ✓
    - "Final score: 92/100 (HOT PROSPECT)" in large red text
  - Dashboard auto-sorts: Leads ranked by actual conversion likelihood
  - Top 3 hot leads displayed prominently
  - Salesperson sees top-ranked lead immediately
  - One click to call: Connected to hot prospect
  - Call interaction shows engagement
  - 2-week fast-forward: Deal closes successfully
  - Success metrics displayed: "Conversion rate improved 3% → 5%"
  - Sales rep celebrating (high five, success gesture)
- VOICEOVER (clear, confident): "Synthex reads every lead. Analyzes urgency, authority, timeline. Puts your hottest prospects at the top. One team went from 3% to 5% conversion just by calling the right people first."
- VISUAL: Clear AI advantage, efficiency gains shown
- CTA TEXT: "Know which leads are actually hot. Try Synthex free."
- CLOSING: Synthex logo, "Smart calls. Better closes."
- EMOTION: Control, intelligence, winning

WATERMARK: Synthex logo bottom-right throughout, 120px, 45% opacity

PRODUCTION QUALITY: 4K professional, smooth transitions, H.264, 30 seconds
    `,
  },
  {
    id: "video-realtime-data",
    title: "The 48-Hour Information Problem",
    prompt: `
Create a professional 4K marketing video (30 seconds) about real-time dashboard data.

SCENE 1 (0-4s): THE BLIND SPOT
- VISUAL: Marketing manager staring at dashboard
  - Dashboard timestamp clearly visible: "Updated Wednesday, 9am"
  - Current time on screen: "Friday, 3pm" (48+ hours later)
  - Campaign has been running for 48 hours straight
  - Manager's confused expression: "Wait, is this working or not?"
  - Visual confusion indicator (question mark, uncertainty)
- VOICEOVER (frustrated): "It's Friday. Your dashboard is showing Wednesday's data. You have no idea if your campaign is working or tanking."
- TEXT ON SCREEN: "Dashboard: Wednesday 9am. Now: Friday 3pm. Data age: 48 hours."
- SOUND: Slight tension, uncertainty music
- EMOTION: Uncertainty, lack of control

SCENE 2 (5-12s): THE HIDDEN COST
- VISUAL: Campaign performance graph showing hidden failure
  - Line shows normal Tuesday/Wednesday performance (upward)
  - At Thursday 2pm: Line tanks sharply (campaign failure begins)
  - But manager can't see this until Friday
  - Money counter running during 48-hour gap: "$3,200 wasted... $4,800... $5,200..."
  - Visual waste indicator (money burning animation)
  - Manager finally sees problem Friday 3pm: "Oh no, this is failing!"
  - But damage already done (large red X indicating missed opportunity)
- VOICEOVER (direct, financial pain): "Your campaign is hemorrhaging money Thursday. You find out Friday. You've already burned $3,200 on something that isn't working."
- TEXT ON SCREEN: "$3,200 wasted on a campaign you didn't know was failing"
- SOUND: Serious, slight alarm tone
- EMOTION: Financial pain, frustration, regret

SCENE 3 (13-22s): COMPETITOR'S REAL-TIME ADVANTAGE
- VISUAL: Split-screen competitive comparison
  - Left side: Your company (Friday afternoon, realizing failure)
  - Right side: Competitor's dashboard (Wednesday 2pm, sees performance drop)
  - Competitor: Immediately pivots strategy (new audience, new message shown)
  - Real-time decision making visible
  - By Friday: Competitor's updated campaign performing 40% better
  - Your company: Still running same failing campaign from Wednesday
  - Chart shows diverging results over 48 hours
  - Clear winner: Competitor (graph shoots up), Your company (graph flat/down)
  - Competitor wins the engagement and customers (notifications appear)
- VOICEOVER (competitive threat): "Your competitor sees the problem in real-time. They pivot within 2 hours. You're still running the same failing campaign Friday."
- TEXT ON SCREEN: "Competitor: Real-time data. Your company: 48-hour delay."
- VISUAL: Clear competitive disadvantage shown
- EMOTION: Competitive anxiety, falling behind, pressure

SCENE 4 (23-30s): SYNTHEX REAL-TIME DASHBOARD
- VISUAL: Synthex live dashboard in action
  - Campaign launches Monday morning
  - Metrics updating visually in real-time (every minute shown with counter increment)
  - Wednesday 2pm: Performance starts declining (manager sees immediately)
  - Immediate alert notification pops: "Campaign performance declining. Consider pausing or pivoting."
  - Manager makes decision same day (by 3pm)
  - New audience/message deployed Wednesday evening
  - By Thursday morning: Revamped campaign is winning (graph shoots upward)
  - Friday metrics: ROI recovered + 20% improvement shown
  - Success celebration (upward graph, positive indicators)
  - Performance dashboard showing active monitoring
- VOICEOVER (relief, confidence): "Synthex updates every minute. You see problems immediately. Pivot the same day. One client doubled their ROI by stopping failing campaigns early and reallocating budget to winners."
- VISUAL: Happy manager, success metrics, upward trending
- TEXT ON SCREEN: "Real-time update every minute. Decisions made today. ROI doubled."
- CTA TEXT: "See what's actually happening. Make decisions TODAY. Try free for 14 days."
- CLOSING: Synthex logo, "Real-time. Real results."
- EMOTION: Control, confidence, winning, empowerment

WATERMARK: Professional Synthex logo bottom-right, subtle glow, 120px, 45% opacity

PRODUCTION QUALITY: 4K, professional color grading, smooth animations, H.264, 30 seconds
    `,
  },
  {
    id: "video-approval-bottleneck",
    title: "Why Approval Processes Kill Your Best Ideas",
    prompt: `
Create a professional 4K marketing video (30 seconds) about approval workflow optimization.

SCENE 1 (0-7s): THE APPROVAL NIGHTMARE
- VISUAL: Campaign creative ready for launch
  - Email notification appears: "Campaign ready. Needs approval from 5 people"
  - Each approver labeled with their availability:
    - "CEO (will check in 6 hours)"
    - "Client (8 time zones away, checking tomorrow)"
    - "Finance (checks email 2x per day)"
    - "CMO (in meetings until 4pm)"
    - "Legal (unresponsive)"
  - Calendar showing Friday 5pm deadline ticking closer
  - Panic indicator (red alert) showing time pressure
  - Animation: approval request bouncing between people, getting lost
- VOICEOVER (sympathetic frustration): "Your campaign is ready. But you need approval from 5 people. Your CEO is busy. Your client is 8 time zones away. Finance checks email once. This campaign will be late."
- EMOTION: Dread, helplessness, frustration

SCENE 2 (8-16s): EVERY HOUR DELAY = MISSED WINDOW
- VISUAL: Campaign deadline (Friday 5pm) getting closer
  - Animation: Days ticking down
  - Markings: "Friday... [wait for approval]... Monday morning... [too late, trend ended]"
  - Marketing trend visualization: Trend hot Monday-Wednesday, cooling by Friday
  - By Monday when campaign finally launches: Trend is dead (gray/cold indicator)
  - Engagement prediction chart: Shows 60% engagement loss from delayed launch
- VOICEOVER (regretful): "Your deadline is Friday. It's now Thursday. You're still waiting on approval from 3 people. By Monday? Your campaign window is closed."
- TEXT ON SCREEN: "Trend window: Mon-Wed. Launch date: Following Monday. Engagement: Down 60%."
- EMOTION: Panic, pressure, inevitable failure

SCENE 3 (17-26s): THE BACK-AND-FORTH EMAIL NIGHTMARE
- VISUAL: Email chain expanding rapidly
  - Subject: "Campaign Creative - APPROVAL NEEDED"
  - Shows 23 emails in expanding accordion
  - Quick cuts of different revision requests:
    - Email 1: "Looks good, one small change on the tagline"
    - Email 2: "Wait, can we try a different color?"
    - Email 3: "CEO wants to review before Friday"
    - Email 4: "I didn't get the latest version, which one is final?"
    - Email 23: "Can we re-review the tagline change from Email 5?"
  - Timeline overlay: Monday send... Wednesday response... Friday another revision...
  - Visual chaos: Too many cooks, no single source of truth
- VOICEOVER (exhausted): "Revise. Send back. Revise again. By the time everyone approves, you've rewritten it 3 times and it's now off-brand."
- TEXT ON SCREEN: "23 emails. 5 revisions. 8 days elapsed. Still waiting."
- EMOTION: Exhaustion, futility, broken process

SCENE 4 (27-30s): SYNTHEX ONE-PLACE APPROVALS
- VISUAL: Synthex approval interface (clean, modern)
  - Campaign appears in ONE unified place
  - All approvers get notification in THEIR preferred channel:
    - CEO: Desktop notification + Asana integration
    - Client: Mobile notification + SMS alert
    - Finance: Email integration
    - CMO: Slack notification
    - Legal: Dashboard notification
  - Each approver sees same creative on their device of choice
  - Real-time approval tracking showing timestamps:
    - CEO approves (2 min): ✓ Approved
    - Client approves (8 min): ✓ Approved
    - Finance approves (1 min): ✓ Approved
    - CMO approves (3 min): ✓ Approved
    - Legal approves (5 min): ✓ Approved
  - Total time: 5 minutes, all approvals done
  - Campaign auto-queues for launch immediately
  - Timeline shows: Friday 2pm approval, Friday 3pm launch
  - Campaign goes live while trend is hot (engagement metrics climbing)
- VOICEOVER (relief): "Synthex puts everything in one place. Approvers see it their way. Approvals come back in minutes. You launch the same day. One agency cut their campaign time from 8 days to 3 days."
- VISUAL: Campaign going live, real-time engagement metrics climbing upward
- TEXT ON SCREEN: "Approval cycle: 5 minutes. Launch time: Same day. Trend captured: 100%"
- CTA TEXT: "Launch campaigns without delays. Try free for 14 days."
- CLOSING: Synthex logo with upward momentum, "Approve fast. Launch faster."
- EMOTION: Relief, momentum, winning, empowerment

WATERMARK: Synthex logo bottom-right, 120px, 45% opacity, glows subtly with approvals

PRODUCTION QUALITY: 4K professional, smooth transitions, H.264, 30 seconds
    `,
  },
  {
    id: "video-setup-tax",
    title: "The Setup Tax That\'s Killing Your Growth",
    prompt: `
Create a professional 4K marketing video (30 seconds) about fast onboarding benefits.

SCENE 1 (0-5s): THE SETUP PARALYSIS
- VISUAL: Founder excited about new tool
  - Monday: Founder purchases CRM, reads implementation guide
  - 247-page PDF appears on screen (shocking size)
  - Chapters visible: "Infrastructure Setup", "Data Migration", "Custom Workflows", "Security Config"
  - Developer looking horrified at complexity
  - Calendar: 6 weeks of implementation time blocked out (red)
  - Dollar counter ticking: "$2,000... $6,000... $9,000... $12,000..."
  - Financial dread visualization
- VOICEOVER (sympathetic frustration): "You buy a new marketing tool Monday. Setup takes 6 weeks and a $12,000 developer bill. You're now 6 weeks behind your competition."
- TEXT ON SCREEN: "Setup time: 6 weeks. Developer cost: $12K. Opportunity cost: Priceless."
- SOUND: Dread-filled tone, ticking clock
- EMOTION: Dread, financial pain, helplessness

SCENE 2 (6-13s): THE OPPORTUNITY COST
- VISUAL: Split-screen competitive comparison
  - Left side: Your company (waiting for 6-week setup)
    - Week 1: In setup mode, no campaigns running
    - Week 3: Still waiting, competitors gaining advantage
    - Week 6: Finally ready, but market has moved on
  - Right side: Competitor (using simple tool)
    - Day 1: Connected and running campaigns
    - Week 2: Generating qualified leads, building relationships
    - Week 6: Already has customer momentum and relationships
  - By week 12: Competitor is 3x ahead (clear visual comparison)
  - Revenue comparison chart: Competitor line climbing, your line flat
- VOICEOVER (regretful): "Your competitor picks a simpler tool. They're running campaigns while you're still in setup. By the time you launch? They already own the relationship."
- TEXT ON SCREEN: "Week 1: Competitor generating leads. Week 6: You're finally ready. Week 12: Competitor is 3x ahead."
- EMOTION: Competitive disadvantage, regret, frustration

SCENE 3 (14-21s): THE FINANCIAL COST OF DELAY
- VISUAL: Revenue impact graph showing opportunity loss
  - Competitor's revenue line: Growing steadily from week 1
  - Your revenue line: Flat for 6 weeks, then climbing (but behind)
  - By week 12: Competitor's cumulative revenue = $180K
  - Your cumulative revenue = $45K (4x behind)
  - Counter highlighting: "Competitors already captured $180K in leads you would've had"
  - Red zone emphasizing the opportunity loss
  - Failure visualization (gap widening)
- VOICEOVER (direct, hitting hard): "You've lost $180,000 in leads just because setup took too long."
- TEXT ON SCREEN: "6-week delay = $180K in lost revenue"
- SOUND: Serious, financial impact tone
- EMOTION: Financial pain, urgency, pressure

SCENE 4 (22-30s): SYNTHEX INSTANT SETUP
- VISUAL: Synthex rapid onboarding flow (bright, energetic)
  - Founder signs up Monday morning
  - STEP 1: "Connect your email" (2 clicks)
    - Gmail authorization popup appears and is approved quickly
    - Checkmark appears: ✓ Done (timer: 30 seconds)
  - STEP 2: "Set your first automation" (template selection)
    - Pre-built campaign templates appear (no coding needed)
    - One-click template selection
    - Checkmark: ✓ Done (timer: 2 minutes)
  - STEP 3: "Launch your first campaign" (one-click send)
    - Campaign preview appears (professional, ready to send)
    - One button click: "Send"
    - Checkmark: ✓ Done (timer: 5 minutes)
  - Total timer corner: "18 minutes total setup"
  - By Tuesday morning: First leads arriving in inbox (notification shows)
  - By Wednesday: First deals starting to close (success notifications)
  - Manager celebrating the quick wins (happy expression, success gesture)
  - Revenue already climbing (early results visible)
- VOICEOVER (confident, relief): "Synthex is 18 minutes setup. No developers. No consultants. No complexity. You're generating leads by tomorrow."
- VISUAL: Deal notifications pinging in, revenue chart climbing upward, momentum building
- TEXT ON SCREEN: "Setup: 18 minutes. First leads: Tomorrow. First deals: This week."
- CTA TEXT: "Start generating leads in 18 minutes. No setup tax. Try free for 14 days."
- CLOSING: Synthex logo with celebratory momentum, "Setup fast. Grow faster."
- EMOTION: Relief, momentum, immediate wins, empowerment

WATERMARK: Synthex logo bottom-right, bounces slightly with energy, 120px, 45% opacity

PRODUCTION QUALITY: 4K professional, fast-paced, energetic, H.264, 30 seconds
    `,
  },
];

async function generateVideoWithGemini(videoPrompt) {
  console.log(`\n🎬 Generating video: ${videoPrompt.title}`);
  console.log(`   ID: ${videoPrompt.id}`);

  try {
    const model = client.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are a professional video production director. Create a complete video production specification for this 4K marketing video. Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:

{
  "videoId": "${videoPrompt.id}",
  "title": "${videoPrompt.title}",
  "duration": "30s",
  "resolution": "4K (3840x2160)",
  "frameRate": "30fps",
  "codec": "H.264",
  "productionNotes": "...",
  "scenes": [...],
  "watermark": {...},
  "exportSettings": {...}
}

Here is the creative brief:

${videoPrompt.prompt}

Return the complete production specification as valid JSON only.`,
            },
          ],
        },
      ],
    });

    const result = await response.response;
    const text = result.text();

    if (text) {
      const jsonText = text
        .replace(/^```json\n?/, "")
        .replace(/\n?```$/, "")
        .trim();
      const spec = JSON.parse(jsonText);

      // Save the spec to a file
      const specPath = path.join(
        PROJECT_ROOT,
        `public/video-specs/${videoPrompt.id}-spec.json`
      );
      fs.mkdirSync(path.dirname(specPath), { recursive: true });
      fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));

      console.log(`   ✓ Production spec generated and saved`);
      return spec;
    } else {
      throw new Error("No content in response");
    }
  } catch (error) {
    console.error(`   ❌ Error generating video spec: ${error.message}`);
    throw error;
  }
}

async function main() {
  console.log("🚀 Starting VEO Video Generation Pipeline\n");
  console.log("Generating 6 professional 4K videos with Synthex watermark...\n");

  const generatedSpecs = [];

  for (const prompt of VEO_PROMPTS) {
    try {
      const spec = await generateVideoWithGemini(prompt);
      generatedSpecs.push(spec);

      // Rate limiting to avoid API throttling
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Failed to generate spec for ${prompt.id}: ${error.message}`);
    }
  }

  // Save all specs
  const specsPath = path.join(
    PROJECT_ROOT,
    "public/video-specs/all-specs.json"
  );
  fs.mkdirSync(path.dirname(specsPath), { recursive: true });
  fs.writeFileSync(specsPath, JSON.stringify(generatedSpecs, null, 2));

  console.log("\n✅ Video generation pipeline complete!");
  console.log(`   Generated specs for ${generatedSpecs.length} videos`);
  console.log(`   Specs saved to: public/video-specs/`);
  console.log("\n📝 Next steps:");
  console.log("   1. Submit specs to VEO video generation service");
  console.log("   2. Generate actual MP4 files with 4K quality");
  console.log("   3. Upload to Vimeo and update video URLs");
  console.log("   4. Deploy React components to display videos");
}

main().catch(console.error);
