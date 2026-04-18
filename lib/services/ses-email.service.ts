/**
 * AWS SES Email Service
 * Handles email delivery via Amazon SES (Simple Email Service)
 * Uses @aws-sdk/client-sesv2 for SES v2 API
 */

import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { logger } from "@/lib/logger";
import { AppError, ErrorCode } from "@/lib/errors";

// Initialize SES client
const sesClient = new SESv2Client({
  region: process.env.AWS_REGION || "us-east-1",
});

// Sender email address (must be verified in SES)
const SENDER_EMAIL = process.env.SES_SENDER_EMAIL || "noreply@precisionsewerinspections.com";

// Request timeout
const REQUEST_TIMEOUT = 30000; // 30 seconds

interface EmailRecipient {
  address: string;
  name?: string;
}

interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

interface SendEmailOptions {
  to: EmailRecipient | EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  subject: string;
  htmlBody: string;
  textBody?: string;
  attachments?: EmailAttachment[];
  replyTo?: string;
}

interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp?: string;
}

class SESEmailService {
  /**
   * Send an email via SES
   */
  async sendEmail(options: SendEmailOptions): Promise<EmailResponse> {
    try {
      logger.info(
        `[SES] Sending email to ${
          Array.isArray(options.to)
            ? options.to.map((r) => r.address).join(", ")
            : options.to.address
        }`
      );

      // Normalize recipients
      const toList = Array.isArray(options.to) ? options.to : [options.to];
      const ccList = options.cc || [];
      const bccList = options.bcc || [];

      // Format recipient addresses
      const formatRecipient = (r: EmailRecipient) =>
        r.name ? `${r.name} <${r.address}>` : r.address;

      // Send email using SESv2
      const command = new SendEmailCommand({
        FromEmailAddress: SENDER_EMAIL,
        Destination: {
          ToAddresses: toList.map((r) => r.address),
          CcAddresses: ccList.length > 0 ? ccList.map((r) => r.address) : undefined,
          BccAddresses: bccList.length > 0 ? bccList.map((r) => r.address) : undefined,
        },
        Content: {
          Simple: {
            Subject: {
              Data: options.subject,
              Charset: "UTF-8",
            },
            Body: {
              Html: {
                Data: options.htmlBody,
                Charset: "UTF-8",
              },
              Text: options.textBody
                ? {
                    Data: options.textBody,
                    Charset: "UTF-8",
                  }
                : undefined,
            },
          },
        },
        ReplyToAddresses: options.replyTo ? [options.replyTo] : undefined,
        // Note: Attachments in SESv2 require Raw email format which is more complex
        // For now, consider this limitation and add support in future iteration
      });

      const response = await sesClient.send(command);

      logger.info(`[SES] Email sent successfully. MessageId: ${response.MessageId}`);

      return {
        success: true,
        messageId: response.MessageId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(`[SES] Error sending email: ${errorMessage}`);

      // Log specific SES errors
      if (error instanceof Error && error.name === "ValidationError") {
        logger.error("[SES] Validation error - check email addresses and configuration");
      }

      return {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Send inspection report to client
   */
  async sendInspectionReport(
    clientEmail: string,
    clientName: string,
    reportContent: string,
    inspectionAddress: string,
    reportDate: string
  ): Promise<EmailResponse> {
    const subject = `Sewer Inspection Report - ${inspectionAddress}`;

    const htmlBody = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background-color: #2c3e50; color: white; padding: 20px; border-radius: 5px; }
      .content { padding: 20px; background-color: #f9f9f9; margin: 20px 0; border-radius: 5px; }
      .footer { font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Precision Sewer Inspections</h1>
        <p>Official Inspection Report</p>
      </div>
      
      <p>Dear ${clientName},</p>
      
      <p>Thank you for choosing Precision Sewer Inspections. Your sewer line inspection report for <strong>${inspectionAddress}</strong> is ready.</p>
      
      <div class="content">
        <h2>Inspection Report Summary</h2>
        <p>Date of Inspection: ${reportDate}</p>
        ${reportContent}
      </div>
      
      <p>If you have any questions about this report, please don't hesitate to contact us.</p>
      
      <div class="footer">
        <p>
          Precision Sewer Inspections<br>
          Indianapolis, IN<br>
          <a href="https://precisionsewerinspections.com">Visit our website</a>
        </p>
      </div>
    </div>
  </body>
</html>
    `;

    const textBody = `
Precision Sewer Inspections
Official Inspection Report

Dear ${clientName},

Thank you for choosing Precision Sewer Inspections. Your sewer line inspection report for ${inspectionAddress} is ready.

Inspection Report Summary
Date of Inspection: ${reportDate}

${reportContent}

If you have any questions about this report, please don't hesitate to contact us.

Precision Sewer Inspections
Indianapolis, IN
    `;

    return this.sendEmail({
      to: {
        address: clientEmail,
        name: clientName,
      },
      subject,
      htmlBody,
      textBody,
      replyTo: process.env.SES_REPLY_TO_EMAIL || SENDER_EMAIL,
    });
  }

  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmation(
    clientEmail: string,
    clientName: string,
    inspectionDate: string,
    inspectionAddress: string,
    bookingReference: string
  ): Promise<EmailResponse> {
    const subject = `Booking Confirmation - Sewer Inspection Scheduled`;

    const htmlBody = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
  </head>
  <body>
    <h1>Booking Confirmation</h1>
    <p>Dear ${clientName},</p>
    <p>Your sewer inspection has been scheduled!</p>
    
    <h2>Appointment Details</h2>
    <ul>
      <li><strong>Date & Time:</strong> ${inspectionDate}</li>
      <li><strong>Address:</strong> ${inspectionAddress}</li>
      <li><strong>Booking Reference:</strong> ${bookingReference}</li>
    </ul>
    
    <p>Our technician will arrive within the scheduled window. Please ensure access to the sewer clean-out.</p>
    
    <p>If you need to reschedule or have questions, please reply to this email or call us.</p>
  </body>
</html>
    `;

    return this.sendEmail({
      to: {
        address: clientEmail,
        name: clientName,
      },
      subject,
      htmlBody,
      replyTo: process.env.SES_REPLY_TO_EMAIL || SENDER_EMAIL,
    });
  }

  /**
   * Send administrative notification (internal)
   */
  async sendAdminNotification(
    subject: string,
    message: string,
    adminEmails?: string[]
  ): Promise<EmailResponse> {
    const recipients = (adminEmails || [process.env.ADMIN_EMAIL || ""]
    ).filter((email) => email.length > 0);

    if (recipients.length === 0) {
      return {
        success: false,
        error: "No admin email addresses configured",
      };
    }

    return this.sendEmail({
      to: recipients.map((email) => ({ address: email })),
      subject: `[PSI Admin] ${subject}`,
      htmlBody: `<pre>${message}</pre>`,
      textBody: message,
    });
  }

  /**
   * Health check: verify SES connectivity
   */
  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    try {
      // Try to send a test email (will fail if SES not configured)
      const response = await this.sendEmail({
        to: { address: SENDER_EMAIL },
        subject: "SES Health Check",
        htmlBody: "<p>This is a test email to verify SES connectivity.</p>",
      });

      if (response.success) {
        return {
          healthy: true,
          message: `SES is accessible. Sender: ${SENDER_EMAIL}`,
        };
      } else {
        return {
          healthy: false,
          message: `SES test failed: ${response.error}`,
        };
      }
    } catch (error) {
      return {
        healthy: false,
        message: `Health check failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }
}

// Export singleton instance
export const sesEmailService = new SESEmailService();

// Type exports
export type { EmailRecipient, EmailAttachment, SendEmailOptions, EmailResponse };
