/**
 * Email design system.
 *
 * Rules this file follows so the output survives real inboxes:
 *  - no CSS custom properties (`var(--x)` is stripped by Gmail and Outlook),
 *  - no external stylesheets, no flex/grid, no <style> dependency for layout,
 *  - layout is table-based with explicit widths (Outlook uses the Word engine),
 *  - every style is inline,
 *  - web-safe font stacks only,
 *  - a hidden preheader so the inbox preview line is meaningful.
 */

export const BRAND = {
  navy: '#0A1B3D',
  navySoft: '#152B57',
  green: '#0F7B52',
  greenSoft: '#E7F4EE',
  gold: '#C9A24B',
  goldSoft: '#FBF5E7',
  cream: '#F7F4EC',
  ink: '#111827',
  slate: '#4B5563',
  muted: '#6B7280',
  line: '#E5E7EB',
  card: '#F9FAFB',
  white: '#FFFFFF',
  amber: '#B45309',
  amberSoft: '#FFFBEB',
  amberLine: '#FDE68A',
  red: '#B91C1C',
  redSoft: '#FEF2F2',
  redLine: '#FECACA',
} as const;

const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', Times, serif";
const MONO = "'SF Mono', Consolas, Monaco, 'Courier New', monospace";

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const TONES: Record<Tone, { fg: string; bg: string; line: string }> = {
  success: { fg: BRAND.green, bg: BRAND.greenSoft, line: '#BFE3D2' },
  warning: { fg: BRAND.amber, bg: BRAND.amberSoft, line: BRAND.amberLine },
  danger: { fg: BRAND.red, bg: BRAND.redSoft, line: BRAND.redLine },
  info: { fg: BRAND.navySoft, bg: '#EEF2FA', line: '#D6DEEC' },
  neutral: { fg: BRAND.slate, bg: BRAND.card, line: BRAND.line },
};

/** Escape any value that originates from a user or the database. */
export function esc(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Hidden preview text shown next to the subject in most inboxes. */
function preheaderBlock(text: string): string {
  return `<div style="display:none;font-size:1px;color:${BRAND.white};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${esc(text)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>`;
}

/** Primary call-to-action button (VML-free, degrades to a link in Outlook). */
export function button(
  label: string,
  url: string,
  opts: { tone?: 'primary' | 'green' | 'danger'; full?: boolean } = {},
): string {
  const bg =
    opts.tone === 'green' ? BRAND.green : opts.tone === 'danger' ? BRAND.red : BRAND.navy;
  return `<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 0;">
    <tr>
      <td align="center" bgcolor="${bg}" style="border-radius:10px;">
        <a href="${esc(url)}" target="_blank" rel="noopener"
           style="display:inline-block;padding:16px 32px;font-family:${SANS};font-size:15px;font-weight:700;letter-spacing:.2px;color:${BRAND.white};text-decoration:none;border-radius:10px;${
             opts.full ? 'width:100%;box-sizing:border-box;' : ''
           }">${esc(label)}</a>
      </td>
    </tr>
  </table>`;
}

/** Label / value rows inside a card. */
export function detailRows(rows: Array<[string, string]>, opts: { mono?: number[] } = {}): string {
  const body = rows
    .map(([label, value], i) => {
      const mono = opts.mono?.includes(i);
      const border = i === 0 ? '' : `border-top:1px solid ${BRAND.line};`;
      return `<tr>
        <td style="padding:12px 0;${border}font-family:${SANS};font-size:13px;color:${BRAND.muted};vertical-align:top;width:44%;">${esc(label)}</td>
        <td align="right" style="padding:12px 0;${border}font-family:${mono ? MONO : SANS};font-size:14px;font-weight:700;color:${BRAND.ink};vertical-align:top;">${esc(value)}</td>
      </tr>`;
    })
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${body}</table>`;
}

/** Bordered card that groups related details. */
export function card(inner: string, opts: { tint?: 'cream' | 'white'; title?: string } = {}): string {
  const tint = opts.tint === 'cream' ? BRAND.goldSoft : BRAND.card;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="margin:0 0 20px;background-color:${tint};border:1px solid ${BRAND.line};border-radius:12px;">
    <tr>
      <td style="padding:20px 22px;">
        ${
          opts.title
            ? `<p style="margin:0 0 10px;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:${BRAND.muted};">${esc(
                opts.title,
              )}</p>`
            : ''
        }
        ${inner}
      </td>
    </tr>
  </table>`;
}

/** Small status chip. */
export function statusPill(text: string, tone: Tone = 'neutral'): string {
  const t = TONES[tone];
  return `<span style="display:inline-block;padding:6px 12px;border-radius:999px;background-color:${t.bg};border:1px solid ${t.line};font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${t.fg};">${esc(
    text,
  )}</span>`;
}

/** Emphasised message block (used for actions, warnings and confirmations). */
export function callout(opts: { title?: string; body: string; tone?: Tone; icon?: string }): string {
  const t = TONES[opts.tone ?? 'info'];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="margin:0 0 20px;background-color:${t.bg};border:1px solid ${t.line};border-left:4px solid ${t.fg};border-radius:10px;">
    <tr>
      <td style="padding:18px 20px;">
        ${
          opts.title
            ? `<p style="margin:0 0 6px;font-family:${SANS};font-size:14px;font-weight:700;color:${t.fg};">${
                opts.icon ? `${opts.icon} ` : ''
              }${esc(opts.title)}</p>`
            : ''
        }
        <div style="font-family:${SANS};font-size:14px;line-height:1.65;color:${BRAND.ink};">${opts.body}</div>
      </td>
    </tr>
  </table>`;
}

/** A big, centred pass-code (OTP, booking reference). */
export function codeBlock(value: string, opts: { label?: string } = {}): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
    <tr>
      <td align="center" style="padding:28px 20px;background-color:${BRAND.navy};border-radius:12px;">
        ${
          opts.label
            ? `<p style="margin:0 0 10px;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:rgba(255,255,255,.6);">${esc(
                opts.label,
              )}</p>`
            : ''
        }
        <p style="margin:0;font-family:${MONO};font-size:34px;font-weight:700;letter-spacing:10px;color:${BRAND.white};">${esc(
          value,
        )}</p>
      </td>
    </tr>
  </table>`;
}

/** Horizontal rule with breathing room. */
export function divider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
    <tr><td style="border-top:1px solid ${BRAND.line};font-size:0;line-height:0;">&nbsp;</td></tr>
  </table>`;
}

/** Simple bulleted list with brand bullets. */
export function bulletList(items: string[]): string {
  if (!items.length) return '';
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
    ${items
      .map(
        (item) => `<tr>
      <td width="18" valign="top" style="padding:4px 0 4px 2px;font-family:${SANS};font-size:14px;color:${BRAND.green};">&#8226;</td>
      <td valign="top" style="padding:4px 0;font-family:${SANS};font-size:14px;line-height:1.6;color:${BRAND.slate};">${esc(
        item,
      )}</td>
    </tr>`,
      )
      .join('')}
  </table>`;
}

