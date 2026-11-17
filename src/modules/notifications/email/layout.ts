/**
 * Flybeth Email Design System
 *
 * Engineered for maximum deliverability and visual appeal across all email clients
 * (Apple Mail, Gmail, Outlook, Yahoo, mobile & desktop).
 *
 * Rules followed:
 *  - Table-based layout with explicit widths for Outlook/Word rendering engine.
 *  - Inline styles with web-safe cross-platform typography.
 *  - No CSS variables (stripped by Gmail).
 *  - Brand colors: Flybeth Blue (#0D1DAD), Royal Blue (#1A2ED4), Accent Coral (#EB4405).
 *  - Clean light canvas (#F1F5F9) and pure white card (#FFFFFF).
 *  - Hidden inbox preheader preview.
 */

export const BRAND = {
  primary: '#0D1DAD',       // Signature Flybeth Blue
  primaryLight: '#1A2ED4',  // Electric Blue
  primarySoft: '#EFF6FF',   // Subtle Blue Tint
  accent: '#EB4405',        // Flybeth Coral Accent
  accentSoft: '#FFF7ED',
  ink: '#0F172A',           // Slate 900 (High contrast text)
  body: '#334155',          // Slate 700 (Body text)
  slate: '#475569',
  muted: '#64748B',         // Slate 500 (Captions & labels)
  line: '#E2E8F0',          // Slate 200 (Borders)
  card: '#F8FAFC',
  cardBg: '#F8FAFC',        // Slate 50 (Inner card backgrounds)
  canvas: '#F1F5F9',        // Slate 100 (Outer email backdrop)
  cream: '#F1F5F9',
  white: '#FFFFFF',
  
  // Status colors & Aliases
  navy: '#0D1DAD',
  navySoft: '#1A2ED4',
  green: '#059669',
  greenSoft: '#ECFDF5',
  gold: '#EB4405',
  goldSoft: '#EFF6FF',
  amber: '#D97706',
  amberSoft: '#FFFBEB',
  amberLine: '#FDE68A',
  red: '#DC2626',
  redSoft: '#FEF2F2',
  redLine: '#FECACA',
  success: '#059669',
  successSoft: '#ECFDF5',
  successLine: '#A7F3D0',
  warning: '#D97706',
  warningSoft: '#FFFBEB',
  warningLine: '#FDE68A',
  danger: '#DC2626',
  dangerSoft: '#FEF2F2',
  dangerLine: '#FECACA',
  info: '#0D1DAD',
  infoSoft: '#EFF6FF',
  infoLine: '#BFDBFE',
} as const;

export const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
export const MONO =
  "'SF Mono', Menlo, Consolas, Monaco, 'Courier New', monospace";

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const TONES: Record<Tone, { fg: string; bg: string; line: string }> = {
  success: { fg: BRAND.success, bg: BRAND.successSoft, line: BRAND.successLine },
  warning: { fg: BRAND.warning, bg: BRAND.warningSoft, line: BRAND.warningLine },
  danger: { fg: BRAND.danger, bg: BRAND.dangerSoft, line: BRAND.dangerLine },
  info: { fg: BRAND.primary, bg: BRAND.primarySoft, line: BRAND.infoLine },
  neutral: { fg: BRAND.body, bg: BRAND.cardBg, line: BRAND.line },
};

