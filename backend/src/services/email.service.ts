import nodemailer, { Transporter } from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';
import handlebars from 'handlebars';

// Define Types for our Template Payloads
interface OTPData {
  fullName: string;
  otp: string;
}

interface WelcomeData {
  fullName: string;
  role: string;
}

interface PasswordResetData {
  fullName: string;
  resetLink: string; // or just the token, depending on your frontend setup
}

interface OrderReceiptData {
  fullName: string;
  orderId: string;
  totalAmount: string;
  deliveryPin: string;
  items?: { name: string; quantity: number; price: string }[];
}

interface DeliveryConfirmationData {
  fullName: string;
  orderId: string;
}

interface OutOfStockData {
  vendorName: string;
  productName: string;
}

interface WelfareAllocationData {
  coordinatorName: string;
  zoneId: string;
  eventName: string;
  totalItems: number;
}

class EmailService {
  private transporter: Transporter;
  private fromEmail: string;

  constructor() {
    // 1. Transporter Setup
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_PORT === '465', // true for port 465, false for others
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    this.fromEmail = process.env.EMAIL_FROM || '"FlowMart Logistics" <noreply@flowmart.com>';

    // Verify connection in development
    this.verifyConnection();
  }

  private async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('📧 SMTP Transporter is ready to send emails.');
    } catch (error) {
      console.error('📧 SMTP Connection Error:', error);
    }
  }

  // 2. Template Compiler Helper
  private async compileTemplate(templateName: string, data: any): Promise<string> {
    try {
      // Path assumes the code is running from the root/dist or root/src depending on setup
      // Going up one level from 'services' to reach 'templates'
      const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.html`);
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      
      const compiledTemplate = handlebars.compile(templateContent);
      return compiledTemplate(data);
    } catch (error) {
      console.error(`Error compiling template: ${templateName}`, error);
      throw new Error('Template compilation failed');
    }
  }

  // --- 3. Specific Methods ---

  public async sendOtpEmail(email: string, data: OTPData): Promise<void> {
    const html = await this.compileTemplate('otp-verification', data);
    await this.transporter.sendMail({
      from: this.fromEmail,
      to: email,
      subject: 'Verify your FlowMart Account (OTP)',
      html,
    });
  }

  public async sendWelcomeEmail(email: string, data: WelcomeData): Promise<void> {
    const html = await this.compileTemplate('welcome-email', data);
    await this.transporter.sendMail({
      from: this.fromEmail,
      to: email,
      subject: 'Welcome to FlowMart Logistics Platform',
      html,
    });
  }

  public async sendPasswordResetEmail(email: string, data: PasswordResetData): Promise<void> {
    const html = await this.compileTemplate('password-reset', data);
    await this.transporter.sendMail({
      from: this.fromEmail,
      to: email,
      subject: 'FlowMart Password Reset Request',
      html,
    });
  }

  public async sendOrderReceiptEmail(email: string, data: OrderReceiptData): Promise<void> {
    const html = await this.compileTemplate('order-receipt', data);
    await this.transporter.sendMail({
      from: this.fromEmail,
      to: email,
      subject: `Order Receipt & Delivery PIN - ${data.orderId.substring(0, 8)}`,
      html,
    });
  }

  public async sendDeliveryConfirmationEmail(email: string, data: DeliveryConfirmationData): Promise<void> {
    const html = await this.compileTemplate('delivery-confirmation', data);
    await this.transporter.sendMail({
      from: this.fromEmail,
      to: email,
      subject: `Order Delivered - ${data.orderId.substring(0, 8)}`,
      html,
    });
  }

  public async sendOutOfStockAlert(vendorEmail: string, data: OutOfStockData): Promise<void> {
    const html = await this.compileTemplate('vendor-out-of-stock', data);
    await this.transporter.sendMail({
      from: this.fromEmail,
      to: vendorEmail,
      subject: `🚨 Action Required: ${data.productName} is Out of Stock`,
      html,
    });
  }

  public async sendWelfareAllocationAlert(coordinatorEmail: string, data: WelfareAllocationData): Promise<void> {
    const html = await this.compileTemplate('welfare-allocation', data);
    await this.transporter.sendMail({
      from: this.fromEmail,
      to: coordinatorEmail,
      subject: `📦 New Welfare Allocation for ${data.zoneId}`,
      html,
    });
  }
}

// Export as a singleton
export const emailService = new EmailService();
