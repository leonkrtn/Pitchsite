import { Resend } from 'resend'

interface SendConfirmationOptions {
  to: string
  name: string
  token: string
  locale: string
  baseUrl: string
}

export async function sendConfirmationEmail({
  to,
  name,
  token,
  locale,
  baseUrl,
}: SendConfirmationOptions) {
  // Lazy init — avoids build-time crash when RESEND_API_KEY is not set
  const resend = new Resend(process.env.RESEND_API_KEY)
  const confirmUrl = `${baseUrl}/api/confirm?token=${token}`
  const isDe = locale === 'de'

  const subject = isDe
    ? 'Bestätige deine Anmeldung — Pitchsite'
    : 'Confirm your signup — Pitchsite'

  const html = isDe
    ? `<div style="font-family:-apple-system,system-ui,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;color:#0F172A">
        <p style="font-size:20px;font-weight:700;margin:0 0 8px">Hey ${name},</p>
        <p style="font-size:16px;color:#64748B;margin:0 0 32px;line-height:1.6">
          klick den Link unten um deine E-Mail-Adresse zu bestätigen.<br>
          Du bekommst dann genau eine E-Mail — wenn Pitchsite live geht.
        </p>
        <a href="${confirmUrl}" style="display:inline-block;background:#1D4ED8;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:600">E-Mail bestätigen</a>
        <p style="font-size:13px;color:#94A3B8;margin-top:32px;line-height:1.5">
          Falls du diesen Link nicht angefordert hast, kannst du diese E-Mail ignorieren.<br>
          Der Link ist 48 Stunden gültig.
        </p>
      </div>`
    : `<div style="font-family:-apple-system,system-ui,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;color:#0F172A">
        <p style="font-size:20px;font-weight:700;margin:0 0 8px">Hey ${name},</p>
        <p style="font-size:16px;color:#64748B;margin:0 0 32px;line-height:1.6">
          Click the link below to confirm your email address.<br>
          You'll receive exactly one email — when Pitchsite goes live.
        </p>
        <a href="${confirmUrl}" style="display:inline-block;background:#1D4ED8;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:600">Confirm email</a>
        <p style="font-size:13px;color:#94A3B8;margin-top:32px;line-height:1.5">
          If you didn't request this, you can safely ignore this email.<br>
          The link is valid for 48 hours.
        </p>
      </div>`

  return resend.emails.send({
    from: 'Pitchsite <noreply@pitchsite.de>',
    to,
    subject,
    html,
  })
}