export interface EmailLayoutOptions {
  /** Inbox preview line. */
  preheader: string;
  /** Small capsule above the heading, e.g. "Booking confirmed". */
  eyebrow?: string;
  heading: string;
  /** Lead paragraph under the heading. */
  intro?: string;
  /** Pre-rendered body blocks. */
  body?: string;
  /** Primary button. */
  cta?: { label: string; url: string; tone?: 'primary' | 'green' | 'danger' };
  /** Quiet line under the CTA. */
  ctaNote?: string;
  /** Extra footer note (cancel/reference info). */
  footerNote?: string;
}

const LOGO_URL =
  'https://res.cloudinary.com/marquis/image/upload/v1780815566/logo_dovk4t.png';

/**
 * Renders a complete, client-safe HTML email.
 */
export function renderEmail(opts: EmailLayoutOptions): string {
  const year = new Date().getFullYear();
  const site = process.env.CLIENT_URL || 'https://flybeth.com';
  const support = process.env.SUPPORT_EMAIL || 'support@flybeth.com';

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${esc(opts.heading)}</title>
  <!--[if mso]><style>body,table,td{font-family:Arial,Helvetica,sans-serif!important}</style><![endif]-->
  <style>
    @media (max-width:600px) {
      .fb-wrap { padding: 20px 12px !important; }
      .fb-pad { padding: 26px 22px !important; }
      .fb-h1 { font-size: 24px !important; line-height: 1.25 !important; }
      .fb-stack { display: block !important; width: 100% !important; text-align: left !important; }
    }
    a { text-decoration: none; }
    /* Preserve the design if a client forces dark mode */
    [data-ogsc] .fb-card, [data-ogsb] .fb-card { background:#ffffff !important; }
  </style>
</head>
<body style="margin:0;padding:0;width:100%;background-color:${BRAND.cream};-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%;">
  ${preheaderBlock(opts.preheader)}

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.cream};">
    <tr>
      <td align="center" class="fb-wrap" style="padding:36px 16px;">

        <!-- Card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="fb-card"
               style="width:100%;max-width:600px;background-color:${BRAND.white};border-radius:16px;overflow:hidden;border:1px solid ${BRAND.line};">

          <!-- Header -->
          <tr>
            <td bgcolor="${BRAND.navy}" style="padding:26px 32px;background-color:${BRAND.navy};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" valign="middle">
                    <a href="${esc(site)}" target="_blank" rel="noopener" style="text-decoration:none;">
                      <span style="font-family:${SANS};font-size:21px;font-weight:800;letter-spacing:2.5px;color:${BRAND.white};text-transform:uppercase;">Flybeth</span><span style="font-family:${SANS};font-size:21px;font-weight:300;letter-spacing:2.5px;color:${BRAND.gold};">&#8226;</span>
                    </a>
                  </td>
                  <td align="right" valign="middle">
                    <span style="font-family:${SANS};font-size:10px;font-weight:700;letter-spacing:2.2px;text-transform:uppercase;color:rgba(255,255,255,.55);">Flybeth Global</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Gold rule -->
          <tr>
            <td style="height:3px;line-height:3px;font-size:0;background-color:${BRAND.gold};">&nbsp;</td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="fb-pad" style="padding:38px 32px 8px;">
              ${
                opts.eyebrow
                  ? `<p style="margin:0 0 12px;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${BRAND.green};">${esc(
                      opts.eyebrow,
                    )}</p>`
                  : ''
              }
              <h1 class="fb-h1" style="margin:0 0 16px;font-family:${SERIF};font-size:29px;line-height:1.25;font-weight:700;color:${BRAND.navy};letter-spacing:-.2px;">${esc(
                opts.heading,
              )}</h1>
              ${
                opts.intro
                  ? `<p style="margin:0 0 26px;font-family:${SANS};font-size:15.5px;line-height:1.7;color:${BRAND.slate};">${opts.intro}</p>`
                  : ''
              }

              ${opts.body ?? ''}

              ${
                opts.cta
                  ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 4px;">
                      <tr><td align="center">${button(opts.cta.label, opts.cta.url, { tone: opts.cta.tone })}</td></tr>
                    </table>
                    ${
                      opts.ctaNote
                        ? `<p style="margin:14px 0 0;text-align:center;font-family:${SANS};font-size:12px;line-height:1.6;color:${BRAND.muted};">${esc(
                            opts.ctaNote,
                          )}</p>`
                        : ''
                    }`
                  : ''
              }
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:30px 32px 34px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="border-top:1px solid ${BRAND.line};font-size:0;line-height:0;padding-top:22px;">&nbsp;</td></tr>
              </table>
              ${
                opts.footerNote
                  ? `<p style="margin:0 0 14px;font-family:${SANS};font-size:12px;line-height:1.65;color:${BRAND.muted};">${opts.footerNote}</p>`
                  : ''
              }
              <p style="margin:0 0 6px;font-family:${SANS};font-size:12px;line-height:1.7;color:${BRAND.muted};">
                Need a hand? Email
                <a href="mailto:${esc(support)}" style="color:${BRAND.navy};font-weight:600;">${esc(support)}</a>
                or visit <a href="${esc(site)}" target="_blank" rel="noopener" style="color:${BRAND.navy};font-weight:600;">flybeth.com</a>.
              </p>
              <p style="margin:0;font-family:${SANS};font-size:11px;line-height:1.7;color:${BRAND.muted};text-transform:uppercase;letter-spacing:.6px;">
                Flybeth Global LLC &bull; 1880 S Dairy Ashford Rd, Suite 207, Houston, TX 77077
              </p>
              <p style="margin:8px 0 0;font-family:${SANS};font-size:11px;color:${BRAND.muted};">
                &copy; ${year} Flybeth Global LLC. All rights reserved.
              </p>
            </td>
          </tr>
        </table>

        <!-- Below-card note -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;margin-top:14px;">
          <tr>
            <td align="center" style="padding:0 8px;">
              <p style="margin:0;font-family:${SANS};font-size:11px;line-height:1.6;color:#9CA3AF;">
                This message was sent to you because of activity on your Flybeth account. It is an automated email — replies are not monitored.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Standard paragraph. */
export function paragraph(html: string, opts: { muted?: boolean } = {}): string {
  return `<p style="margin:0 0 18px;font-family:${SANS};font-size:15px;line-height:1.7;color:${
    opts.muted ? BRAND.muted : BRAND.slate
  };">${html}</p>`;
}

/** Two-column summary strip (label above value, sits side by side on desktop). */
export function statStrip(items: Array<{ label: string; value: string }>): string {
  const cells = items
    .map(
      (item) => `<td class="fb-stack" width="${Math.floor(100 / items.length)}%" valign="top" style="padding:0 6px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.card};border:1px solid ${BRAND.line};border-radius:12px;">
          <tr>
            <td style="padding:14px 16px;">
              <p style="margin:0 0 4px;font-family:${SANS};font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${BRAND.muted};">${esc(
                item.label,
              )}</p>
              <p style="margin:0;font-family:${SANS};font-size:15px;font-weight:700;color:${BRAND.ink};">${esc(
                item.value,
              )}</p>
            </td>
          </tr>
        </table>
      </td>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;"><tr>${cells}</tr></table>`;
}
