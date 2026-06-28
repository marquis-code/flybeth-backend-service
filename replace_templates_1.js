const fs = require('fs');
const path = '/Users/marquis/flybeth/backend/src/modules/notifications/notifications.service.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/const title = "Your Journey is Confirmed! ✈️";[\s\S]*?`Booking Confirmed: \$\{params.pnr\} - Flybeth`,/g, 
`const title = "Your Journey is Confirmed!";
    const content = \`
      <p>Hi <strong>\${params.firstName}</strong>,</p>
      <p>Your flight booking has been successfully processed and ticketed.</p>
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Booking Reference (PNR)</p>
        <p style="color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 24px 0;">\${params.pnr}</p>
        <div style="margin-bottom: 16px;">
          <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Flight Route Overview</p>
          <p style="margin: 0; color: #1f2937; font-size: 16px; font-weight: 600;">\${params.flightDetails}</p>
        </div>
        <div>
          <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Total Paid</p>
          <p style="margin: 0; color: #111827; font-size: 18px; font-weight: 700;">\${params.currency} \${params.totalAmount.toLocaleString()}</p>
        </div>
      </div>
      <div class="action-area">
        <a href="\${this.configService.get("CLIENT_URL")}/bookings/\${params.pnr}" class="btn">View Boarding Pass</a>
      </div>
      <p style="font-size: 12px; color: #6b7280; margin-top: 24px;">Please verify all passport requirements for your destination. We recommend arriving at the airport at least 3 hours prior to international departures.</p>
    \`;

    await this.sendEmail(
      params.email,
      \`Booking Confirmed: \${params.pnr} - Flybeth\`,`);


content = content.replace(/const title = "Welcome to a New Era of Travel! 🌍";[\s\S]*?`Welcome to Flybeth - Elevate Your Global Journey 🛫`,/g, 
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
      "Welcome to Flybeth - Elevate Your Global Journey",`);

content = content.replace(/const title = "Security Verification Code 🛡️";[\s\S]*?\`\$\{otp\} is your secure Flybeth sign-in code\`,/g,
`const title = "Security Verification Code";
    const content = \`
      <p>Hi <strong>\${firstName}</strong>,</p>
      <p>To secure your digital session, please use the following one-time password (OTP) to complete your authentication to Flybeth.</p>
      
      <div style="background: #f9fafb; padding: 32px 24px; text-align: center; border-radius: 8px; border: 1px dashed #d1d5db; margin: 24px 0;">
        <span style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 12px;">Verification Code</span>
        <span style="font-size: 32px; font-weight: 700; letter-spacing: 4px; color: #111827;">\${otp}</span>
      </div>
      
      <p style="font-size: 12px; color: #6b7280; margin-top: 16px;">This code expires in 10 minutes. Never share this PIN with anyone.</p>
    \`;
    await this.sendEmail(
      email,
      \`\${otp} is your secure Flybeth sign-in code\`,`);

content = content.replace(/const title = "Authentication Guard 🔒";[\s\S]*?"Password Reset Instructions - Flybeth",/g,
`const title = "Reset Your Password";
    const content = \`
      <p>Hi \${firstName},</p>
      <p>We received a request to reset the password for your Flybeth account. To proceed with setting a new credential, please click the secure link below.</p>
      
      <div class="action-area">
        <a href="\${resetUrl}" class="btn">Reset My Password</a>
      </div>
      
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; margin-top: 24px;">
        <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #4b5563;">Trouble with the button?</p>
        <p style="margin: 0; font-size: 12px; color: #0D1DAD; word-break: break-all;">\${resetUrl}</p>
      </div>

      <p style="font-size: 12px; color: #6b7280; margin-top: 24px;">If you did not request this, please ignore this message. Your account remains protected.</p>
    \`;
    await this.sendEmail(
      email,
      "Password Reset Instructions - Flybeth",`);

