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
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      // Header
      this.generateHeader(doc);
      
      // Customer Info
      this.generateCustomerInformation(doc, booking);

      // Invoice Details
      this.generateInvoiceDetails(doc, booking);

      // Table Header
      this.generateInvoiceTable(doc, booking);

      // Footer
      this.generateFooter(doc);

      doc.end();
    });
  }

  private generateHeader(doc: any) {
    doc
      .fillColor("#444444")
      .fontSize(20)
      .text("Flybeth Global", 50, 57)
      .fontSize(10)
      .text("123 Aviation Way", 200, 50, { align: "right" })
      .text("Lagos, Nigeria", 200, 65, { align: "right" })
      .text("+1 844 FLYBETH (359-2384)", 200, 80, { align: "right" })
      .moveDown();
  }

  private generateCustomerInformation(doc: any, booking: any) {
    doc
      .fillColor("#444444")
      .fontSize(20)
      .text("Invoice", 50, 160);

    this.generateHr(doc, 185);

    const customerInfoTop = 200;

    doc
      .fontSize(10)
      .text("Invoice Number:", 50, customerInfoTop)
      .font("Helvetica-Bold")
      .text(booking.pnr, 150, customerInfoTop)
      .font("Helvetica")
      .text("Invoice Date:", 50, customerInfoTop + 15)
      .text(new Date().toLocaleDateString(), 150, customerInfoTop + 15)
      .text("Payment Status:", 50, customerInfoTop + 30)
      .text(booking.payment.status.toUpperCase(), 150, customerInfoTop + 30)

      .font("Helvetica-Bold")
      .text(booking.contactDetails.name || "Customer", 300, customerInfoTop)
      .font("Helvetica")
      .text(booking.contactDetails.email, 300, customerInfoTop + 15)
      .text(booking.contactDetails.phone, 300, customerInfoTop + 30)
      .moveDown();

    this.generateHr(doc, 252);
  }

  private generateInvoiceDetails(doc: any, booking: any) {
      // Add trip details
      doc.fontSize(12).font("Helvetica-Bold").text("Trip Details", 50, 270);
      doc.fontSize(10).font("Helvetica");
      
      let y = 290;
      if (booking.flights && booking.flights.length > 0) {
          booking.flights.forEach((f: any) => {
              doc.text(`Flight: ${f.flight?.flightNumber || 'N/A'} - ${f.class} Class`, 50, y);
              y += 15;
          });
      }
      
      if (booking.stays && booking.stays.length > 0) {
          booking.stays.forEach((s: any) => {
              doc.text(`Stay: ${s.stay?.name || 'Hotel'} - ${s.room?.name || 'Room'}`, 50, y);
              y += 15;
          });
      }
  }

  private generateInvoiceTable(doc: any, booking: any) {
    let i;
    const invoiceTableTop = 350;

    doc.font("Helvetica-Bold");
    this.generateTableRow(
      doc,
      invoiceTableTop,
      "Item",
      "Description",
      "Cost"
    );
    this.generateHr(doc, invoiceTableTop + 20);
    doc.font("Helvetica");

    let y = invoiceTableTop + 30;

    // Base Fare
    this.generateTableRow(
        doc,
        y,
        "Base Fare",
        "Net ticket/room price",
        this.formatCurrency(booking.pricing.baseFare, booking.pricing.currency)
    );
    y += 20;

    // Taxes
    this.generateTableRow(
        doc,
        y,
        "Taxes",
        "Regulatory taxes and airport fees",
        this.formatCurrency(booking.pricing.taxes, booking.pricing.currency)
    );
    y += 20;

    // Agent Service Fee
    if (booking.pricing.agentServiceFee > 0) {
        this.generateTableRow(
            doc,
            y,
            "Service Fee",
            "Agent processing fee",
            this.formatCurrency(booking.pricing.agentServiceFee, booking.pricing.currency)
        );
        y += 20;
    }

    // Adult Markup
    if (booking.pricing.adultMarkup > 0) {
        this.generateTableRow(
            doc,
            y,
            "Markup",
            "Agent applied markup",
            this.formatCurrency(booking.pricing.adultMarkup, booking.pricing.currency)
        );
        y += 20;
    }
    
    // Insurance
    if (booking.hasInsurance) {
        this.generateTableRow(
            doc,
            y,
            "Insurance",
            "Travel protection coverage",
            this.formatCurrency(booking.pricing.insuranceAmount || 0, booking.pricing.currency)
        );
        y += 20;
    }

    this.generateHr(doc, y);

    const subtotalPosition = y + 20;
    doc.font("Helvetica-Bold");
    this.generateTableRow(
      doc,
      subtotalPosition,
      "",
      "Total Amount",
      this.formatCurrency(booking.pricing.totalAmount, booking.pricing.currency)
    );
  }

  private generateFooter(doc: any) {
    doc
      .fontSize(10)
      .text(
        "Thank you for choosing Flybeth Global. Have a safe journey!",
        50,
        780,
        { align: "center", width: 500 }
      );
  }

  private generateTableRow(
    doc: any,
    y: number,
    item: string,
    description: string,
    amount: string
  ) {
    doc
      .fontSize(10)
      .text(item, 50, y)
      .text(description, 150, y)
      .text(amount, 0, y, { align: "right" });
  }

  private generateHr(doc: any, y: number) {
    doc
      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(50, y)
      .lineTo(550, y)
      .stroke();
  }

  private formatCurrency(amount: number, currency: string) {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
