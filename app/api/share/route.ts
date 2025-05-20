import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { to, url, title, message } = await request.json()

    if (!to || !url || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data, error } = await resend.emails.send({
      from: "CARSI <share@carsi.com.au>",
      to: [to],
      subject: `Shared Article: ${title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="https://carsi.com.au/logo.png" alt="CARSI Logo" style="max-width: 150px; margin-bottom: 20px;" />
          <h1 style="color: #001428; font-size: 24px; margin-bottom: 16px;">Article Shared With You</h1>
          <p style="color: #444; font-size: 16px; margin-bottom: 24px;">
            Someone thought you might be interested in this article from CARSI.
          </p>
          ${message ? `<p style="color: #444; font-style: italic; padding: 16px; background-color: #f5f5f5; border-left: 4px solid #4ecdc4; margin-bottom: 24px;">${message}</p>` : ""}
          <h2 style="color: #001428; font-size: 20px; margin-bottom: 16px;">${title}</h2>
          <a href="${url}" style="display: inline-block; background-color: #4ecdc4; color: #001428; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 16px;">Read Article</a>
          <p style="color: #666; font-size: 14px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
            This email was sent via CARSI's article sharing feature. If you have any questions, please contact us at support@carsi.com.au.
          </p>
        </div>
      `,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
