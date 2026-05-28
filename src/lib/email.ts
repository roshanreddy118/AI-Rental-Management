import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@aibuzzer.buzz'

export async function sendOTPEmail(email: string, otp: string, name: string) {
  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: 'Your LandlordOS Login OTP',
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #1e293b; margin-bottom: 8px;">Hi ${name},</h2>
        <p style="color: #475569; font-size: 16px;">Your one-time password for LandlordOS:</p>
        <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: 700; color: white; letter-spacing: 8px;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 14px;">This code expires in 10 minutes. Don't share it with anyone.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">LandlordOS — Smart Property Management</p>
      </div>
    `,
  })
}

export async function sendTenantInviteEmail(
  email: string,
  ownerName: string,
  propertyName: string,
  inviteCode: string
) {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/tenant-invite?code=${inviteCode}`
  
  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: `${ownerName} invited you to LandlordOS`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #1e293b; margin-bottom: 8px;">You've been invited!</h2>
        <p style="color: #475569; font-size: 16px;">
          <strong>${ownerName}</strong> has added you as a tenant at <strong>${propertyName}</strong>.
        </p>
        <p style="color: #475569; font-size: 16px;">Join LandlordOS to manage your rent, maintenance requests, and more.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${inviteUrl}" style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Accept Invitation
          </a>
        </div>
        <p style="color: #64748b; font-size: 14px;">Or use invite code: <strong>${inviteCode}</strong></p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">This invitation expires in 7 days.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">LandlordOS — Smart Property Management</p>
      </div>
    `,
  })
}

export async function sendRentReminderEmail(
  email: string,
  tenantName: string,
  amount: number,
  dueDate: string,
  propertyName: string
) {
  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: `Rent Reminder — ₹${amount.toLocaleString('en-IN')} due on ${dueDate}`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #1e293b; margin-bottom: 8px;">Hi ${tenantName},</h2>
        <p style="color: #475569; font-size: 16px;">This is a friendly reminder that your rent is due soon.</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0; color: #64748b; font-size: 14px;">Property</p>
          <p style="margin: 4px 0 16px; color: #1e293b; font-weight: 600;">${propertyName}</p>
          <p style="margin: 0; color: #64748b; font-size: 14px;">Amount Due</p>
          <p style="margin: 4px 0 16px; color: #1e293b; font-weight: 600; font-size: 24px;">₹${amount.toLocaleString('en-IN')}</p>
          <p style="margin: 0; color: #64748b; font-size: 14px;">Due Date</p>
          <p style="margin: 4px 0 0; color: #1e293b; font-weight: 600;">${dueDate}</p>
        </div>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">LandlordOS — Smart Property Management</p>
      </div>
    `,
  })
}
