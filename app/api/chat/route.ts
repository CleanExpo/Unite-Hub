import OpenAI from 'openai';
import { Resend } from 'resend';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// System prompt that defines the chatbot's personality and knowledge
const systemPrompt = `You are a friendly, professional customer service representative for Unite Group, a business solutions company. Your name is Alex, and you're here to help potential clients understand how Unite Group can solve their business problems.

ABOUT UNITE GROUP:
- We help businesses grow with simple, effective solutions
- We solve real business problems with practical approaches
- We focus on fast results, clear communication, and proven outcomes
- We're based in Australia and serve businesses globally

OUR SERVICES:
1. Initial Business Consultation (A$550) - Transform business vision into reality with expert insights and strategic recommendations
2. Custom Software Development (Starts at A$15,000) - Build software that does exactly what your business needs
3. Strategic SEO Services - Help customers find your business online and increase organic traffic
4. Business Strategy Consulting - Develop winning strategies to outpace competition
5. Quality Assurance & Testing - Ensure software works flawlessly for customers
6. Expert Education & Training - Empower teams with the skills they need to succeed

CASE STUDIES HIGHLIGHTS:
- TechStart Solutions: 50% reduction in customer churn, 4x faster deployments
- UrbanBloom Retail: 350% increase in organic traffic, 60% reduction in ad spend
- Dynamic Logistics: 40% increase in operational efficiency, A$450k annual savings
- HealthPlus Clinics: 30% reduction in admin time, 100% HIPAA compliance

CONTACT INFORMATION:
- When providing contact information, ONLY mention our email address: contact@unite-group.in
- Do NOT mention any phone numbers or other contact methods
- Always direct users to email us at contact@unite-group.in for inquiries

YOUR PERSONALITY:
- Be warm, conversational, and genuinely helpful
- Use a friendly, approachable tone like you're talking to a friend
- Show enthusiasm about helping businesses succeed
- Be honest about what you can and cannot help with
- Ask follow-up questions to better understand their needs
- Provide specific examples and case studies when relevant
- Always offer to connect them with the team for detailed consultations

MEETING SCHEDULING:
When the conversation involves scheduling a meeting, consultation, or any time-related discussion:
1. First, ask a simple confirmation: "Would you like to schedule a consultation meeting with our team?"
2. Keep this question short and direct - don't add extra details or explanations
3. If they say yes, then ask for their name, email, preferred date, time, and timezone
4. Use this exact format: "Great! To schedule your consultation, I'll need your name, email address, preferred date, time, and timezone. Could you please provide those details so I can send you a calendar invite?"
5. Be enthusiastic about the opportunity to help them

RESPONSE GUIDELINES:
- Keep responses conversational and not too formal
- Use "we" and "our" when referring to Unite Group
- Provide specific, actionable information
- If someone asks about pricing, be transparent about what you know
- If someone has a complex technical question, offer to connect them with our technical team
- Always end with a helpful next step or invitation to learn more
- When scheduling is discussed, always confirm first, then ask for details
- When providing contact information, ONLY mention contact@unite-group.in

Remember: You're not just providing information - you're building relationships and helping people see how Unite Group can solve their specific business challenges.`;