/** Escape user/database input */
export function esc(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Hidden inbox preview line */
function preheaderBlock(text: string): string {
  return `<div style="display:none;font-size:1px;color:${BRAND.canvas};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${esc(
    text,
  )}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>`;
}

/** Primary Action Button */
export function button(
  label: string,
  url: string,
  opts: { tone?: 'primary' | 'green' | 'danger' | 'accent'; full?: boolean } = {},
): string {
  const bg =
    opts.tone === 'green'
      ? BRAND.success
      : opts.tone === 'danger'
      ? BRAND.danger
      : opts.tone === 'accent'
      ? BRAND.accent
      : BRAND.primary;

  return `<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:16px auto 0;">
    <tr>
      <td align="center" bgcolor="${bg}" style="border-radius:12px;box-shadow:0 4px 14px rgba(13,29,173,0.25);">
        <a href="${esc(url)}" target="_blank" rel="noopener"
           style="display:inline-block;padding:16px 36px;font-family:${SANS};font-size:15px;font-weight:800;letter-spacing:.3px;color:${BRAND.white};text-decoration:none;border-radius:12px;${
             opts.full ? 'width:100%;box-sizing:border-box;' : ''
           }">${esc(label)}</a>
      </td>
    </tr>
  </table>`;
}

/** Modern key/value detail rows */
export function detailRows(
  rows: Array<[string, string]>,
  opts: { mono?: number[] } = {},
): string {
  const body = rows
    .map(([label, value], i) => {
      const mono = opts.mono?.includes(i);
      const border = i === 0 ? '' : `border-top:1px solid ${BRAND.line};`;
      return `<tr>
        <td style="padding:13px 0;${border}font-family:${SANS};font-size:13px;font-weight:500;color:${BRAND.muted};vertical-align:top;width:42%;">${esc(
        label,
      )}</td>
        <td align="right" style="padding:13px 0;${border}font-family:${
        mono ? MONO : SANS
      };font-size:14px;font-weight:700;color:${BRAND.ink};vertical-align:top;">${esc(
        value,
      )}</td>
      </tr>`;
    })
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${body}</table>`;
}

/** Bordered content card */
export function card(
  inner: string,
  opts: { tint?: 'cream' | 'white' | 'gray' | 'blue'; title?: string } = {},
): string {
  const bg =
    opts.tint === 'blue' || opts.tint === 'cream'
      ? BRAND.primarySoft
      : opts.tint === 'white'
      ? BRAND.white
      : BRAND.cardBg;
  const borderColor =
    opts.tint === 'blue' || opts.tint === 'cream' ? BRAND.infoLine : BRAND.line;

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="margin:0 0 20px;background-color:${bg};border:1px solid ${borderColor};border-radius:14px;">
    <tr>
      <td style="padding:22px 24px;">
        ${
          opts.title
            ? `<p style="margin:0 0 12px;font-family:${SANS};font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:${BRAND.primary};">${esc(
                opts.title,
              )}</p>`
            : ''
        }
        ${inner}
      </td>
    </tr>
  </table>`;
}

/** Status pill badge */
export function statusPill(text: string, tone: Tone = 'neutral'): string {
  const t = TONES[tone];
  return `<span style="display:inline-block;padding:5px 12px;border-radius:999px;background-color:${t.bg};border:1px solid ${t.line};font-family:${SANS};font-size:11px;font-weight:800;letter-spacing:0.8px;text-transform:uppercase;color:${t.fg};">${esc(
    text,
  )}</span>`;
}

/** Callout highlight box */
export function callout(opts: {
  title?: string;
  body: string;
  tone?: Tone;
  icon?: string;
}): string {
  const t = TONES[opts.tone ?? 'info'];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="margin:0 0 20px;background-color:${t.bg};border:1px solid ${t.line};border-left:4px solid ${t.fg};border-radius:12px;">
    <tr>
      <td style="padding:18px 20px;">
        ${
          opts.title
            ? `<p style="margin:0 0 6px;font-family:${SANS};font-size:14px;font-weight:800;color:${t.fg};">${
                opts.icon ? `${opts.icon} ` : ''
              }${esc(opts.title)}</p>`
            : ''
        }
        <div style="font-family:${SANS};font-size:14px;line-height:1.6;color:${BRAND.body};">${opts.body}</div>
      </td>
    </tr>
  </table>`;
}

/** High-contrast OTP / Pass-code Card */
export function codeBlock(
  value: string,
  opts: { label?: string; note?: string } = {},
): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
    <tr>
      <td align="center" style="padding:32px 24px;background-color:${BRAND.primarySoft};border:2px dashed ${BRAND.primary};border-radius:16px;">
        ${
          opts.label
            ? `<p style="margin:0 0 10px;font-family:${SANS};font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:${BRAND.primary};">${esc(
                opts.label,
              )}</p>`
            : ''
        }
        <p style="margin:0;font-family:${MONO};font-size:38px;font-weight:900;letter-spacing:12px;color:${BRAND.primary};">${esc(
    value,
  )}</p>
        <p style="margin:12px 0 0;font-family:${SANS};font-size:12px;font-weight:600;color:${BRAND.muted};">
          ${esc(opts.note || 'Expires in 10 minutes • Do not share this code')}
        </p>
      </td>
    </tr>
  </table>`;
}

/** Sleek horizontal divider */
export function divider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
    <tr><td style="border-top:1px solid ${BRAND.line};font-size:0;line-height:0;">&nbsp;</td></tr>
  </table>`;
}

/** Clean bullet list */
export function bulletList(items: string[]): string {
  if (!items.length) return '';
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
    ${items
      .map(
        (item) => `<tr>
      <td width="22" valign="top" style="padding:5px 0 5px 2px;font-family:${SANS};font-size:16px;font-weight:700;color:${BRAND.primary};">&bull;</td>
      <td valign="top" style="padding:5px 0;font-family:${SANS};font-size:14px;line-height:1.6;color:${BRAND.body};">${esc(
          item,
        )}</td>
    </tr>`,
      )
      .join('')}
  </table>`;
}