content = content.replace(/const title = "Welcome to the Inner Circle 🚀";[\s\S]*?"A formal B2B welcome from our CEO 💌", content\);/g,
`const title = "Welcome to the Flybeth Global Network";
    const content = \`
      <p>Dearest <strong>\${firstName}</strong>,</p>
      <p>I am thrilled to personally welcome your agency to the Flybeth Global Network. You are the bridge between explorers and the world, and we are here to amplify your brilliance.</p>
      <p>Our ecosystem is built for speed, precision, and profit. We recognize the immense value you bring, and we've built the tools to match it.</p>
      
      <div style="margin: 32px 0; background: #f9fafb; border-radius: 8px; padding: 24px; border: 1px solid #e5e7eb;">
        <p style="margin: 0 0 16px 0; font-weight: 600; font-size: 14px; text-transform: uppercase; color: #4b5563;">Commercial Advantage</p>
        <p style="margin: 0 0 4px 0; font-weight: 600; font-size: 14px;">Wholesale GDS Routing</p>
        <p style="margin: 0 0 16px 0; font-size: 13px; color: #4b5563;">Access institutional flight APIs with automated mark-up logic and negotiated global airfares.</p>
        <p style="margin: 0 0 4px 0; font-weight: 600; font-size: 14px;">Automated Clearing</p>
        <p style="margin: 0; font-size: 13px; color: #4b5563;">Transparent commission structures with direct settlement to your verified payout institution.</p>
      </div>

      <div style="margin-top: 32px;">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #4b5563;">With boundless love and excitement,</p>
        <p style="margin: 0; font-weight: 600; color: #111827;">Oluremi Oshinkoya</p>
        <p style="margin: 0; font-size: 12px; color: #6b7280;">Founder & CEO, Flybeth</p>
      </div>
    \`;

    await this.sendEmail(email, "A formal B2B welcome from our CEO", this.resendService.brandWrapper(title, content));`);

content = content.replace(/const title = "Application Under Review ⏳";[\s\S]*?"Your Flybeth B2B Profile is Under Review",/g,
`const title = "Application Under Review";
    const content = \`
      <p>Hi <strong>\${firstName}</strong>,</p>
      <p>Thank you for registering your agency. We have successfully secured your onboarding pipeline data and compliance documents.</p>
      
      <div style="background: #f9fafb; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0; border-top: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">
        <p style="color: #b45309; font-weight: 600; font-size: 12px; text-transform: uppercase; margin: 0 0 8px 0;">Internal Compliance Queue</p>
        <p style="margin: 0; color: #4b5563; font-size: 13px;">Our global compliance team is reviewing your documentation. This typically takes 24-48 hours. We will notify you once cleared for commercial operations.</p>
      </div>

      <div class="action-area">
        <a href="http://agent.flybeth.com/auth/login" class="btn">Track Application Status</a>
      </div>
    \`;
    await this.sendEmail(
      email,
      "Your Flybeth B2B Profile is Under Review",`);

content = content.replace(/const title = "Compliance Verified ✅";[\s\S]*?\`Verified: \$\{documentType\} cleared by compliance\`,/g,
`const title = "Compliance Verified";
    const content = \`
      <p>Hi <strong>\${firstName}</strong>,</p>
      <p>Excellent progression! Our compliance division has successfully authenticated and approved your <strong>\${documentType}</strong>.</p>
      
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <p style="margin: 0; color: #166534; font-size: 13px;">Your identity documents have been cleared and securely stored. This moves you closer to unrestricted transactional capabilities.</p>
      </div>
    \`;
    await this.sendEmail(
      email,
      \`Verified: \${documentType} cleared by compliance\`,`);