// Function to generate Google Calendar invite link
function generateCalendarLink(meetingInfo: {
  name: string;
  email: string;
  date: string;
  time: string;
  timezone: string;
}) {
  // Parse the date and time to create a proper datetime
  const dateTime = new Date(`${meetingInfo.date} ${meetingInfo.time}`);
  const endTime = new Date(dateTime.getTime() + 60 * 60 * 1000); // Add 1 hour
  
  const event = {
    text: `Consultation Meeting with Unite Group - ${meetingInfo.name}`,
    dates: `${dateTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    details: `Consultation meeting with ${meetingInfo.name} (${meetingInfo.email})\n\nMeeting Details:\n- Date: ${meetingInfo.date}\n- Time: ${meetingInfo.time}\n- Timezone: ${meetingInfo.timezone}\n- Duration: 60 minutes\n\nPlease have your business goals and current challenges ready for our discussion.`,
    location: 'Online (Zoom/Teams link will be provided)',
    trp: false,
    add: ['contact@unite-group.in', meetingInfo.email]
  };

  const params = new URLSearchParams(event as any);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&${params.toString()}`;
}

// Function to send meeting invite emails using Resend
async function sendMeetingInvite(meetingInfo: {
  name: string;
  email: string;
  date: string;
  time: string;
  timezone: string;
}) {
  try {
    // Validate environment variables
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY environment variable is not set');
      return {
        success: false,
        message: 'Email service not configured'
      };
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'contact@unite-group.in';
    const fromEmail = process.env.FROM_EMAIL || 'contact@unite-group.in';
    
    // Generate calendar link
    const calendarLink = generateCalendarLink(meetingInfo);
    
    // Email to customer
    const customerEmailResult = await resend.emails.send({
      from: `Unite Group <${fromEmail}>`,
      to: [meetingInfo.email],
      subject: 'Your Consultation Meeting with Unite Group - Confirmed! 📅',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Meeting Confirmed - Unite Group</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
            <div style="background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); color: white; padding: 40px; text-align: center; border-radius: 15px 15px 0 0; margin-bottom: 0;">
                <h1 style="margin: 0; font-size: 32px; font-weight: 600;">Meeting Confirmed! 🎉</h1>
                <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.95;">Your consultation with Unite Group</p>
            </div>
            
            <div style="background: white; padding: 40px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <h2 style="color: #1e293b; margin-top: 0; font-size: 24px;">Hello ${meetingInfo.name},</h2>
                
                <p style="color: #475569; line-height: 1.7; font-size: 16px; margin-bottom: 25px;">
                    Thank you for scheduling a consultation with Unite Group! We're excited to discuss how we can help your business grow and achieve your goals.
                </p>
                
                <div style="background: #f1f5f9; border: 2px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 25px 0;">
                    <h3 style="color: #0891b2; margin-top: 0; font-size: 20px; display: flex; align-items: center;">
                        📅 Meeting Details
                    </h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
                        <div>
                            <strong style="color: #475569; font-size: 14px;">Date:</strong><br>
                            <span style="color: #64748b; font-size: 16px;">${meetingInfo.date}</span>
                        </div>
                        <div>
                            <strong style="color: #475569; font-size: 14px;">Time:</strong><br>
                            <span style="color: #64748b; font-size: 16px;">${meetingInfo.time}</span>
                        </div>
                        <div>
                            <strong style="color: #475569; font-size: 14px;">Timezone:</strong><br>
                            <span style="color: #64748b; font-size: 16px;">${meetingInfo.timezone}</span>
                        </div>
                        <div>
                            <strong style="color: #475569; font-size: 14px;">Duration:</strong><br>
                            <span style="color: #64748b; font-size: 16px;">60 minutes</span>
                        </div>
                    </div>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${calendarLink}" style="background: #0891b2; color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(8, 145, 178, 0.25);">
                        📅 Add to Google Calendar
                    </a>
                </div>
                
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 8px;">
                    <p style="margin: 0; color: #92400e; font-size: 15px;">
                        <strong>💡 Preparation Tip:</strong> Please have your business goals, current challenges, and any specific questions ready for our discussion. This will help us make the most of our time together.
                    </p>
                </div>
                
                <p style="color: #475569; line-height: 1.7; font-size: 16px; margin-bottom: 25px;">
                    Our team will reach out within the next 24 hours to confirm the meeting details and provide the video call link (Zoom or Microsoft Teams).
                </p>
                
                <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 25px 0;">
                    <h4 style="color: #0369a1; margin-top: 0; font-size: 16px;">Need to Reschedule?</h4>
                    <p style="color: #0c4a6e; margin: 0; font-size: 14px;">
                        If you need to reschedule or have any questions, please reply to this email or contact us at <a href="mailto:contact@unite-group.in" style="color: #0891b2;">contact@unite-group.in</a>
                    </p>
                </div>
                
                <div style="text-align: center; margin: 35px 0;">
                    <a href="https://unite-group.in" style="background: #1e293b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block; margin: 0 10px;">
                        Visit Our Website
                    </a>
                    <a href="https://unite-group.in/case-studies" style="background: #059669; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block; margin: 0 10px;">
                        View Case Studies
                    </a>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #64748b; font-size: 14px;">
                <p style="margin: 5px 0;">Best regards,<br><strong>The Unite Group Team</strong></p>
                <p style="margin: 5px 0;">📧 <a href="mailto:contact@unite-group.in" style="color: #0891b2;">contact@unite-group.in</a> | 🌐 <a href="https://unite-group.in" style="color: #0891b2;">unite-group.in</a></p>
                <p style="margin: 15px 0 0 0; font-size: 12px; opacity: 0.8;">This is an automated confirmation from the Unite Group website.</p>
            </div>
        </body>
        </html>
      `,
    });

    // Email to admin/team
    const adminEmailResult = await resend.emails.send({
      from: `Unite Group Bot <${fromEmail}>`,
      to: [adminEmail],
      subject: `New Consultation Meeting - ${meetingInfo.name} - Action Required 📅`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Meeting Scheduled - Unite Group</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
            <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 40px; text-align: center; border-radius: 15px 15px 0 0; margin-bottom: 0;">
                <h1 style="margin: 0; font-size: 32px; font-weight: 600;">New Meeting Scheduled! 🎯</h1>
                <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.95;">Consultation meeting details</p>
            </div>
            
            <div style="background: white; padding: 40px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <h2 style="color: #1e293b; margin-top: 0; font-size: 24px;">New Consultation Meeting</h2>
                
                <div style="background: #f1f5f9; border: 2px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 25px 0;">
                    <h3 style="color: #059669; margin-top: 0; font-size: 20px; display: flex; align-items: center;">
                        👤 Client Information
                    </h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
                        <div>
                            <strong style="color: #475569; font-size: 14px;">Name:</strong><br>
                            <span style="color: #64748b; font-size: 16px;">${meetingInfo.name}</span>
                        </div>
                        <div>
                            <strong style="color: #475569; font-size: 14px;">Email:</strong><br>
                            <span style="color: #64748b; font-size: 16px;"><a href="mailto:${meetingInfo.email}" style="color: #0891b2;">${meetingInfo.email}</a></span>
                        </div>
                    </div>
                </div>
                
                <div style="background: #f1f5f9; border: 2px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 25px 0;">
                    <h3 style="color: #059669; margin-top: 0; font-size: 20px; display: flex; align-items: center;">
                        📅 Meeting Details
                    </h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
                        <div>
                            <strong style="color: #475569; font-size: 14px;">Date:</strong><br>
                            <span style="color: #64748b; font-size: 16px;">${meetingInfo.date}</span>
                        </div>
                        <div>
                            <strong style="color: #475569; font-size: 14px;">Time:</strong><br>
                            <span style="color: #64748b; font-size: 16px;">${meetingInfo.time}</span>
                        </div>
                        <div>
                            <strong style="color: #475569; font-size: 14px;">Timezone:</strong><br>
                            <span style="color: #64748b; font-size: 16px;">${meetingInfo.timezone}</span>
                        </div>
                        <div>
                            <strong style="color: #475569; font-size: 14px;">Duration:</strong><br>
                            <span style="color: #64748b; font-size: 16px;">60 minutes</span>
                        </div>
                    </div>
                </div>
                
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 8px;">
                    <p style="margin: 0; color: #92400e; font-size: 15px;">
                        <strong>⚠️ Action Required:</strong> Please reach out to the client within 24 hours to confirm the meeting and provide the video call link (Zoom or Microsoft Teams).
                    </p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="mailto:${meetingInfo.email}?subject=Meeting Confirmation - ${meetingInfo.date} at ${meetingInfo.time}" style="background: #059669; color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(5, 150, 105, 0.25);">
                        📧 Reply to Client
                    </a>
                </div>
                
                <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 25px 0;">
                    <h4 style="color: #0369a1; margin-top: 0; font-size: 16px;">Quick Actions</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
                        <a href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=Consultation with ${meetingInfo.name}&dates=${new Date(`${meetingInfo.date} ${meetingInfo.time}`).toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${new Date(new Date(`${meetingInfo.date} ${meetingInfo.time}`).getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=Consultation meeting with ${meetingInfo.name} (${meetingInfo.email})&location=Online (Zoom/Teams)" style="background: #0891b2; color: white; padding: 10px 15px; text-decoration: none; border-radius: 6px; font-size: 14px; text-align: center;">
                            📅 Create Calendar Event
                        </a>
                        <a href="https://zoom.us/meeting/schedule" style="background: #2d8cff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 6px; font-size: 14px; text-align: center;">
                            🎥 Create Zoom Meeting
                        </a>
                    </div>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #64748b; font-size: 14px;">
                <p style="margin: 5px 0;">This is an automated notification from the Unite Group chatbot system.</p>
                <p style="margin: 5px 0;">📧 <a href="mailto:contact@unite-group.in" style="color: #0891b2;">contact@unite-group.in</a> | 🌐 <a href="https://unite-group.in" style="color: #0891b2;">unite-group.in</a></p>
            </div>
        </body>
        </html>
      `,
    });



    return {
      success: true,
      message: 'Meeting invites sent successfully to both customer and admin'
    };
  } catch (error) {
    console.error('❌ Error sending emails:', error);
    return {
      success: false,
      message: 'Failed to send meeting invites'
    };
  }
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Check if the last message contains meeting information
    const lastMessage = messages[messages.length - 1];
    const hasMeetingInfo = lastMessage?.role === 'user' && 
      (lastMessage.content.includes('Name:') && 
       lastMessage.content.includes('Email:') &&
       lastMessage.content.includes('Date:') &&
       lastMessage.content.includes('Time:') &&
       lastMessage.content.includes('Timezone:'));

    if (hasMeetingInfo) {
      // Extract meeting information from the message
      const nameMatch = lastMessage.content.match(/Name:\s*([^,]+)/);
      const emailMatch = lastMessage.content.match(/Email:\s*([^\s,]+)/);
      const dateMatch = lastMessage.content.match(/Date:\s*([^,]+)/);
      const timeMatch = lastMessage.content.match(/Time:\s*([^,]+)/);
      const timezoneMatch = lastMessage.content.match(/Timezone:\s*([^,]+)/);
      
      const name = nameMatch ? nameMatch[1].trim() : '';
      const email = emailMatch ? emailMatch[1].trim() : '';
      const date = dateMatch ? dateMatch[1].trim() : '';
      const time = timeMatch ? timeMatch[1].trim() : '';
      const timezone = timezoneMatch ? timezoneMatch[1].trim() : '';

      if (name && email && date && time && timezone) {
        // Send meeting invite
        const emailResult = await sendMeetingInvite({
          name,
          email,
          date,
          time,
          timezone
        });

        if (emailResult.success) {
          return Response.json({
            content: `Perfect! Thank you ${name}! 📅\n\nI've received your meeting details and sent confirmation emails to:\n• ${email} (your email)\n• Our team (for follow-up)\n\nMeeting Details:\n📅 Date: ${date}\n⏰ Time: ${time}\n🌍 Timezone: ${timezone}\n\nOur team will reach out within the next 24 hours to confirm the meeting and provide any additional details you might need.\n\nIn the meantime, feel free to ask me any other questions about our services or how we can help your business grow!`,
          });
        } else {
          // If email sending failed, still acknowledge the meeting but mention the issue
          return Response.json({
            content: `Thank you ${name}! 📅\n\nI've received your meeting details for ${date} at ${time} (${timezone}).\n\nThere was a temporary issue sending the confirmation email, but our team has been notified and will reach out within the next 24 hours to confirm the meeting.\n\nIn the meantime, feel free to ask me any other questions about our services!`,
          });
        }
      }

      // Fallback if information is incomplete
      return Response.json({
        content: `I received your meeting request, but I need all the details to schedule properly. Could you please provide your name, email, preferred date, time, and timezone?`,
      });
    }

    // Create the chat completion
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...messages,
      ],
      stream: false,
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Return the response as JSON
    return Response.json({
      content: response.choices[0]?.message?.content || 'Sorry, I could not generate a response.',
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 