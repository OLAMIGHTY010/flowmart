export const templates: Record<string, string> = {
  'delivery-confirmation': `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px; }
    .container { max-width: 600px; background: #ffffff; padding: 30px; border-radius: 8px; margin: auto; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .success-icon { text-align: center; font-size: 48px; margin-bottom: 10px; }
    .footer { font-size: 12px; color: #64748b; text-align: center; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="success-icon">✅</div>
    <h2 style="text-align: center; color: #10b981;">Delivery Successful</h2>
    <p>Hello {{fullName}},</p>
    <p>This is a digital receipt confirming that your order <strong>#{{orderId}}</strong> has been successfully delivered and your secure PIN was verified by the rider.</p>
    <p>Thank you for using FlowMart! Enjoy the rest of the business program.</p>
    
    <div class="footer">
      <p>&copy; 2026 FlowMart Logistics.</p>
    </div>
  </div>
</body>
</html>
`,
  'order-receipt': `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px; }
    .container { max-width: 600px; background: #ffffff; padding: 30px; border-radius: 8px; margin: auto; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { text-align: center; border-bottom: 2px solid #edf2f7; padding-bottom: 20px; margin-bottom: 20px; }
    .pin-box { background: #1e293b; color: #10b981; text-align: center; padding: 25px; font-size: 40px; letter-spacing: 8px; font-weight: bold; margin: 20px 0; border-radius: 8px; }
    .order-details { width: 100%; border-collapse: collapse; margin-top: 20px; }
    .order-details th, .order-details td { padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: left; }
    .total-row { font-weight: bold; font-size: 18px; }
    .footer { font-size: 12px; color: #64748b; text-align: center; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Order Confirmed!</h2>
      <p style="color: #64748b;">Order ID: {{orderId}}</p>
    </div>
    <p>Hello {{fullName}},</p>
    <p>Your order has been placed successfully and is being prepared. When your dispatch rider arrives at your zone, you <strong>must</strong> provide them with the following Delivery PIN to receive your items:</p>
    
    <div class="pin-box">{{deliveryPin}}</div>
    
    <h3>Order Summary</h3>
    <table class="order-details">
      <tr>
        <th>Item</th>
        <th>Qty</th>
        <th>Price</th>
      </tr>
      {{#each items}}
      <tr>
        <td>{{this.name}}</td>
        <td>{{this.quantity}}</td>
        <td>₦{{this.price}}</td>
      </tr>
      {{/each}}
      <tr class="total-row">
        <td colspan="2" style="text-align: right;">Total:</td>
        <td>₦{{totalAmount}}</td>
      </tr>
    </table>
    
    <div class="footer">
      <p>Keep this PIN secure. Do not share it until the rider hands you your items.</p>
    </div>
  </div>
</body>
</html>
`,
  'otp-verification': `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px; }
    .container { max-width: 600px; background: #ffffff; padding: 30px; border-radius: 8px; margin: auto; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { text-align: center; color: #2c3e50; border-bottom: 2px solid #edf2f7; padding-bottom: 20px; margin-bottom: 20px; }
    .otp-box { background: #f8fafc; border: 1px dashed #cbd5e1; text-align: center; padding: 20px; font-size: 32px; letter-spacing: 5px; font-weight: bold; color: #0f172a; margin: 30px 0; border-radius: 8px; }
    .footer { font-size: 12px; color: #64748b; text-align: center; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>FlowMart Verification</h2>
    </div>
    <p>Hello {{fullName}},</p>
    <p>Thank you for registering on FlowMart. To securely activate your account, please use the 6-digit One-Time Password (OTP) below:</p>
    
    <div class="otp-box">{{otp}}</div>
    
    <p><em>This code will expire in 10 minutes.</em> If you did not request this, please ignore this email.</p>
    
    <div class="footer">
      <p>&copy; 2026 FlowMart Logistics. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`,
  'password-reset': `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px; }
    .container { max-width: 600px; background: #ffffff; padding: 30px; border-radius: 8px; margin: auto; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .btn { display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .footer { font-size: 12px; color: #64748b; text-align: center; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Password Reset Request</h2>
    <p>Hello {{fullName}},</p>
    <p>We received a request to reset your FlowMart password. Click the secure button below to choose a new password:</p>
    
    <div style="text-align: center;">
      <a href="{{resetLink}}" class="btn">Reset My Password</a>
    </div>
    
    <p>If you did not request a password reset, please ignore this email or contact support if you feel your account is at risk.</p>
    
    <div class="footer">
      <p>&copy; 2026 FlowMart Logistics. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`,
  'staff-onboarding': `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to FlowMart</title>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9f9f9; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { background-color: #164a28; padding: 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .content h2 { color: #164a28; margin-top: 0; }
    .credential-box { background-color: #eafbea; border-left: 4px solid #164a28; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0; }
    .credential-box p { margin: 5px 0; font-family: monospace; font-size: 16px; }
    .button-container { text-align: center; margin: 30px 0; }
    .button { background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block; }
    .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>FlowMart Logistics</h1>
    </div>
    <div class="content">
      <h2>Welcome to the Team, {{fullName}}!</h2>
      <p>An administrative account has been successfully created for you on the FlowMart platform.</p>
      <p>You have been assigned the system role of: <strong>{{role}}</strong></p>
      
      <div class="credential-box">
        <p><strong>Your Temporary Password:</strong></p>
        <p style="font-size: 20px; font-weight: bold; color: #164a28;">{{tempPassword}}</p>
      </div>
      
      <p>Please log in using your email address and this temporary password. For security reasons, you will be required to change this password immediately upon your first login.</p>
      
      <div class="button-container">
        <a href="{{loginUrl}}" class="button">Access Admin Portal</a>
      </div>
      
      <p>If you have any questions or require assistance, please contact the IT support desk.</p>
      
      <p>Best regards,<br>The FlowMart Team</p>
    </div>
    <div class="footer">
      &copy; 2026 FlowMart Logistics. All rights reserved.<br>
      This is an automated administrative email.
    </div>
  </div>
</body>
</html>
`,
  'vendor-out-of-stock': `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #fef2f2; margin: 0; padding: 20px; }
    .container { max-width: 600px; background: #ffffff; padding: 30px; border-radius: 8px; margin: auto; border-top: 5px solid #ef4444; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .footer { font-size: 12px; color: #64748b; text-align: center; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <h2 style="color: #ef4444;">🚨 Out of Stock Alert</h2>
    <p>Hello {{vendorName}},</p>
    <p>A recent order has completely depleted your inventory for the following item:</p>
    
    <h3 style="background: #f8fafc; padding: 15px; border-radius: 4px; text-align: center;">{{productName}}</h3>
    
    <p>This item will no longer appear to users on the FlowMart app. If you have restocked, please log in to your Vendor Dashboard immediately to update your inventory quantity and resume sales.</p>
    
    <div class="footer">
      <p>Automated Vendor Alert • FlowMart Logistics</p>
    </div>
  </div>
</body>
</html>
`,
  'welcome-email': `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px; }
    .container { max-width: 600px; background: #ffffff; padding: 30px; border-radius: 8px; margin: auto; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { text-align: center; color: #2c3e50; border-bottom: 2px solid #edf2f7; padding-bottom: 20px; margin-bottom: 20px; }
    .role-badge { display: inline-block; background: #e0f2fe; color: #0284c7; padding: 5px 10px; border-radius: 4px; font-weight: bold; text-transform: uppercase; font-size: 14px; }
    .footer { font-size: 12px; color: #64748b; text-align: center; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Welcome to FlowMart!</h2>
    </div>
    <p>Hello {{fullName}},</p>
    <p>Your account has been successfully verified. We are thrilled to have you on the official logistics and commerce platform for the Redemption Business.</p>
    <p>You are registered with the following access level: <span class="role-badge">{{role}}</span></p>
    <p>You can now log in to the app to start exploring the marketplace, managing orders, or tracking welfare distributions.</p>
    
    <div class="footer">
      <p>&copy; 2026 FlowMart Logistics. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`,
  'welfare-allocation': `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px; }
    .container { max-width: 600px; background: #ffffff; padding: 30px; border-radius: 8px; margin: auto; border-top: 5px solid #8b5cf6; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .metric { background: #f5f3ff; color: #6d28d9; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; border-radius: 6px; margin: 20px 0; }
    .footer { font-size: 12px; color: #64748b; text-align: center; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>📦 New Welfare Allocation</h2>
    <p>Hello {{coordinatorName}},</p>
    <p>Business Logistics Command has just assigned a new allocation of welfare items to your zone.</p>
    
    <div style="margin: 20px 0; line-height: 1.6;">
      <strong>Event:</strong> {{eventName}}<br>
      <strong>Target Zone:</strong> {{zoneId}}<br>
    </div>
    
    <div class="metric">
      {{totalItems}} Items Allocated
    </div>
    
    <p>Please log in to your Zone Coordinator Dashboard to acknowledge receipt and begin logging distributions to users.</p>
    
    <div class="footer">
      <p>FlowMart Welfare Distribution System</p>
    </div>
  </div>
</body>
</html>
`,
};