content = content.replace(/const title = "Document Flagged ⚠️";[\s\S]*?\`Action Required: Failed verification on \$\{documentType\}\`,/g,
`const title = "Document Flagged";
    const content = \`
      <p>Hi <strong>\${firstName}</strong>,</p>
      <p>During a routine sweep, our compliance system flagged your submitted <strong>\${documentType}</strong>. To proceed, we require a rapid correction.</p>
      
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <p style="color: #b91c1c; margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; font-weight: 600;">Assessor Feedback</p>
        <p style="margin: 0; color: #7f1d1d; font-size: 14px; font-weight: 500;">"\${feedback}"</p>
      </div>

      <div class="action-area">
        <a href="http://agent.flybeth.com/kyc" class="btn" style="background: #b91c1c;">Submit Correction</a>
      </div>
    \`;
    await this.sendEmail(
      email,
      \`Action Required: Failed verification on \${documentType}\`,`);

content = content.replace(/const title = "Deployment Authorized 🚀";[\s\S]*?"You are live! Full B2B platform unlocked.",/g,
`const title = "Deployment Authorized";
    const content = \`
      <p>Congratulations <strong>\${firstName}</strong>!</p>
      <p>Your partnership application has been rigorously analyzed and passed. <strong>Your agency is now live!</strong></p>
      
      <div style="background: #f9fafb; border: 1px dashed #d1d5db; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
        <p style="color: #4b5563; font-weight: 600; margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase;">Secure Access Key</p>
        <p style="color: #111827; font-weight: 600; font-size: 16px; margin: 0 0 8px 0;">\${email}</p>
        <p style="color: #6b7280; font-size: 12px; margin: 0;">Access initialized with your registered security credentials.</p>
      </div>
      
      <div class="action-area">
        <a href="http://agent.flybeth.com/auth/login" class="btn">Initialize Dashboard</a>
      </div>
    \`;
    await this.sendEmail(
      email,
      "You are live! Full B2B platform unlocked.",`);

content = content.replace(/const title = "Welcome to the Flybeth Team";[\s\S]*?"You've been invited to join the Flybeth Admin Team",/g,
`const title = "Welcome to the Flybeth Team";
    
    let permissionsHtml = "";
    if (permissions && permissions.length > 0) {
      permissionsHtml = \`
        <p style="color: #4b5563; font-size: 13px; margin-top: 16px; margin-bottom: 8px;">Granted Permissions:</p>
        <ul style="color: #4b5563; font-size: 13px; padding-left: 20px; margin-bottom: 0; margin-top: 0;">
          \${permissions.map(p => \`<li>\${p.replace(/_/g, ' ')}</li>\`).join('')}
        </ul>
      \`;
    }

    const content = \`
      <p>Congratulations!</p>
      <p>You have been invited to join the <strong>Flybeth Administrative Team</strong>. We are excited to bring you on board to help manage and scale our global travel operations.</p>
      
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <p style="color: #4b5563; font-weight: 600; margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase;">Invitation Details</p>
        <p style="color: #111827; font-weight: 500; font-size: 14px; margin: 0 0 4px 0;">Assigned Access Level: <span style="text-transform: capitalize;">\${role.replace('_', ' ')}</span></p>
        <p style="color: #b91c1c; font-size: 12px; margin: 0;">Expires on \${expiresAt}</p>
        \${permissionsHtml}
      </div>
      
      <div class="action-area">
        <a href="\${inviteUrl}" class="btn">Accept Invitation</a>
      </div>
      <p style="font-size: 12px; color: #6b7280; margin-top: 16px;">If you're having trouble clicking the button, copy and paste this link: <br/><br/><code style="word-break: break-all;">\${inviteUrl}</code></p>
    \`;
    await this.sendEmail(
      email,
      "You've been invited to join the Flybeth Admin Team",`);

