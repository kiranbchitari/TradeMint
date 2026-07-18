# TradeMint auth email templates

Branded replacements for Supabase's generic default auth emails.

## Why the default looks generic

A default Supabase signup email is generic in two independent ways:

1. **Sender address** — `noreply@mail.app.supabase.io` with a Supabase-branded
   footer. Changing this requires **custom SMTP** (see below).
2. **Content & design** — the plain default HTML. Fixed by the templates here.

## Apply the templates (content & design)

These can't be set via API/MCP — do it in the dashboard:

1. Supabase Dashboard → your project → **Authentication → Emails**
   (the "Email Templates" section).
2. Pick a template tab and paste the matching file's contents into the
   **Message body (HTML)** box, then update the **Subject**:

   | Template tab      | File                   | Suggested subject                |
   | ----------------- | ---------------------- | -------------------------------- |
   | Confirm signup    | `confirm-signup.html`  | Confirm your TradeMint account   |
   | Reset password    | `reset-password.html`  | Reset your TradeMint password    |
   | Magic Link        | `magic-link.html`      | Your TradeMint sign-in link      |

3. **Save** each one.

The templates use only the `{{ .ConfirmationURL }}` variable, so they work with
Supabase's default redirect flow. The logo pulls from
`https://trade-mint.vercel.app/apple-icon` (public), with the "TradeMint"
wordmark as text so it still reads if a client blocks images.

## Fix the sender address (custom SMTP) — manual

To send from your own address (e.g. `noreply@yourdomain.com`) and drop the
Supabase footer:

1. Authentication → Emails → **SMTP Settings** → enable **Custom SMTP**.
2. Enter host/port/username/password from an email provider
   (Resend, Postmark, SendGrid, Amazon SES, etc.) and set the sender name/email.
3. Verify your sending domain (SPF/DKIM) in that provider for deliverability.

> This step needs SMTP credentials, so you'll need to enter them yourself — I
> can't fill in secrets on your behalf. Until custom SMTP is set, emails still
> send from the Supabase address but will use the branded design above.

## Notes

- The default free-tier email sender is rate-limited and meant for testing;
  custom SMTP is recommended before real users sign up.
- If you enable OTP codes instead of links, swap the button for the
  `{{ .Token }}` variable.