/** Standard paragraph */
export function paragraph(
  html: string,
  opts: { muted?: boolean } = {},
): string {
  return `<p style="margin:0 0 18px;font-family:${SANS};font-size:15px;line-height:1.7;color:${
    opts.muted ? BRAND.muted : BRAND.body
  };">${html}</p>`;
}

/** Side-by-side KPI metrics strip */
export function statStrip(
  items: Array<{ label: string; value: string; highlight?: boolean }>,
): string {
  const widthPct = Math.floor(100 / items.length);
  const cells = items
    .map(
      (item) => `<td class="fb-stack" width="${widthPct}%" valign="top" style="padding:0 6px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="background-color:${item.highlight ? BRAND.primarySoft : BRAND.cardBg};border:1px solid ${
        item.highlight ? BRAND.infoLine : BRAND.line
      };border-radius:12px;">
          <tr>
            <td style="padding:15px 16px;">
              <p style="margin:0 0 4px;font-family:${SANS};font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:${
                item.highlight ? BRAND.primary : BRAND.muted
              };">${esc(item.label)}</p>
              <p style="margin:0;font-family:${SANS};font-size:16px;font-weight:800;color:${
                item.highlight ? BRAND.primary : BRAND.ink
              };">${esc(item.value)}</p>
            </td>
          </tr>
        </table>
      </td>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;"><tr>${cells}</tr></table>`;
}

export interface EmailLayoutOptions {
  preheader: string;
  eyebrow?: string;
  heading: string;
  intro?: string;
  body?: string;
  cta?: { label: string; url: string; tone?: 'primary' | 'green' | 'danger' | 'accent' };
  ctaNote?: string;
  footerNote?: string;
}

const LOGO_URL =
  'https://res.cloudinary.com/marquis/image/upload/v1780815566/logo_dovk4t.png';

/**
 * Renders complete HTML email with the modern Flybeth design system.
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
      .fb-wrap { padding: 16px 8px !important; }
      .fb-pad { padding: 26px 20px !important; }
      .fb-h1 { font-size: 24px !important; line-height: 1.25 !important; }
      .fb-stack { display: block !important; width: 100% !important; padding: 0 0 8px 0 !important; }
    }
    a { text-decoration: none; }
    [data-ogsc] .fb-card, [data-ogsb] .fb-card { background:#ffffff !important; }
  </style>
</head>
<body style="margin:0;padding:0;width:100%;background-color:${BRAND.canvas};-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%;">
  ${preheaderBlock(opts.preheader)}

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.canvas};">
    <tr>
      <td align="center" class="fb-wrap" style="padding:40px 16px;">

        <!-- Main Card Container -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="fb-card"
               style="width:100%;max-width:600px;background-color:${BRAND.white};border-radius:20px;overflow:hidden;border:1px solid ${BRAND.line};box-shadow:0 12px 36px rgba(15,23,42,0.06);">

          <!-- Premium Brand Header -->
          <tr>
            <td bgcolor="${BRAND.primary}" style="padding:28px 32px;background:linear-gradient(135deg, ${BRAND.primaryLight} 0%, ${BRAND.primary} 100%);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" valign="middle">
                    <a href="${esc(site)}" target="_blank" rel="noopener" style="text-decoration:none;display:inline-block;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td valign="middle" style="padding-right:10px;">
                            <img src="${LOGO_URL}" alt="Flybeth" height="30" style="height:30px;width:auto;display:block;border:0;" />
                          </td>
                          <td valign="middle">
                            <span style="font-family:${SANS};font-size:22px;font-weight:900;letter-spacing:1px;color:${BRAND.white};text-transform:none;">fly<span style="color:#60A5FA;">beth</span></span>
                          </td>
                        </tr>
                      </table>
                    </a>
                  </td>
                  <td align="right" valign="middle">
                    <span style="display:inline-block;padding:5px 12px;background:rgba(255,255,255,0.14);border:1px solid rgba(255,255,255,0.25);border-radius:999px;font-family:${SANS};font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:${BRAND.white};">
                      Verified Travel
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Subtle Top Accent Ribbon -->
          <tr>
            <td style="height:3px;line-height:3px;font-size:0;background:linear-gradient(90deg, ${BRAND.accent} 0%, #F59E0B 50%, ${BRAND.primaryLight} 100%);">&nbsp;</td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td class="fb-pad" style="padding:40px 36px 12px;">
              ${
                opts.eyebrow
                  ? `<div style="margin:0 0 12px;">
                      <span style="display:inline-block;padding:4px 10px;background-color:${BRAND.primarySoft};border:1px solid ${BRAND.infoLine};border-radius:6px;font-family:${SANS};font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:${BRAND.primary};">
                        ${esc(opts.eyebrow)}
                      </span>
                    </div>`
                  : ''
              }

              <h1 class="fb-h1" style="margin:0 0 16px;font-family:${SANS};font-size:27px;line-height:1.25;font-weight:900;color:${BRAND.ink};letter-spacing:-.6px;">
                ${esc(opts.heading)}
              </h1>

              ${
                opts.intro
                  ? `<p style="margin:0 0 28px;font-family:${SANS};font-size:15px;line-height:1.7;color:${BRAND.body};font-weight:400;">${opts.intro}</p>`
                  : ''
              }

              ${opts.body ?? ''}

              ${
                opts.cta
                  ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:12px 0 8px;">
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

          <!-- Clean Modern Footer -->
          <tr>
            <td style="padding:28px 36px 36px;background-color:#FAFAFC;border-top:1px solid ${BRAND.line};">
              ${
                opts.footerNote
                  ? `<p style="margin:0 0 16px;font-family:${SANS};font-size:12px;line-height:1.65;color:${BRAND.muted};">${opts.footerNote}</p>`
                  : ''
              }
              
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;">
                <tr>
                  <td align="left" style="font-family:${SANS};font-size:12px;line-height:1.7;color:${BRAND.muted};">
                    Need help? Reach out at 
                    <a href="mailto:${esc(support)}" style="color:${BRAND.primary};font-weight:700;text-decoration:none;">${esc(support)}</a> 
                    or manage your trip on 
                    <a href="${esc(site)}" target="_blank" rel="noopener" style="color:${BRAND.primary};font-weight:700;text-decoration:none;">flybeth.com</a>.
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${BRAND.line};padding-top:18px;">
                <tr>
                  <td align="left" style="font-family:${SANS};font-size:11px;line-height:1.6;color:#94A3B8;">
                    Flybeth Global LLC &bull; 1880 S Dairy Ashford Rd, Suite 207, Houston, TX 77077<br />
                    &copy; ${year} Flybeth Global LLC. All rights reserved.
                  </td>
                  <td align="right" valign="middle">
                    <span style="font-family:${SANS};font-size:11px;font-weight:800;color:${BRAND.primary};letter-spacing:1px;text-transform:uppercase;">
                      IATA Accredited
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Micro disclaimer -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;margin-top:16px;">
          <tr>
            <td align="center" style="padding:0 8px;">
              <p style="margin:0;font-family:${SANS};font-size:11px;line-height:1.6;color:#94A3B8;">
                This automated message was dispatched regarding your Flybeth account or booking.
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
