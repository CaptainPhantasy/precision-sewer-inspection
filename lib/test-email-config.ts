import { z } from "zod";

interface EmailTransportConfig {
  host: string;
  port: number;
  secure: boolean;
  auth?: { user: string; pass: string | undefined };
}

export interface EmailDeliveryConfig {
  testRecipient?: string;
  transport: EmailTransportConfig;
}

/** Validate test isolation before creating a transport or sending any message. */
export function getEmailDeliveryConfig(
  env: Record<string, string | undefined> = process.env
): EmailDeliveryConfig {
  if (env.PSI_TEST_MODE !== "true") {
    // Keep the existing production SMTP defaults unchanged.
    return {
      transport: {
        host: env.SMTP_HOST || "smtp.hostinger.com",
        port: Number(env.SMTP_PORT) || 465,
        secure: true,
        auth: {
          user: env.SMTP_USER || "noreply@precisionsewerinspections.com",
          pass: env.SMTP_PASSWORD,
        },
      },
    };
  }

  const recipient = env.PSI_TEST_EMAIL_RECIPIENT;
  if (!recipient || !z.string().email().safeParse(recipient).success) {
    throw new Error("PSI_TEST_EMAIL_RECIPIENT must be one valid email address in test mode");
  }

  const host = env.SMTP_HOST?.trim();
  if (!host) {
    throw new Error("SMTP_HOST must be explicitly configured in test mode");
  }

  const port = env.SMTP_PORT ? Number(env.SMTP_PORT) : 465;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_PORT must be an integer between 1 and 65535 in test mode");
  }

  if (env.SMTP_SECURE && env.SMTP_SECURE !== "true" && env.SMTP_SECURE !== "false") {
    throw new Error("SMTP_SECURE must be true or false in test mode");
  }

  const user = env.SMTP_USER?.trim();
  const pass = env.SMTP_PASSWORD;
  if (Boolean(user) !== Boolean(pass)) {
    throw new Error("SMTP_USER and SMTP_PASSWORD must both be provided or both be absent in test mode");
  }

  return {
    testRecipient: recipient,
    transport: {
      host,
      port,
      secure: env.SMTP_SECURE !== "false",
      ...(user && pass ? { auth: { user, pass } } : {}),
    },
  };
}
