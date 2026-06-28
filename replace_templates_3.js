const fs = require('fs');
const path = '/Users/marquis/flybeth/backend/src/modules/notifications/notifications.service.ts';
let content = fs.readFileSync(path, 'utf8');

const newSeedMethod = `  async seedDefaultTemplates(): Promise<void> {
    const baseStyle = \`body { margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, sans-serif; }
    .email-wrapper { max-width: 600px; margin: 0 auto; padding: 40px 20px; text-align: center; color: #333333; }
    .logo { margin-bottom: 30px; font-weight: bold; font-size: 20px; color: #111827; }
    .title { font-size: 18px; font-weight: 600; margin-bottom: 10px; color: #111827; }
    .text { font-size: 14px; line-height: 1.5; color: #4b5563; margin-bottom: 20px; text-align: left; }
    .btn { display: inline-block; background-color: #111827; color: #ffffff !important; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-size: 14px; margin: 20px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
    .footer a { color: #111827; text-decoration: none; font-weight: 500; }
    .box { background: #f9fafb; padding: 20px; border-radius: 6px; text-align: left; margin-bottom: 20px; }
    .box p { margin: 0 0 10px 0; font-size: 14px; }
    .box p:last-child { margin: 0; }\`;

    const getHtml = (innerContent) => \`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><style>\${baseStyle}</style></head>
<body>
  <div class="email-wrapper">
    <div class="logo">Flybeth</div>
    \${innerContent}
    <div class="footer">
      <p>Looking for your next adventure?</p>
      <a href="\${this.configService.get("CLIENT_URL") || 'https://flybeth.com'}">Visit Flybeth to perform other bookings</a>
    </div>
  </div>
</body>
</html>\`;

    const defaults = [
      {
        slug: "booking-capture-draft",
        name: "Flight Booking Capture",
        subject: "Finish your flight to {{destination}}",
        htmlContent: getHtml(\`
          <div class="title">Finish your flight to {{destination}}</div>
          <p class="text">Seats and prices don't stick around for long. If you still want this trip, now's a good time to lock it in.</p>
          <div class="box">
            <p><strong>Passenger:</strong> {{firstName}}</p>
            <p><strong>Destination:</strong> {{destination}}</p>
          </div>
          <a href="{{checkoutUrl}}" class="btn">Complete your booking</a>
        \`),
        availableVariables: ["firstName", "destination", "checkoutUrl"],
      },
      {
        slug: "payment-reminder",
        name: "Payment Reminder",
        subject: "Secure your ticket for {{pnr}}",
        htmlContent: getHtml(\`
          <div class="title">Action Required, {{firstName}}</div>
          <p class="text">Your booking is currently pending final settlement. Please complete your payment to secure your seat and current price.</p>
          <div class="box">
            <p><strong>Booking Reference:</strong> {{pnr}}</p>
          </div>
          <a href="{{paymentUrl}}" class="btn">Secure Ticket Now</a>
        \`),
        availableVariables: ["firstName", "pnr", "paymentUrl"],
      },
      {
        slug: "welcome-email",
        name: "Welcome to Flybeth",
        subject: "Welcome to Flybeth, {{firstName}}",
        htmlContent: getHtml(\`
          <div class="title">Welcome aboard, {{firstName}}!</div>
          <p class="text">We're delighted to welcome you to the Flybeth family. Access exclusive rates and manage your entire travel ecosystem from our customized dashboard.</p>
          <a href="{{loginUrl}}" class="btn">Explore Destinations</a>
        \`),
        availableVariables: ["firstName", "loginUrl"],
      },
      {
        slug: "password-reset",
        name: "Password Reset",
        subject: "Reset your Flybeth password",
        htmlContent: getHtml(\`
          <div class="title">Reset your password</div>
          <p class="text">Hello {{firstName}}, we received a request to reset your password. Click the button below to choose a new one.</p>
          <a href="{{resetUrl}}" class="btn">Reset Password</a>
          <p class="text" style="font-size: 12px; color: #9ca3af; margin-top: 20px;">If you didn't request this, you can safely ignore this email.</p>
        \`),
        availableVariables: ["firstName", "resetUrl"],
      },
      {
        slug: "booking-confirmation",
        name: "E-Ticket & Booking Confirmation",
        subject: "Your E-Ticket for {{destination}} is ready!",
        htmlContent: getHtml(\`
          <div class="title">Booking Confirmed!</div>
          <p class="text">Hi {{firstName}}, your payment was successful and your e-ticket has been issued for your trip to {{destination}}.</p>
          <div class="box">
            <p><strong>Booking Reference (PNR):</strong> {{pnr}}</p>
            <p><strong>Passenger:</strong> {{firstName}} {{lastName}}</p>
            <p><strong>Total Paid:</strong> {{currency}} {{amount}}</p>
          </div>
          <a href="{{manageUrl}}" class="btn">Manage Booking</a>
        \`),
        availableVariables: ["firstName", "lastName", "destination", "pnr", "currency", "amount", "manageUrl"],
      },
    ];

    for (const t of defaults) {
      await this.templateModel.findOneAndUpdate({ slug: t.slug }, t, {
        upsert: true,
        new: true,
      });
    }
    this.logger.log("Default email templates seeded");
  }`;

const startIndex = content.indexOf('async seedDefaultTemplates(): Promise<void> {');
const endIndex = content.indexOf('this.logger.log("Default email templates seeded");') + 'this.logger.log("Default email templates seeded");\n  }'.length;

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + newSeedMethod + content.substring(endIndex);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Updated successfully.");
} else {
  console.log("Could not find the bounds.");
}
