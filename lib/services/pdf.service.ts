/**
 * PDF Generation Service
 * Consolidates PDF logic from generate-report and approve routes.
 *
 * ARCHITECTURE NOTE:
 * The Abacus.AI HTML-to-PDF API is no longer available post-cutover.
 * This needs a serverless replacement (Puppeteer on Lambda, Browserless.io,
 * or Vercel Edge + rendering service). For now, this returns a clear error
 * so the report pipeline can handle the failure gracefully.
 *
 * TODO: Implement serverless PDF generation via:
 *   - AWS Lambda with Puppeteer/Playwright
 *   - Browserless.io hosted API
 *   - Vercel Edge + external rendering service
 */

import {
  IPDFService,
  PDFGenerationOptions,
  PDFResult,
} from "./interfaces/pdf.interface";

const DEFAULT_OPTIONS: PDFGenerationOptions = {
  format: "A4",
  margin: { top: "20mm", right: "20mm", bottom: "20mm", left: "20mm" },
  printBackground: true,
};

class ServerlessPDFService implements IPDFService {
  private maxAttempts = 120;
  private pollIntervalMs = 1000;

  async generatePDF(
    html: string,
    options?: PDFGenerationOptions
  ): Promise<PDFResult> {
    const pdfApiUrl = process.env.PDF_API_URL;

    if (!pdfApiUrl) {
      return {
        success: false,
        error: "PDF generation not configured — PDF_API_URL env var missing. Implement serverless PDF generation (Puppeteer/Browserless).",
      };
    }

    const merged = { ...DEFAULT_OPTIONS, ...options };

    try {
      // Generic serverless PDF API pattern
      const createResponse = await fetch(
        `${pdfApiUrl}/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            html_content: html,
            pdf_options: {
              format: merged.format,
              margin: merged.margin,
              print_background: merged.printBackground,
              landscape: merged.landscape,
            },
          }),
        }
      );

      if (!createResponse.ok) {
        const errorBody = await createResponse
          .json()
          .catch(() => ({ error: "Failed to create PDF request" }));
        console.error("PDF creation error:", errorBody);
        return {
          success: false,
          error: errorBody?.error || "Failed to create PDF request",
        };
      }

      // If the API returns PDF directly
      if (createResponse.headers.get("content-type")?.includes("application/pdf")) {
        const buffer = Buffer.from(await createResponse.arrayBuffer());
        return { success: true, buffer };
      }

      // If the API returns a job ID (async pattern)
      const { request_id } = await createResponse.json();
      if (!request_id) {
        return { success: false, error: "No request ID returned from PDF API" };
      }

      // Poll for completion
      let attempts = 0;
      while (attempts < this.maxAttempts) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.pollIntervalMs)
        );

        const statusResponse = await fetch(
          `${pdfApiUrl}/status`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ request_id }),
          }
        );

        const statusResult = await statusResponse.json().catch(() => null);
        if (!statusResult) {
          attempts++;
          continue;
        }

        const status = statusResult?.status || "PENDING";
        const result = statusResult?.result || null;

        if (status === "SUCCESS") {
          if (result?.pdf_base64) {
            const buffer = Buffer.from(result.pdf_base64, "base64");
            return { success: true, buffer };
          }
          return {
            success: false,
            error: "PDF generation completed but no result data",
          };
        }

        if (status === "FAILED") {
          const errorMsg = result?.error || "PDF generation failed";
          console.error("PDF generation failed:", errorMsg);
          return { success: false, error: errorMsg };
        }

        attempts++;
      }

      return { success: false, error: "PDF generation timed out" };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown PDF generation error";
      console.error("PDF service error:", message);
      return { success: false, error: message };
    }
  }
}

export const pdfService: IPDFService = new ServerlessPDFService();
