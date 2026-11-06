/**
 * Every transactional email Flybeth sends.
 *
 * Each renderer returns complete HTML (header, body, footer) built from the
 * primitives in ./layout. The service passes the result straight to Resend.
 */
import {
  BRAND,
  bulletList,
  button,
  callout,
  card,
  codeBlock,
  detailRows,
  divider,
  esc,
  paragraph,
  renderEmail,
  statStrip,
  statusPill,
} from './layout'

const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"

function money(amount: unknown, currency = 'USD'): string {
  const n = Number(amount) || 0
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n)
  } catch {
    return `${currency} ${n.toFixed(2)}`
  }
}

function fmtDate(value: unknown, opts?: Intl.DateTimeFormatOptions): string {
  if (!value) return '—'
  const d = new Date(value as string)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', opts ?? { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtTime(value: unknown): string {
  if (!value) return '—'
  const d = new Date(value as string)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

/* ────────────────────────────────────────────────────────────────────────────
 * Booking confirmation / e-ticket
 * ──────────────────────────────────────────────────────────────────────────── */

interface SliceView {
  label: string
  originCode: string
  originCity: string
  destCode: string
  destCity: string
  depDate: string
  depTime: string
  arrTime: string
  airline: string
  flightNumber: string
  cabin: string
  stops: string
}

function extractSlices(booking: any): SliceView[] {
  const firstFlight = booking?.flights?.[0]
  const meta = firstFlight?.metadata ?? {}
  const isReturn =
    booking?.isRoundTrip ||
    (meta.slices?.length ?? 0) > 1 ||
    (meta.itineraries?.length ?? 0) > 1 ||
    (booking?.flights?.length ?? 0) > 1

  const rawSlices = meta.slices ?? meta.itineraries ?? []
  const slices: SliceView[] = []

  rawSlices.forEach((slice: any, index: number) => {
    const segments = slice?.segments ?? []
    const first = segments[0]
    const last = segments[segments.length - 1]
    const stopsCount = Math.max(0, segments.length - 1)

    slices.push({
      label: isReturn ? (index === 0 ? 'Outbound' : 'Return') : `Flight ${index + 1}`,
      originCode: first?.origin?.iata_code ?? meta.origin ?? '—',
      originCity: first?.origin?.city_name ?? first?.origin?.iata_city_code ?? meta.origin ?? '',
      destCode: last?.destination?.iata_code ?? meta.destination ?? '—',
      destCity: last?.destination?.city_name ?? last?.destination?.iata_city_code ?? meta.destination ?? '',
      depDate: fmtDate(first?.departing_at ?? meta.departureTime, { weekday: 'short', day: 'numeric', month: 'short' }),
      depTime: fmtTime(first?.departing_at ?? meta.departureTime),
      arrTime: fmtTime(last?.arriving_at ?? meta.arrivalTime),
      airline: first?.marketing_carrier?.name ?? meta.airline ?? 'Airline',
      flightNumber: first?.marketing_carrier_flight_number ?? meta.flightNumber ?? '',
      cabin: firstFlight?.class ?? 'Economy',
      stops: stopsCount === 0 ? 'Nonstop' : `${stopsCount} stop${stopsCount > 1 ? 's' : ''}`,
    })
  })

  // Fallback: a booking with no Duffel metadata should still show the route.
  if (slices.length === 0 && (meta.origin || meta.destination)) {
    slices.push({
      label: 'Flight',
      originCode: meta.origin ?? '—',
      originCity: '',
      destCode: meta.destination ?? '—',
      destCity: '',
      depDate: fmtDate(meta.departureTime, { weekday: 'short', day: 'numeric', month: 'short' }),
      depTime: fmtTime(meta.departureTime),
      arrTime: fmtTime(meta.arrivalTime),
      airline: meta.airline ?? 'Airline',
      flightNumber: meta.flightNumber ?? '',
      cabin: firstFlight?.class ?? 'Economy',
      stops: '—',
    })
  }

  return slices
}

function sliceCard(slice: SliceView): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 14px;border:1px solid ${BRAND.line};border-radius:14px;overflow:hidden;">
    <tr>
      <td style="padding:14px 18px;background-color:${BRAND.card};border-bottom:1px solid ${BRAND.line};">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="left" style="font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:${BRAND.navySoft};">${esc(
              slice.label,
            )}</td>
            <td align="right" style="font-family:${SANS};font-size:11px;font-weight:600;color:${BRAND.muted};">${esc(
              slice.depDate,
            )}</td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td class="fb-stack" width="38%" valign="top">
              <p style="margin:0;font-family:${SANS};font-size:24px;font-weight:800;color:${BRAND.navy};letter-spacing:-.5px;">${esc(
                slice.originCode,
              )}</p>
              <p style="margin:2px 0 0;font-family:${SANS};font-size:12px;color:${BRAND.muted};">${esc(
                slice.originCity,
              )}</p>
              <p style="margin:8px 0 0;font-family:${SANS};font-size:14px;font-weight:700;color:${BRAND.ink};">${esc(
                slice.depTime,
              )}</p>
            </td>
            <td class="fb-stack" width="24%" align="center" valign="middle" style="font-family:${SANS};font-size:11px;color:${BRAND.muted};">
              <div style="border-top:1px solid ${BRAND.line};margin:0 4px 6px;position:relative;"></div>
              <span style="display:inline-block;font-size:13px;">&#9992;</span>
              <p style="margin:4px 0 0;font-size:11px;">${esc(slice.stops)}</p>
            </td>
            <td class="fb-stack" width="38%" align="right" valign="top">
              <p style="margin:0;font-family:${SANS};font-size:24px;font-weight:800;color:${BRAND.navy};letter-spacing:-.5px;">${esc(
                slice.destCode,
              )}</p>
              <p style="margin:2px 0 0;font-family:${SANS};font-size:12px;color:${BRAND.muted};">${esc(
                slice.destCity,
              )}</p>
              <p style="margin:8px 0 0;font-family:${SANS};font-size:14px;font-weight:700;color:${BRAND.ink};">${esc(
                slice.arrTime,
              )}</p>
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;border-top:1px solid ${BRAND.line};">
          <tr>
            <td style="padding-top:12px;font-family:${SANS};font-size:12px;color:${BRAND.muted};">
              ${esc(slice.airline)}${slice.flightNumber ? ` &middot; ${esc(slice.flightNumber)}` : ''} &middot; ${esc(
                slice.cabin,
              )}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`
}

export function renderBookingConfirmation(
  booking: any,
  opts: { bankAccount?: any; clientUrl?: string } = {},
): string {
  const pnr = booking?.pnr ?? '—'
  const firstName =
    booking?.user?.firstName ||
    booking?.contactDetails?.name?.split(' ')[0] ||
    'Traveller'
  const lastName =
    booking?.user?.lastName ||
    booking?.contactDetails?.name?.split(' ').slice(1).join(' ') ||
    ''
  const fullName = `${firstName} ${lastName}`.trim()

  const currency = booking?.pricing?.currency || 'USD'
  const totalAmount = Number(booking?.pricing?.totalAmount) || 0
  const baseAmount = Number(booking?.pricing?.baseAmount ?? totalAmount) || 0
  const taxAmount = Number(booking?.pricing?.taxAmount) || 0
  const bookingDate = booking?.createdAt
    ? fmtDate(booking.createdAt)
    : fmtDate(new Date())

  const slices = extractSlices(booking)
  const isReturn = slices.length > 1 || booking?.isRoundTrip
  const passengers: any[] = booking?.passengers ?? []

  const needsTransfer =
    booking?.paymentMethod === 'manual' ||
    booking?.paymentMethod === 'transfer' ||
    booking?.paymentStatus === 'pending'

  const manageUrl = `${opts.clientUrl ?? process.env.CLIENT_URL ?? 'https://flybeth.com'}/bookings/${pnr}`

  const body: string[] = []

  // Status strip
  body.push(
    statStrip([
      { label: 'Booking ref', value: pnr },
      { label: 'Trip type', value: isReturn ? 'Return' : 'One way' },
      { label: 'Booked', value: bookingDate },
    ]),
  )

  // Payment action (manual transfer) — shown first because it is time sensitive
  if (needsTransfer && opts.bankAccount) {
    const bank = opts.bankAccount
    body.push(
      callout({
        tone: 'warning',
        icon: '&#9888;',
        title: 'Action needed — complete your payment',
        body: `Your seats are held, but the booking is not ticketed until payment is received. Please transfer <strong>${esc(
          money(totalAmount, currency),
        )}</strong> using the details below.`,
      }),
    )
    body.push(
      card(
        detailRows(
          [
            ['Bank', bank.bankName ?? '—'],
            ['Account name', bank.accountName ?? '—'],
            ['Account number', bank.accountNumber ?? '—'],
            ['Amount', money(totalAmount, currency)],
          ],
          { mono: [2] },
        ),
        { title: 'Transfer details', tint: 'cream' },
      ),
    )
    body.push(
      callout({
        tone: 'info',
        body: `${
          bank.instructions ?? 'Please include your booking reference in the transfer description.'
        }<br /><strong>Reference: ${esc(pnr)}</strong>`,
      }),
    )
  } else if (booking?.paymentStatus === 'paid') {
    body.push(
      callout({
        tone: 'success',
        icon: '&#10003;',
        title: 'Payment received',
        body: 'Your e-ticket is confirmed and attached to this email. Keep it handy for check-in.',
      }),
    )
  }

  // Itinerary
  if (slices.length) {
    body.push(
      `<p style="margin:0 0 12px;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:${BRAND.muted};">Your itinerary</p>`,
    )
    body.push(slices.map(sliceCard).join(''))
  }

  // Passengers
  if (passengers.length) {
    body.push(
      card(
        passengers
          .map((p, i) => {
            const name =
              `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() ||
              p.name ||
              `Passenger ${i + 1}`
            const kind = p.type ? String(p.type).toLowerCase() : 'adult'
            return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${
              i === 0 ? '' : `border-top:1px solid ${BRAND.line};`
            }"><tr>
              <td style="padding:10px 0;font-family:${SANS};font-size:14px;color:${BRAND.ink};font-weight:600;">${esc(name)}</td>
              <td align="right" style="padding:10px 0;font-family:${SANS};font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${BRAND.muted};">${esc(
                kind,
              )}</td>
            </tr></table>`
          })
          .join(''),
        { title: `Travellers (${passengers.length})` },
      ),
    )
  }

  // Price breakdown
  body.push(
    card(
      detailRows([
        ['Fare', money(baseAmount, currency)],
        ['Taxes & carrier charges', money(taxAmount, currency)],
        ['Total paid', money(totalAmount, currency)],
      ]),
      { title: 'Price breakdown' },
    ),
  )

  body.push(
    paragraph(
      `Please make sure the name on this booking matches your travel document exactly. Check-in usually opens 24–48 hours before departure.`,
      { muted: true },
    ),
  )

  return renderEmail({
    preheader: `Booking ${pnr} confirmed — ${slices[0]?.originCode ?? ''} to ${slices[0]?.destCode ?? ''}, ${bookingDate}.`,
    eyebrow: 'Booking confirmed',
    heading: `You're going to ${
      slices[0]?.destCity || slices[0]?.destCode || 'your destination'
    }`,
    intro: `Hi ${esc(firstName)}, ${
      needsTransfer
        ? 'your booking is reserved and we are holding your fare.'
        : 'your booking is confirmed and your e-ticket is ready.'
    } Here is everything you need for the trip.`,
    body: body.join('\n'),
    cta: { label: 'Manage my booking', url: manageUrl },
    ctaNote: `Booking reference ${pnr} — quote it in any correspondence.`,
    footerNote: `If you did not make this booking, contact us immediately at support@flybeth.com and we will review it with you.`,
  })
}

/* ────────────────────────────────────────────────────────────────────────────
 * Account
 * ──────────────────────────────────────────────────────────────────────────── */

export function renderWelcome(firstName: string, loginUrl: string): string {
  return renderEmail({
    preheader: 'Your Flybeth account is ready — here is how to get the most out of it.',
    eyebrow: 'Welcome aboard',
    heading: `Welcome to Flybeth, ${firstName || 'traveller'}`,
    intro:
      'Your account is ready. From one place you can compare live fares, book stays, transfers and experiences, and keep every trip document together.',
    body: [
      bulletList([
        'Live fares from 100+ airlines, re-checked before you pay',
        'Hotels, transfers, activities, car hire and packages in one checkout',
        'Every booking, ticket and receipt kept in your account',
      ]),
      divider(),
      paragraph('Start with the trip you have been putting off.', { muted: true }),
    ].join('\n'),
    cta: { label: 'Start exploring', url: loginUrl },
    footerNote:
      'You are receiving this because an account was created with this email address.',
  })
}

export function renderOtp(firstName: string, otp: string): string {
  return renderEmail({
    preheader: `Your Flybeth verification code is ${otp}. It expires shortly.`,
    eyebrow: 'Security check',
    heading: 'Your verification code',
    intro: `Hi ${esc(firstName || 'there')}, use the code below to finish signing in. It is valid for a short time and can only be used once.`,
    body: [
      codeBlock(otp, { label: 'Verification code' }),
      callout({
        tone: 'warning',
        body: 'If you did not try to sign in, do not share this code. Change your password and contact support straight away.',
      }),
    ].join('\n'),
    footerNote: 'For your security we never ask for this code by phone or chat.',
  })
}

export function renderPasswordReset(
  firstName: string,
  resetUrl: string,
  isAdmin = false,
): string {
  return renderEmail({
    preheader: 'Reset your Flybeth password — this link expires soon.',
    eyebrow: 'Password reset',
    heading: 'Choose a new password',
    intro: `Hi ${esc(
      firstName || 'there',
    )}, we received a request to reset the password for your ${isAdmin ? 'Flybeth admin' : 'Flybeth'} account. Use the button below to pick a new one.`,
    body: [
      callout({
        tone: 'info',
        body: 'The link can only be used once and expires for your protection.',
      }),
      paragraph(
        'If you did not request this, you can safely ignore this email — your password will not change.',
        { muted: true },
      ),
    ].join('\n'),
    cta: { label: 'Set a new password', url: resetUrl },
    ctaNote: 'If the button does not work, copy the link from this email into your browser.',
    footerNote: 'For your security, never forward this email.',
  })
}

/* ────────────────────────────────────────────────────────────────────────────
 * Agent / partner lifecycle
 * ──────────────────────────────────────────────────────────────────────────── */

export function renderAgentWelcome(firstName: string, loginUrl: string): string {
  return renderEmail({
    preheader: 'Your Flybeth agent account is live.',
    eyebrow: 'Agent network',
    heading: `Welcome to the network, ${firstName || 'partner'}`,
    intro:
      'Your agent account is active. You can now quote, book and manage travel for your clients, with commission tracked automatically.',
    body: [
      card(
        detailRows([
          ['Account status', 'Active'],
          ['Access', 'Agent portal'],
          ['Commission', 'Tracked per booking'],
        ]),
        { title: 'Your account' },
      ),
      paragraph('Sign in to complete your profile and start quoting.', { muted: true }),
    ].join('\n'),
    cta: { label: 'Open the agent portal', url: loginUrl },
  })
}

export function renderAgentSignupUnderReview(firstName: string): string {
  return renderEmail({
    preheader: 'We have received your agent application.',
    eyebrow: 'Application received',
    heading: 'Your application is in review',
    intro: `Thanks ${esc(
      firstName || 'for applying',
    )} — your agent application has been received and is with our partnerships team.`,
    body: [
      callout({
        tone: 'info',
        title: 'What happens next',
        body: 'We review applications within two business days. If we need anything else — usually a compliance document — we will email you directly.',
      }),
      bulletList([
        'Keep an eye on this inbox, including your spam folder',
        'Have your business registration and ID ready in case we ask',
        'You can reply to this email if anything changes',
      ]),
    ].join('\n'),
  })
}

export function renderKycApproval(firstName: string, documentType: string): string {
  return renderEmail({
    preheader: `Your ${documentType} has been verified.`,
    eyebrow: 'Compliance',
    heading: 'Your document is verified',
    intro: `Hi ${esc(firstName || 'there')}, good news — our compliance team has reviewed and approved your <strong>${esc(
      documentType,
    )}</strong>.`,
    body: [
      callout({
        tone: 'success',
        icon: '&#10003;',
        title: 'Verified',
        body: 'Your document is stored securely and your account is one step closer to full transactional access.',
      }),
    ].join('\n'),
  })
}

export function renderKycRejection(
  firstName: string,
  documentType: string,
  feedback: string,
): string {
  return renderEmail({
    preheader: `We need a new copy of your ${documentType}.`,
    eyebrow: 'Action required',
    heading: 'We could not verify this document',
    intro: `Hi ${esc(firstName || 'there')}, we reviewed your <strong>${esc(
      documentType,
    )}</strong> and were unable to approve it. This is usually a quick fix.`,
    body: [
      callout({
        tone: 'danger',
        title: 'Reviewer feedback',
        body: `<em>&ldquo;${esc(feedback || 'The document did not meet our verification requirements.')}&rdquo;</em>`,
      }),
      bulletList([
        'Upload a clear, full-page colour photo or scan',
        'Make sure all four corners are visible and nothing is cropped',
        'Check the document has not expired',
      ]),
    ].join('\n'),
    cta: { label: 'Upload a new document', url: 'https://agent.flybeth.com/kyc' },
    footerNote: 'Your account stays active while we resolve this.',
  })
}

export function renderAgentApproval(firstName: string, loginUrl: string): string {
  return renderEmail({
    preheader: 'Your agent account has been approved — you can start booking.',
    eyebrow: 'Approved',
    heading: "You're approved",
    intro: `Congratulations ${esc(
      firstName || '',
    )} — your agent account has passed review. You can now book on behalf of clients with full commission tracking.`,
    body: [
      statStrip([
        { label: 'Status', value: 'Approved' },
        { label: 'Access', value: 'Full agent portal' },
      ]),
      paragraph('Sign in and complete a first booking to activate your payout profile.', {
        muted: true,
      }),
    ].join('\n'),
    cta: { label: 'Sign in to the portal', url: loginUrl },
  })
}

export function renderTeamInvitation(
  role: string,
  inviteUrl: string,
  expiresAt: string,
  permissions: string[] = [],
): string {
  return renderEmail({
    preheader: `You have been invited to join Flybeth as ${role}.`,
    eyebrow: 'Team invitation',
    heading: 'You have been invited to Flybeth',
    intro: `You have been invited to join the Flybeth team as a <strong>${esc(
      role,
    )}</strong>. Accept the invitation to set your password and get started.`,
    body: [
      card(
        detailRows([
          ['Role', role],
          ['Invitation expires', expiresAt || 'In 7 days'],
        ]),
        { title: 'Invitation details' },
      ),
      permissions.length
        ? `<p style="margin:0 0 10px;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:${BRAND.muted};">What you can access</p>${bulletList(
            permissions.map((p) => p.replace(/_/g, ' ').toLowerCase()),
          )}`
        : '',
      paragraph('If you were not expecting this invitation, you can ignore this email.', {
        muted: true,
      }),
    ].join('\n'),
    cta: { label: 'Accept invitation', url: inviteUrl },
    footerNote: 'This link is personal to you — please do not forward it.',
  })
}

export function renderRoleUpdate(roleName: string, permissions: string[] = []): string {
  return renderEmail({
    preheader: `Your Flybeth permissions changed to ${roleName}.`,
    eyebrow: 'Account update',
    heading: 'Your permissions have changed',
    intro: `An administrator has updated your role on Flybeth. You are now a <strong>${esc(
      roleName,
    )}</strong>.`,
    body: [
      callout({
        tone: 'info',
        body: 'The change takes effect the next time you sign in. If you are already signed in, sign out and back in to see the new areas.',
      }),
      permissions.length
        ? `<p style="margin:0 0 10px;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:${BRAND.muted};">Permissions now granted</p>${bulletList(
            permissions.map((p) => p.replace(/_/g, ' ').toLowerCase()),
          )}`
        : '',
      paragraph('If this was not expected, contact your administrator.', { muted: true }),
    ].join('\n'),
  })
}

export function renderInvitationReminder(inviteUrl: string, expiresAt?: string): string {
  return renderEmail({
    preheader: 'Your Flybeth invitation is about to expire.',
    eyebrow: 'Reminder',
    heading: 'Your invitation is expiring',
    intro: `Just a nudge — your invitation to join Flybeth has not been accepted yet${
      expiresAt ? ` and expires on <strong>${esc(expiresAt)}</strong>` : ' and will expire soon'
    }.`,
    body: [
      callout({
        tone: 'warning',
        body: 'Once it expires you will need a new invitation from an administrator.',
      }),
    ].join('\n'),
    cta: { label: 'Accept invitation', url: inviteUrl },
  })
}

/* ────────────────────────────────────────────────────────────────────────────
 * Booking lifecycle
 * ──────────────────────────────────────────────────────────────────────────── */

export function renderAbandonedBooking(params: {
  firstName: string
  itemType: 'flight' | 'stay'
  itemName: string
  url: string
}): string {
  return renderEmail({
    preheader: `Still thinking about ${params.itemName}? Your rate is still available.`,
    eyebrow: 'Pick up where you left off',
    heading: 'Still thinking it over?',
    intro: `Hi ${esc(params.firstName || 'there')}, you were looking at <strong>${esc(
      params.itemName,
    )}</strong> — we saved your progress.`,
    body: [
      callout({
        tone: 'warning',
        title: 'Prices move quickly',
        body: `Availability for this ${params.itemType} can change within hours. Complete your booking to lock the rate you saw.`,
      }),
      bulletList([
        'Your selection is saved — no need to search again',
        'You will only be charged once you confirm and pay',
        'Free cancellation options are shown before payment',
      ]),
    ].join('\n'),
    cta: { label: 'Resume my booking', url: params.url },
    footerNote: 'If you have already completed this booking, please ignore this email.',
  })
}

export function renderPaymentReminder(firstName: string, pnr: string, paymentUrl: string): string {
  return renderEmail({
    preheader: `Booking ${pnr} is still awaiting payment.`,
    eyebrow: 'Payment pending',
    heading: 'Your seat is still held',
    intro: `Hi ${esc(
      firstName || 'there',
    )}, booking <strong>${esc(pnr)}</strong> is reserved but not yet ticketed. Complete payment to secure the fare.`,
    body: [
      card(detailRows([['Booking reference', pnr]]), { title: 'Your booking', tint: 'cream' }),
      callout({
        tone: 'warning',
        body: 'Held fares are released automatically if payment is not received before departure.',
      }),
    ].join('\n'),
    cta: { label: 'Complete payment', url: paymentUrl },
  })
}

export function renderPaymentReceipt(params: {
  firstName: string
  amount: number
  currency: string
  reference: string
  pnr: string
}): string {
  return renderEmail({
    preheader: `Payment of ${money(params.amount, params.currency)} received for booking ${params.pnr}.`,
    eyebrow: 'Receipt',
    heading: 'Payment received',
    intro: `Thanks ${esc(
      params.firstName || '',
    )} — we have received your payment. This email is your receipt.`,
    body: [
      statStrip([{ label: 'Amount paid', value: money(params.amount, params.currency) }]),
      card(
        detailRows(
          [
            ['Amount', money(params.amount, params.currency)],
            ['Booking reference', params.pnr],
            ['Transaction reference', params.reference],
            ['Date', new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })],
          ],
          { mono: [2] },
        ),
        { title: 'Transaction details' },
      ),
      callout({
        tone: 'success',
        icon: '&#10003;',
        body: 'Keep this receipt for your records — you may need it for expense claims or visa applications.',
      }),
    ].join('\n'),
    footerNote: `Questions about this payment? Reply with booking reference ${params.pnr}.`,
  })
}

export function renderBookingCaptureDraft(destination: string, firstName: string, checkoutUrl: string): string {
  return renderEmail({
    preheader: `Your flight to ${destination} is still waiting.`,
    eyebrow: 'Still available',
    heading: `Finish your flight to ${destination || 'your destination'}`,
    intro: `Hi ${esc(firstName || 'there')}, seats and prices do not stay still for long. If you still want this trip, now is a good moment to lock it in.`,
    body: [
      card(detailRows([['Passenger', firstName || '—'], ['Destination', destination || '—']]), {
        title: 'Your selection',
      }),
      paragraph('You will only be charged once you confirm and pay.', { muted: true }),
    ].join('\n'),
    cta: { label: 'Complete my booking', url: checkoutUrl },
  })
}

export function renderBookingVoucher(params: {
  firstName: string
  destination: string
  pnr: string
  currency: string
  amount: number | string
  manageUrl: string
}): string {
  const amountText =
    typeof params.amount === 'string' ? params.amount : money(params.amount, params.currency)
  return renderEmail({
    preheader: `E-ticket for ${params.destination} — booking ${params.pnr}.`,
    eyebrow: 'E-ticket',
    heading: `Your trip to ${params.destination || 'your destination'} is confirmed`,
    intro: `Hi ${esc(params.firstName || 'there')}, your payment was successful and your e-ticket has been issued.`,
    body: [
      statStrip([
        { label: 'Booking reference', value: params.pnr },
        { label: 'Total paid', value: amountText },
      ]),
      card(
        detailRows([
          ['Passenger', `${params.firstName || ''}`.trim() || '—'],
          ['Destination', params.destination || '—'],
          ['Total paid', amountText],
        ]),
        { title: 'Booking summary' },
      ),
    ].join('\n'),
    cta: { label: 'Manage my booking', url: params.manageUrl },
  })
}

export { button, statusPill }
