import OpenAI from 'openai';
import { Resend } from 'resend';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);
console.log(process.env.RESEND_API_KEY);

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

Remember: You're not just providing information - you're building relationships and helping people see how Unite Group can solve their specific business challenges.`;

// Function to send meeting invite emails using Resend
async function sendMeetingInvite(meetingInfo: {
  name: string;
  email: string;
  date: string;
  time: string;
  timezone: string;
}) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@unitegroup.com.au';
    const fromEmail = process.env.FROM_EMAIL || 'unitegroup.in@gmail.com';
    
    // Email to customer
    const customerEmailResult = await resend.emails.send({
      from: fromEmail,
      to: [meetingInfo.email],
      subject: 'Your Consultation Meeting with Unite Group - Confirmed! 📅',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0891b2, #0e7490); color: white; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">Meeting Confirmed! 🎉</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your consultation with Unite Group</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 10px; margin-top: 20px;">
            <h2 style="color: #1e293b; margin-top: 0;">Hello ${meetingInfo.name},</h2>
            
            <p style="color: #475569; line-height: 1.6; font-size: 16px;">
              Thank you for scheduling a consultation with Unite Group! We're excited to discuss how we can help your business grow.
            </p>
            
            <div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #0891b2; margin-top: 0;">📅 Meeting Details</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                  <strong style="color: #475569;">Date:</strong><br>
                  <span style="color: #64748b;">${meetingInfo.date}</span>
                </div>
                <div>
                  <strong style="color: #475569;">Time:</strong><br>
                  <span style="color: #64748b;">${meetingInfo.time}</span>
                </div>
                <div>
                  <strong style="color: #475569;">Timezone:</strong><br>
                  <span style="color: #64748b;">${meetingInfo.timezone}</span>
                </div>
                <div>
                  <strong style="color: #475569;">Duration:</strong><br>
                  <span style="color: #64748b;">60 minutes</span>
                </div>
              </div>
            </div>
            
            <p style="color: #475569; line-height: 1.6; font-size: 16px;">
              Our team will reach out within the next 24 hours to confirm the meeting and provide any additional details you might need.
            </p>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>💡 Tip:</strong> Please have your business goals and current challenges ready for our discussion.
              </p>
            </div>
            
            <p style="color: #475569; line-height: 1.6; font-size: 16px;">
              If you need to reschedule or have any questions, please don't hesitate to contact us.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://unitegroup.com.au" style="background: #0891b2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Visit Our Website
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #64748b; font-size: 14px;">
            <p>Best regards,<br>The Unite Group Team</p>
            <p>📧 unitegroup.in@gmail.com | 🌐 https://unite-group.in</p>
          </div>
        </div>
      `,
    });

    // Email to admin/team
    const adminEmailResult = await resend.emails.send({
      from: fromEmail,
      to: [adminEmail],
      subject: 'New Consultation Meeting Scheduled - Action Required 📅',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #059669, #047857); color: white; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">New Meeting Scheduled! 🎯</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Consultation meeting details</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 10px; margin-top: 20px;">
            <h2 style="color: #1e293b; margin-top: 0;">New Consultation Meeting</h2>
            
            <div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #059669; margin-top: 0;">👤 Client Information</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                  <strong style="color: #475569;">Name:</strong><br>
                  <span style="color: #64748b;">${meetingInfo.name}</span>
                </div>
                <div>
                  <strong style="color: #475569;">Email:</strong><br>
                  <span style="color: #64748b;">${meetingInfo.email}</span>
                </div>
              </div>
            </div>
            
            <div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #059669; margin-top: 0;">📅 Meeting Details</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                  <strong style="color: #475569;">Date:</strong><br>
                  <span style="color: #64748b;">${meetingInfo.date}</span>
                </div>
                <div>
                  <strong style="color: #475569;">Time:</strong><br>
                  <span style="color: #64748b;">${meetingInfo.time}</span>
                </div>
                <div>
                  <strong style="color: #475569;">Timezone:</strong><br>
                  <span style="color: #64748b;">${meetingInfo.timezone}</span>
                </div>
                <div>
                  <strong style="color: #475569;">Duration:</strong><br>
                  <span style="color: #64748b;">60 minutes</span>
                </div>
              </div>
            </div>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>⚠️ Action Required:</strong> Please reach out to the client within 24 hours to confirm the meeting and provide additional details.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="mailto:${meetingInfo.email}" style="background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Reply to Client
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #64748b; font-size: 14px;">
            <p>This is an automated notification from the Unite Group chatbot system.</p>
          </div>
        </div>
      `,
    });

    console.log('📧 Customer email sent:', customerEmailResult);
    console.log('📧 Admin email sent:', adminEmailResult);

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