content = content.replace(/const title = "Permissions Updated";[\s\S]*?"Your Flybeth Permissions have been updated",/g,
`const title = "Permissions Updated";
    
    let permissionsHtml = "";
    if (permissions && permissions.length > 0) {
      permissionsHtml = \`
        <ul style="color: #4b5563; font-size: 13px; padding-left: 20px; margin-bottom: 0; margin-top: 0;">
          \${permissions.map(p => \`<li>\${p.replace(/_/g, ' ')}</li>\`).join('')}
        </ul>
      \`;
    } else {
      permissionsHtml = \`<p style="color: #4b5563; font-size: 13px; margin: 0;">Your role currently has no active permissions.</p>\`;
    }

    const content = \`
      <p>Your access permissions for the role <strong>\${roleName.replace(/_/g, ' ')}</strong> have been updated by an administrator.</p>
      
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <p style="color: #4b5563; font-weight: 600; margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase;">Current Permissions</p>
        \${permissionsHtml}
      </div>
      
      <div class="action-area">
        <a href="http://admin.flybeth.com/login" class="btn">Login to Dashboard</a>
      </div>
    \`;
    
    await this.sendEmail(
      email,
      "Your Flybeth Permissions have been updated",`);

content = content.replace(/const title = "Your Invitation is Expiring Soon! ⏰";[\s\S]*?"Action Required: Your Flybeth Team Invitation is expiring soon",/g,
`const title = "Your Invitation is Expiring Soon!";
    const content = \`
      <p>Action Required</p>
      <p>This is a quick reminder that your invitation to join the <strong>Flybeth Administrative Team</strong> will expire soon.</p>
      <p>Please click the secure link below to accept the invitation and set up your administrative credentials before it expires.</p>
      
      <div class="action-area">
        <a href="\${inviteUrl}" class="btn" style="background: #b91c1c;">Accept Invitation Now</a>
      </div>
    \`;
    await this.sendEmail(
      email,
      "Action Required: Your Flybeth Team Invitation is expiring soon",`);

content = content.replace(/const title = "Incomplete Journey ⏳";[\s\S]*?\`Action Needed: Finalize your \$\{params.itemType\} before pricing resets\`,/g,
`const title = "Incomplete Journey";
    const content = \`
      <p>Hi <strong>\${params.firstName}</strong>,</p>
      <p>Our engine noticed you paused your selection for <strong>\${params.itemName}</strong>. Don't let your perfect trip slip away.</p>
      
      <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <p style="color: #b45309; font-weight: 600; margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase;">Dynamic Pricing Alert</p>
        <p style="color: #92400e; font-size: 13px; margin: 0;">We've temporarily locked this rate for you. Secure it now before it resets.</p>
      </div>
      
      <div class="action-area">
        <a href="\${params.url}" class="btn">Resume My Booking</a>
      </div>
    \`;
    await this.sendEmail(
      params.email,
      \`Action Needed: Finalize your \${params.itemType} before pricing resets\`,`);

content = content.replace(/const title = "Clearing Successful 💳";[\s\S]*?\`Ledger Receipt Confirmed - \$\{params.reference\}\`,/g,
`const title = "Payment Successful";
    const content = \`
      <p>Dear <strong>\${params.firstName}</strong>,</p>
      <p>We have securely cleared your payment request. Your transaction details are recorded below for your records.</p>
      
      <div style="background: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0; border: 1px solid #e5e7eb;">
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #4b5563; font-weight: 500;">Authorized Amount</td>
            <td style="padding: 8px 0; text-align: right; color: #111827; font-weight: 700;">\${params.currency} \${params.amount.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #4b5563; font-weight: 500;">Transaction Ref</td>
            <td style="padding: 8px 0; text-align: right; color: #111827; font-family: monospace;">\${params.reference}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #4b5563; font-weight: 500;">Booking ID (PNR)</td>
            <td style="padding: 8px 0; text-align: right; color: #111827; font-weight: 600;">\${params.pnr}</td>
          </tr>
          <tr style="border-top: 1px dashed #d1d5db;">
            <td style="padding: 16px 0 0; color: #4b5563; font-weight: 500;">Timestamp</td>
            <td style="padding: 16px 0 0; text-align: right; color: #111827;">\${new Date().toLocaleString()}</td>
          </tr>
        </table>
      </div>
    \`;

    await this.sendEmail(
      params.email,
      \`Payment Receipt Confirmed - \${params.reference}\`,`);

fs.writeFileSync(path, content, 'utf8');
