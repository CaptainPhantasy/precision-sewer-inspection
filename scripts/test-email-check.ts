import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { ADMIN_EMAILS, sendAdminNotification, sendNotificationEmail } from "../lib/notifications";
import { getEmailDeliveryConfig } from "../lib/test-email-config";

const testRecipient = "douglastalley1977@gmail.com";
const captureEnv: Record<string, string | undefined> = {
  PSI_TEST_MODE: "true",
  PSI_TEST_EMAIL_RECIPIENT: testRecipient,
  SMTP_HOST: "127.0.0.1",
  SMTP_PORT: "11025",
  SMTP_SECURE: "false",
};

function checkConfiguration() {
  assert.deepEqual(getEmailDeliveryConfig({}), {
    transport: {
      host: "smtp.hostinger.com",
      port: 465,
      secure: true,
      auth: { user: "noreply@precisionsewerinspections.com", pass: undefined },
    },
  }, "production defaults must remain unchanged");

  // Runtime-only fixture: this object exercises the mapper, never an SMTP login.
  const productionModeFixture = {
    PSI_TEST_MODE: "false",
    PSI_TEST_EMAIL_RECIPIENT: testRecipient,
    SMTP_HOST: "localhost",
    SMTP_PORT: "2465",
    SMTP_SECURE: "false",
    SMTP_USER: "test@localhost",
    SMTP_PASSWORD: randomUUID(),
  };
  assert.deepEqual(getEmailDeliveryConfig(productionModeFixture), {
    transport: {
      host: "localhost",
      port: 2465,
      secure: true,
      auth: { user: "test@localhost", pass: productionModeFixture.SMTP_PASSWORD },
    },
  }, "test routing and plaintext SMTP must not activate in production mode");

  const capture = getEmailDeliveryConfig(captureEnv);
  assert.equal(capture.testRecipient, testRecipient);
  assert.equal(capture.transport.secure, false);
  assert.equal(capture.transport.auth, undefined, "local capture must support no authentication");
  assert.equal(getEmailDeliveryConfig({ ...captureEnv, SMTP_SECURE: undefined }).transport.secure, true);

  for (const invalidRecipient of [undefined, "", "invalid", "a@example.test,b@example.test", "Name <a@example.test>", "a@example.test\r\nBcc: b@example.test"]) {
    assert.throws(() => getEmailDeliveryConfig({ ...captureEnv, PSI_TEST_EMAIL_RECIPIENT: invalidRecipient }), /PSI_TEST_EMAIL_RECIPIENT/);
  }
  assert.throws(() => getEmailDeliveryConfig({ ...captureEnv, SMTP_HOST: undefined }), /SMTP_HOST/);
  assert.throws(() => getEmailDeliveryConfig({ ...captureEnv, SMTP_USER: "a@example.test" }), /SMTP_USER and SMTP_PASSWORD/);
  const missingSmtpUser = {
    ...captureEnv,
    SMTP_PASSWORD: randomUUID(),
  };
  assert.throws(() => getEmailDeliveryConfig(missingSmtpUser), /SMTP_USER and SMTP_PASSWORD/);
  assert.throws(() => getEmailDeliveryConfig({ ...captureEnv, SMTP_PORT: "0" }), /SMTP_PORT/);
  assert.throws(() => getEmailDeliveryConfig({ ...captureEnv, SMTP_SECURE: "no" }), /SMTP_SECURE/);
  console.log("Validated production defaults and local SMTP configuration");
}

interface CapturedMessage {
  ID: string;
  Subject: string;
  To: Array<{ Address: string }>;
  Cc?: Array<{ Address: string }>;
  Bcc?: Array<{ Address: string }>;
}

async function readCapture<T>(path: string): Promise<T> {
  // Fixed loopback endpoint: this check never connects to an external mail service.
  const response = await fetch(`http://127.0.0.1:11225${path}`, {
    signal: AbortSignal.timeout(5000),
  });
  assert.ok(response.ok, `Mailpit API returned ${response.status}`);
  return response.json() as Promise<T>;
}

async function capturedFor(runTag: string) {
  const result = await readCapture<{ messages: CapturedMessage[] }>("/api/v1/messages?limit=100");
  return result.messages.filter((message) => message.Subject.includes(runTag));
}

async function checkDelivery() {
  await readCapture("/api/v1/messages?limit=1");

  // Ignore inherited SMTP credentials and destinations; all messages stay in Mailpit.
  for (const [key, value] of Object.entries(captureEnv)) process.env[key] = value;
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASSWORD;
  process.env.SMTP_FROM = "test-environment@example.test";

  const runTag = `mail-isolation-${randomUUID()}`;
  const customerMessage = {
    recipientEmail: "customer@example.test",
    recipientName: "Fictional Customer",
    subject: `${runTag} customer`,
    htmlContent: "<p>Synthetic customer notification.</p>",
    textContent: "Synthetic customer notification.",
    // Runtime callers cannot add side recipients or an alternate SMTP envelope.
    cc: "cc-recipient@example.test",
    bcc: "bcc-recipient@example.test",
    envelope: { from: "test-environment@example.test", to: "envelope-recipient@example.test" },
  };
  const customer = await sendNotificationEmail(customerMessage);
  assert.equal(customer.success, true, customer.error);

  const admins = await sendAdminNotification({
    subject: `${runTag} admin`,
    htmlContent: "<p>Synthetic admin notification.</p>",
  });
  assert.equal(admins.success, true, JSON.stringify(admins.results));
  assert.equal(admins.results.length, ADMIN_EMAILS.length);

  const expectedCount = 1 + ADMIN_EMAILS.length;
  let messages: CapturedMessage[] = [];
  for (let attempt = 0; attempt < 20; attempt++) {
    messages = await capturedFor(runTag);
    if (messages.length >= expectedCount) break;
    await delay(100);
  }
  assert.equal(messages.length, expectedCount, "Mailpit must capture customer and every admin notification");
  for (const summary of messages) {
    const message = await readCapture<CapturedMessage>(`/api/v1/message/${encodeURIComponent(summary.ID)}`);
    assert.deepEqual(message.To.map((recipient) => recipient.Address), [testRecipient]);
    assert.equal(message.Cc?.length || 0, 0, "no CC recipients may escape isolation");
    assert.equal(message.Bcc?.length || 0, 0, "no BCC/envelope recipients may escape isolation");
    assert.ok(message.Subject.startsWith("[PSI TEST] "), "all test messages must have the subject prefix");
  }
  console.log(`Validated ${expectedCount} captured customer/admin messages addressed only to ${testRecipient}`);

  delete process.env.PSI_TEST_EMAIL_RECIPIENT;
  const blocked = await sendNotificationEmail({
    ...customerMessage,
    subject: `${runTag} MUST NOT DELIVER`,
  });
  assert.equal(blocked.success, false, "missing recipient must fail even after a transporter was cached");
  assert.match(blocked.error || "", /PSI_TEST_EMAIL_RECIPIENT/);
  await delay(100);
  assert.equal((await capturedFor(runTag)).length, expectedCount, "invalid test configuration must not deliver another message");
  console.log("Validated that removing the test recipient blocks delivery with a cached transport");
}

async function main() {
  checkConfiguration();
  await checkDelivery();
  console.log("Test email checks passed. Messages are stored in local Mailpit; no external email was sent.");
}

main().catch((error) => {
  console.error("Test email check failed (requires Mailpit SMTP 11025 and HTTP 11225):", error);
  process.exitCode = 1;
});
