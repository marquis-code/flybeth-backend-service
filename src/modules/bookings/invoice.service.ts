// src/modules/bookings/invoice.service.ts
import { Injectable, Logger } from "@nestjs/common";
import puppeteer from "puppeteer";
import { BookingDocument } from "./schemas/booking.schema";

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  async generateInvoicePdf(booking: BookingDocument): Promise<Buffer> {
    this.logger.log(`Generating PDF invoice for booking: ${booking.pnr}`);

    let flightHtml = "";
    const firstFlight = booking.flights && (booking.flights[0] as any);
    const isReturn = booking.isRoundTrip || 
                     (firstFlight?.metadata?.slices?.length > 1) || 
                     (firstFlight?.metadata?.itineraries?.length > 1) || 
                     (booking.flights && booking.flights.length > 1);
    const tripType = isReturn ? "Round Trip" : "One Way";

    if (booking.flights && booking.flights.length > 0) {
      flightHtml = `<div style="font-size: 12px; font-weight: 600; color: var(--green); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">${tripType}</div>`;

      booking.flights.forEach((f: any, fIndex: number) => {
        const metadata = f.metadata || {};
        const cabinClass = f.class || "Basic";

        if (metadata.slices && metadata.slices.length > 0) {
          metadata.slices.forEach((slice: any, sliceIndex: number) => {
            const firstSegment = slice.segments && slice.segments[0];
            const lastSegment = slice.segments && slice.segments[slice.segments.length - 1];
            
            const origin = firstSegment?.origin?.iata_code || firstSegment?.origin?.iata_city_code || metadata.origin || "Origin";
            const dest = lastSegment?.destination?.iata_code || lastSegment?.destination?.iata_city_code || metadata.destination || "Destination";
            const airline = firstSegment?.marketing_carrier?.name || metadata.airline || "Airline";
            const departureTime = firstSegment?.departing_at || metadata.departureTime;
            const formattedTime = departureTime ? new Date(departureTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "";

            flightHtml += `
            <div style="margin-bottom: 24px; border: 1px solid var(--line); border-radius: 12px; padding: 16px; background: var(--paper);">
              <div style="font-size: 11px; font-weight: 600; color: var(--slate); margin-bottom: 8px; text-transform: uppercase;">Flight ${sliceIndex + 1} ${formattedTime ? '&bull; ' + formattedTime : ''}</div>
              <div class="route" style="margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;">
                <div class="route-point" style="text-align: left;">
                  <div class="route-city" style="font-size: 20px; font-weight: 700; color: var(--ink);">${origin}</div>
                  <div class="route-sub" style="font-size: 12px; color: var(--slate);">Confirmed</div>
                </div>
                <div class="route-path" style="flex: 1; margin: 0 16px; position: relative; display: flex; align-items: center; justify-content: center;">
                  <div style="position: absolute; width: 100%; height: 1px; border-bottom: 1px dashed var(--gold); top: 50%;"></div>
                  <div class="plane-icon" style="background: var(--paper); padding: 0 8px; position: relative; z-index: 2;">
                    <svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: var(--gold);"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2.5 1.8V22l4-1 4 1v-1.2L13 19v-5.5z"/></svg>
                  </div>
                </div>
                <div class="route-point dest" style="text-align: right;">
                  <div class="route-city" style="font-size: 20px; font-weight: 700; color: var(--ink);">${dest}</div>
                  <div class="route-sub" style="font-size: 12px; color: var(--slate);">Confirmed</div>
                </div>
              </div>
              <div class="fare-chip" style="margin: 0; background: var(--white); border-radius: 8px; padding: 8px 12px; display: inline-flex; align-items: center; gap: 8px; font-size: 11.5px; border: 1px solid var(--line);">
                <span>Airline <b>${airline}</b></span>
                <span class="divider" style="color: var(--line);">•</span>
                <span>Class <b>${cabinClass}</b></span>
              </div>
            </div>
            `;
          });
        } else {
          // Fallback for bookings without slices
          const origin = metadata.origin || "Origin";
          const dest = metadata.destination || "Destination";
          const airline = metadata.airline || "Airline";
          const departureTime = metadata.departureTime ? new Date(metadata.departureTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "";

          flightHtml += `
          <div style="margin-bottom: 24px; border: 1px solid var(--line); border-radius: 12px; padding: 16px; background: var(--paper);">
            <div style="font-size: 11px; font-weight: 600; color: var(--slate); margin-bottom: 8px; text-transform: uppercase;">Flight ${fIndex + 1} ${departureTime ? '&bull; ' + departureTime : ''}</div>
            <div class="route" style="margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;">
              <div class="route-point" style="text-align: left;">
                <div class="route-city" style="font-size: 20px; font-weight: 700; color: var(--ink);">${origin}</div>
                <div class="route-sub" style="font-size: 12px; color: var(--slate);">Confirmed</div>
              </div>
              <div class="route-path" style="flex: 1; margin: 0 16px; position: relative; display: flex; align-items: center; justify-content: center;">
                <div style="position: absolute; width: 100%; height: 1px; border-bottom: 1px dashed var(--gold); top: 50%;"></div>
                <div class="plane-icon" style="background: var(--paper); padding: 0 8px; position: relative; z-index: 2;">
                  <svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: var(--gold);"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2.5 1.8V22l4-1 4 1v-1.2L13 19v-5.5z"/></svg>
                </div>
              </div>
              <div class="route-point dest" style="text-align: right;">
                <div class="route-city" style="font-size: 20px; font-weight: 700; color: var(--ink);">${dest}</div>
                <div class="route-sub" style="font-size: 12px; color: var(--slate);">Confirmed</div>
              </div>
            </div>
            <div class="fare-chip" style="margin: 0; background: var(--white); border-radius: 8px; padding: 8px 12px; display: inline-flex; align-items: center; gap: 8px; font-size: 11.5px; border: 1px solid var(--line);">
              <span>Airline <b>${airline}</b></span>
              <span class="divider" style="color: var(--line);">•</span>
              <span>Class <b>${cabinClass}</b></span>
            </div>
          </div>
          `;
        }
      });
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Flybeth — Booking Confirmation</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root{
    --ink:#14213D;
    --ink-soft:#3A4A6B;
    --gold:#C9A24B;
    --gold-deep:#A9822F;
    --cream:#F3EEE2;
    --paper:#FAF7F0;
    --white:#FFFFFF;
    --slate:#6B7280;
    --green:#2F9E68;
    --line:#DCD5C2;
    --shadow: 0 30px 60px -20px rgba(20,33,61,0.35), 0 10px 20px -10px rgba(20,33,61,0.15);
  }
  *{box-sizing:border-box;}
  body{
    margin:0;
    padding:48px 16px;
    background:
      radial-gradient(circle at 15% 10%, rgba(201,162,75,0.10), transparent 40%),
      radial-gradient(circle at 85% 90%, rgba(20,33,61,0.06), transparent 45%),
      var(--cream);
    font-family:'Inter', sans-serif;
    color:var(--ink);
    display:flex;
    justify-content:center;
  }

  .ticket{
    width:100%;
    max-width:640px;
    background:var(--white);
    border-radius:22px;
    box-shadow:var(--shadow);
    overflow:hidden;
    position:relative;
  }

  /* ===== HEADER ===== */
  .stub-head{
    background: var(--white);
    color: var(--ink);
    padding:30px 34px 26px;
    position:relative;
    overflow:hidden;
    border-bottom: 2px solid var(--green);
  }
  .stub-head::after{
    content:"";
    position:absolute;
    right:-40px; top:-60px;
    width:220px; height:220px;
    border-radius:50%;
    background:radial-gradient(circle, rgba(47,158,104,0.08), transparent 70%);
  }
  .brand-row{
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    position:relative;
    z-index:1;
  }
  .brand{
    display: flex;
    align-items: center;
    margin-top: 4px;
  }
  .eyebrow{
    font-size:10.5px;
    letter-spacing:2.5px;
    text-transform:uppercase;
    color:var(--slate);
    margin-bottom:4px;
    display:block;
  }
  .pnr-block{
    text-align:right;
  }
  .pnr-code{
    font-family:'IBM Plex Mono', monospace;
    font-size:22px;
    font-weight:600;
    letter-spacing:3px;
    color:var(--gold);
  }
  .status-row{
    margin-top:22px;
    display:flex;
    align-items:center;
    gap:8px;
    position:relative;
    z-index:1;
  }
  .status-dot{
    width:7px;height:7px;border-radius:50%;
    background:#4ADE80;
    box-shadow:0 0 0 3px rgba(74,222,128,0.25);
  }
  .status-text{
    font-size:12.5px;
    letter-spacing:1.2px;
    text-transform:uppercase;
    color:#B9C4DE;
    font-weight:500;
  }

  /* ===== META ROW ===== */
  .meta-row{
    display:flex;
    padding:22px 34px;
    background:var(--paper);
    border-bottom:1px dashed var(--line);
  }
  .meta-col{ flex:1; }
  .meta-col + .meta-col{ text-align:right; }
  .meta-label{
    font-size:10.5px;
    letter-spacing:1.6px;
    text-transform:uppercase;
    color:var(--slate);
    margin-bottom:5px;
  }
  .meta-value{
    font-size:15px;
    font-weight:600;
    color:var(--ink);
  }

  /* ===== ROUTE ===== */
  .route-section{
    padding:34px 34px 26px;
  }
  .section-label{
    font-size:10.5px;
    letter-spacing:2px;
    text-transform:uppercase;
    color:var(--gold-deep);
    font-weight:600;
    margin-bottom:20px;
  }
  .route{
    display:flex;
    align-items:center;
    gap:18px;
  }
  .route-point{ flex:0 0 auto; text-align:left; }
  .route-point.dest{ text-align:right; }
  .route-city{
    font-family:'Fraunces', serif;
    font-size:26px;
    font-weight:600;
    line-height:1.1;
  }
  .route-sub{
    font-size:12px;
    color:var(--slate);
    margin-top:4px;
    letter-spacing:0.3px;
  }
  .route-path{
    flex:1;
    position:relative;
    height:20px;
    display:flex;
    align-items:center;
  }
  .route-path::before{
    content:"";
    position:absolute;
    left:0; right:0; top:50%;
    height:1px;
    background:repeating-linear-gradient(to right, var(--gold) 0 6px, transparent 6px 12px);
    transform:translateY(-50%);
  }
  .plane-icon{
    position:relative;
    margin:0 auto;
    z-index:1;
    background:var(--white);
    width:26px; height:26px;
    display:flex;
    align-items:center;
    justify-content:center;
  }
  .plane-icon svg{ width:16px; height:16px; fill:var(--gold-deep); }

  .fare-chip{
    margin-top:22px;
    display:inline-flex;
    gap:14px;
    align-items:center;
    background:var(--paper);
    border:1px solid var(--line);
    border-radius:10px;
    padding:10px 16px;
    font-size:12.5px;
    color:var(--ink-soft);
  }
  .fare-chip b{ color:var(--ink); }
  .fare-chip .divider{ color:var(--line); }

  /* ===== PERFORATION ===== */
  .perforation{
    position:relative;
    height:0;
    border-top:2px dashed var(--line);
    margin:0 0;
  }
  .notch{
    position:absolute;
    width:28px; height:28px;
    background:var(--cream);
    border-radius:50%;
    top:-14px;
  }
  .notch.left{ left:-14px; }
  .notch.right{ right:-14px; }

  /* ===== RECEIPT ===== */
  .receipt{
    padding:30px 34px 8px;
  }
  .receipt-total{
    text-align:center;
    margin-bottom:22px;
  }
  .receipt-total .meta-label{ justify-content:center; margin-bottom:8px; }
  .total-amount{
    font-family:'Fraunces', serif;
    font-size:40px;
    font-weight:600;
    color:var(--ink);
  }
  .total-amount sup{
    font-size:16px;
    font-weight:500;
    color:var(--slate);
    margin-right:4px;
    top:-14px;
  }

  .stamp{
    position:absolute;
    right:36px;
    top:14px;
    width:84px; height:84px;
    border:2px solid var(--green);
    border-radius:50%;
    transform:rotate(-14deg);
    display:flex;
    align-items:center;
    justify-content:center;
    color:var(--green);
    font-family:'IBM Plex Mono', monospace;
    font-size:10.5px;
    font-weight:600;
    letter-spacing:1px;
    text-align:center;
    line-height:1.3;
    opacity:0.85;
  }
  .stamp::before{
    content:"";
    position:absolute;
    inset:6px;
    border:1px dashed var(--green);
    border-radius:50%;
  }
  .receipt-block{ position:relative; }

  .line-item{
    display:flex;
    justify-content:space-between;
    padding:10px 0;
    font-size:13.5px;
    color:var(--ink-soft);
  }
  .line-item.total{
    border-top:1px solid var(--line);
    margin-top:6px;
    padding-top:14px;
    font-size:15px;
    font-weight:600;
    color:var(--ink);
  }
  .line-item span:last-child{ font-family:'IBM Plex Mono', monospace; font-weight:500; }

  /* ===== PREP ===== */
  .prep{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:14px;
    padding:26px 34px 32px;
  }
  .prep-card{
    background:var(--paper);
    border:1px solid var(--line);
    border-radius:12px;
    padding:16px;
  }
  .prep-icon{
    width:30px;height:30px;
    border-radius:8px;
    background:var(--ink);
    display:flex;align-items:center;justify-content:center;
    margin-bottom:10px;
  }
  .prep-icon svg{ width:16px;height:16px; fill:var(--gold); }
  .prep-title{
    font-size:13px;
    font-weight:600;
    margin-bottom:4px;
  }
  .prep-text{
    font-size:11.5px;
    color:var(--slate);
    line-height:1.5;
  }

  /* ===== FOOTER / BARCODE ===== */
  .footer{
    padding:0 34px 34px;
    text-align:center;
  }
  .barcode{
    display:flex;
    justify-content:center;
    gap:2px;
    height:34px;
    margin:0 auto 10px;
    width:fit-content;
  }
  .barcode span{
    display:block;
    width:2px;
    background:var(--ink);
    opacity:0.75;
  }
  .barcode-label{
    font-family:'IBM Plex Mono', monospace;
    font-size:11px;
    letter-spacing:3px;
    color:var(--slate);
    margin-bottom:18px;
  }
  .footer-note{
    font-size:12px;
    color:var(--slate);
    line-height:1.6;
  }
  .footer-note b{ color:var(--ink-soft); }

  @media (max-width:480px){
    .route-city{ font-size:20px; }
    .total-amount{ font-size:32px; }
    .stamp{ width:66px;height:66px; right:20px; top:8px; font-size:9px;}
    .prep{ grid-template-columns:1fr; }
    .meta-row, .route-section, .receipt, .footer{ padding-left:22px; padding-right:22px; }
    .stub-head{ padding:26px 22px 22px; }
  }
</style>
</head>
<body>

<div class="ticket">

  <!-- HEADER -->
  <div class="stub-head">
    <div class="brand-row">
      <div>
        <span class="eyebrow">Booking Confirmation</span>
        <div class="brand">
          <img src="https://res.cloudinary.com/marquis/image/upload/v1780815566/logo_dovk4t.png" alt="Flybeth Logo" style="height:44px;" />
        </div>
      </div>
      <div class="pnr-block">
        <span class="eyebrow">PNR</span>
        <div class="pnr-code">${booking.pnr || "N/A"}</div>
      </div>
    </div>
    <div class="status-row">
      <span class="status-dot"></span>
      <span class="status-text" style="color: var(--slate);">${booking.payment?.status === "success" ? "Confirmed & Ticketed" : "Processing"}</span>
    </div>
  </div>

  <!-- META -->
  <div class="meta-row">
    <div class="meta-col">
      <div class="meta-label">Booking Date</div>
      <div class="meta-value">${new Date((booking as any).createdAt || Date.now()).toLocaleDateString("en-US", { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</div>
    </div>
    <div class="meta-col">
      <div class="meta-label">Guest Name</div>
      <div class="meta-value">${booking.contactDetails?.name || "Customer"}</div>
    </div>
  </div>

  <!-- ROUTE -->
  <div class="route-section">
    <div class="section-label">Flight Details</div>
    <div class="route" style="display: block;">
      ${flightHtml}
    </div>

  <div class="perforation"><span class="notch left"></span><span class="notch right"></span></div>

  <!-- RECEIPT -->
  <div class="receipt">
    <div class="receipt-block">
      <div class="stamp">PAID<br>IN FULL</div>
      <div class="receipt-total">
        <div class="meta-label">Total Charge</div>
        <div class="total-amount"><sup>${booking.pricing?.currency || "USD"}</sup>${(booking.pricing?.totalAmount || 0).toLocaleString()}</div>
      </div>
      <div class="line-item"><span>Base Fare</span><span>${booking.pricing?.currency || "USD"} ${(booking.pricing?.baseFare || 0).toLocaleString()}</span></div>
      <div class="line-item"><span>Taxes &amp; Surcharges</span><span>${booking.pricing?.currency || "USD"} ${(booking.pricing?.taxes || 0).toLocaleString()}</span></div>
      <div class="line-item total"><span>Total Paid</span><span>${booking.pricing?.currency || "USD"} ${(booking.pricing?.totalAmount || 0).toLocaleString()}</span></div>
    </div>
  </div>

  <!-- PREP -->
  <div class="prep">
    <div class="prep-card">
      <div class="prep-icon"><svg viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2.5 1.8V22l4-1 4 1v-1.2L13 19v-5.5z"/></svg></div>
      <div class="prep-title">Arrive on time</div>
      <div class="prep-text">Plan to arrive at least 3 hours before your scheduled departure.</div>
    </div>
    <div class="prep-card">
      <div class="prep-icon"><svg viewBox="0 0 24 24"><path d="M12 2C7 2 3 5.5 3 10c0 6.5 9 12 9 12s9-5.5 9-12c0-4.5-4-8-9-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg></div>
      <div class="prep-title">Passport check</div>
      <div class="prep-text">Ensure it's valid for 6 months and review visa requirements.</div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="barcode">
      <span style="height:34px"></span><span style="height:22px"></span><span style="height:34px"></span><span style="height:14px"></span><span style="height:34px"></span><span style="height:22px"></span><span style="height:34px"></span><span style="height:34px"></span><span style="height:14px"></span><span style="height:34px"></span><span style="height:22px"></span><span style="height:34px"></span><span style="height:34px"></span><span style="height:14px"></span><span style="height:22px"></span><span style="height:34px"></span><span style="height:34px"></span><span style="height:14px"></span><span style="height:34px"></span><span style="height:22px"></span><span style="height:34px"></span><span style="height:14px"></span><span style="height:34px"></span><span style="height:22px"></span><span style="height:34px"></span>
    </div>
    <div class="barcode-label">${booking.pnr || "N/A"}</div>
    <div class="footer-note">Thank you for booking with <b>Flybeth Global</b>.<br>Your official PDF invoice is attached to this email.</div>
  </div>

</div>

</body>
</html>
    `;

    try {
      const browser = await puppeteer.launch({
        headless: true,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      
      // Wait for web fonts to load
      await page.setContent(htmlContent, { waitUntil: 'load' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', bottom: '0', left: '0', right: '0' }
      });
      
      await browser.close();
      return Buffer.from(pdfBuffer);
    } catch (error) {
      this.logger.error('Failed to generate PDF with puppeteer', error);
      throw error;
    }
  }
}
