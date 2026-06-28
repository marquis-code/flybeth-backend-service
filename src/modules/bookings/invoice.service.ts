// src/modules/bookings/invoice.service.ts
import { Injectable, Logger } from "@nestjs/common";
import PDFDocument from "pdfkit";
import { BookingDocument } from "./schemas/booking.schema";
import { Writable } from "stream";

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  async generateInvoicePdf(booking: BookingDocument): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 0, size: "A4" }); // remove default margin to allow full-bleed background
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      // Light background for top half
      doc.rect(0, 0, 595, 200).fill("#f1f5f9");

      // Reset fill and margin manually
      doc.fillColor("#333333");
      
      // Header
      this.generateHeader(doc);
      
      // Invoice Details
      this.generateInvoiceDetails(doc, booking);

      // Footer
      this.generateFooter(doc);

      doc.end();
    });
  }

  private generateHeader(doc: any) {
    // Logo / Brand
    doc
      .fillColor("#1a365d")
      .fontSize(28)
      .font("Helvetica-Bold")
      .text("Flybeth Global", 50, 50)
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#718096")
      .text("123 Aviation Way, Lagos, Nigeria", 50, 85)
      .text("+1 844 FLYBETH | support@flybeth.com", 50, 100);

    // Right Side: INVOICE title
    doc
      .fillColor("#cbd5e0")
      .fontSize(36)
      .font("Helvetica-Bold")
      .text("INVOICE", 0, 45, { align: "right", width: 545 })
      .fillColor("#1a365d");
  }

  private generateInvoiceDetails(doc: any, booking: any) {
    const customerInfoTop = 140;

    // Left Column: Bill To
    doc
      .fontSize(10)
      .fillColor("#718096")
      .font("Helvetica-Bold")
      .text("BILLED TO:", 50, customerInfoTop)
      .font("Helvetica")
      .fillColor("#2d3748")
      .fontSize(14)
      .font("Helvetica-Bold")
      .text(booking.contactDetails.name || "Customer", 50, customerInfoTop + 15)
      .font("Helvetica")
      .fontSize(10)
      .text(booking.contactDetails.email, 50, customerInfoTop + 35)
      .text(booking.contactDetails.phone, 50, customerInfoTop + 50);

    // Right Column: Invoice Meta
    doc
      .fontSize(10)
      .fillColor("#718096")
      .font("Helvetica-Bold")
      .text("INVOICE NO:", 350, customerInfoTop)
      .fillColor("#2d3748")
      .font("Helvetica")
      .text(booking.pnr, 430, customerInfoTop)
      
      .fillColor("#718096")
      .font("Helvetica-Bold")
      .text("DATE:", 350, customerInfoTop + 20)
      .fillColor("#2d3748")
      .font("Helvetica")
      .text(new Date().toLocaleDateString(), 430, customerInfoTop + 20)
      
      .fillColor("#718096")
      .font("Helvetica-Bold")
      .text("STATUS:", 350, customerInfoTop + 40)
      .fillColor("#2d3748")
      .font("Helvetica")
      .text(booking.payment.status.toUpperCase(), 430, customerInfoTop + 40);

    // Main Body starts at 230
    let currentY = 240;

    // Left Side: Trip Details (width 250)
    doc.fontSize(14).fillColor("#1a365d").font("Helvetica-Bold").text("Trip Summary", 50, currentY);
    currentY += 25;
    
    if (booking.flights && booking.flights.length > 0) {
        booking.flights.forEach((f: any) => {
            const flight = f.flight || {};
            // Flight Box
            doc.rect(50, currentY, 260, 80).fillOpacity(0.05).fill("#3182ce").fillOpacity(1);
            doc.strokeColor("#e2e8f0").lineWidth(1).rect(50, currentY, 260, 80).stroke();
            
            doc.fillColor("#2d3748").fontSize(12).font("Helvetica-Bold").text(`${flight.departureCity || 'Origin'} to ${flight.arrivalCity || 'Destination'}`, 65, currentY + 15);
            doc.fillColor("#718096").fontSize(10).font("Helvetica").text(`${flight.airline || 'Airline'} • Flight ${flight.flightNumber || ''} • ${f.class ? f.class.toUpperCase() : ''}`, 65, currentY + 35);
            
            let depDate = flight.departureTime ? new Date(flight.departureTime).toLocaleDateString() : 'TBD';
            doc.fillColor("#4a5568").fontSize(10).font("Helvetica").text(`Departs: ${depDate}`, 65, currentY + 55);
            
            currentY += 95;
        });
    }

    // Right Side: Payment Receipt Box (width 220)
    const receiptBoxX = 330;
    let receiptBoxY = 240;

    // Draw Receipt Box
    doc.rect(receiptBoxX, receiptBoxY, 215, 230).fillOpacity(0.02).fill("#1a365d").fillOpacity(1);
    doc.strokeColor("#cbd5e0").lineWidth(1).rect(receiptBoxX, receiptBoxY, 215, 230).stroke();

    // Receipt Header
    doc.fillColor("#718096").fontSize(10).font("Helvetica-Bold").text("PAYMENT RECEIPT", receiptBoxX, receiptBoxY + 20, { align: 'center', width: 215 });
    
    // Receipt Total
    doc.fillColor("#1a365d").fontSize(24).font("Helvetica-Bold").text(`${booking.pricing.currency} ${booking.pricing.totalAmount.toLocaleString()}`, receiptBoxX, receiptBoxY + 45, { align: 'center', width: 215 });
    
    // Fare Breakup
    const breakupY = receiptBoxY + 90;
    doc.fillColor("#a0aec0").fontSize(9).font("Helvetica-Bold").text("FARE BREAKUP", receiptBoxX + 20, breakupY);
    
    // Dashed line
    this.drawDashedLine(doc, receiptBoxX + 20, breakupY + 15, receiptBoxX + 195);

    let fareY = breakupY + 25;
    doc.fillColor("#4a5568").fontSize(10).font("Helvetica");
    
    // Base Fare
    this.drawReceiptRow(doc, fareY, "Base Fare", booking.pricing.baseFare, booking.pricing.currency, receiptBoxX);
    fareY += 18;

    // Taxes
    this.drawReceiptRow(doc, fareY, "Taxes & Surcharges", booking.pricing.taxes, booking.pricing.currency, receiptBoxX);
    fareY += 18;

    // Service Fee
    if (booking.pricing.agentServiceFee > 0) {
        this.drawReceiptRow(doc, fareY, "Service Fee", booking.pricing.agentServiceFee, booking.pricing.currency, receiptBoxX);
        fareY += 18;
    }

    // Markup
    if (booking.pricing.adultMarkup > 0) {
        this.drawReceiptRow(doc, fareY, "Agent Markup", booking.pricing.adultMarkup, booking.pricing.currency, receiptBoxX);
        fareY += 18;
    }

    // Insurance
    if (booking.pricing.insuranceAmount > 0) {
        this.drawReceiptRow(doc, fareY, "Travel Insurance", booking.pricing.insuranceAmount, booking.pricing.currency, receiptBoxX);
        fareY += 18;
    }

    // Final Total line
    this.drawDashedLine(doc, receiptBoxX + 20, fareY + 5, receiptBoxX + 195);
    fareY += 15;
    
    doc.fillColor("#1a365d").font("Helvetica-Bold");
    this.drawReceiptRow(doc, fareY, "Total Paid", booking.pricing.totalAmount, booking.pricing.currency, receiptBoxX);

  }

  private drawReceiptRow(doc: any, y: number, label: string, amount: number, currency: string, startX: number) {
      doc.text(label, startX + 20, y);
      doc.text(`${currency} ${amount.toLocaleString()}`, startX, y, { align: 'right', width: 175 });
  }

  private drawDashedLine(doc: any, startX: number, y: number, endX: number) {
      doc.strokeColor("#cbd5e0").lineWidth(1).dash(2, { space: 2 }).moveTo(startX, y).lineTo(endX, y).stroke().undash();
  }

  private generateFooter(doc: any) {
    const pageHeight = doc.page.height;
    
    // Footer Background
    doc.rect(0, pageHeight - 80, 595, 80).fill("#1a365d");

    doc
      .fillColor("#ffffff")
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Thank you for booking with Flybeth Global.", 0, pageHeight - 50, { align: "center", width: 595 })
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#a0aec0")
      .text("This is a system-generated invoice. No signature is required.", 0, pageHeight - 30, { align: "center", width: 595 });
  }
}
