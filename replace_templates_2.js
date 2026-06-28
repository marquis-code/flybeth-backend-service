const fs = require('fs');
const path = '/Users/marquis/flybeth/backend/src/modules/notifications/notifications.service.ts';
let content = fs.readFileSync(path, 'utf8');

// Welcome Email
content = content.replace(/const title = "Welcome to a New Era of Travel! 🌍";[\s\S]*?this\.resendService\.brandWrapper\(title, content\),\n\s*\);/g, 
`const title = "Welcome to Flybeth!";
    const content = \`
      <p>Hi \${firstName},</p>
      <p>We're delighted to welcome you to the Flybeth family! Our mission is to make every journey feel effortless and premium.</p>
      <div style="margin: 24px 0; background-color: #f9fafb; border-radius: 8px; padding: 24px; border: 1px solid #e5e7eb;">
        <p style="margin: 0 0 8px 0; font-weight: 600;">Elite Inventory</p>
        <p style="margin: 0 0 16px 0; font-size: 13px; color: #4b5563;">Unlock global rates for flights and luxury accommodation seamlessly synced to your account.</p>
        <p style="margin: 0 0 8px 0; font-weight: 600;">Seamless Design</p>
        <p style="margin: 0; font-size: 13px; color: #4b5563;">Manage your entire travel ecosystem from a minimalist dashboard customized just for you.</p>
      </div>
      <div class="action-area">
        <a href="\${this.configService.get("CLIENT_URL")}/search" class="btn">Discover Destinations</a>
      </div>
    \`;
    await this.sendEmail(
      email,
      "Welcome to Flybeth",
      this.resendService.brandWrapper(title, content),
    );`);

fs.writeFileSync(path, content, 'utf8');
