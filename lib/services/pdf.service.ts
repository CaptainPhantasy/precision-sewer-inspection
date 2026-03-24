/**
 * PDF Generation Service — AbacusAI Implementation
 * Consolidates duplicated PDF logic from generate-report and approve routes.
 * Implements IPDFService so it can be swapped for Puppeteer/Browserless at Vercel cutover.
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

class AbacusAIPDFService implements IPDFService {
  private apiBase = "https://apps.abacus.ai/api";
  private maxAttempts = 120;
  private pollIntervalMs = 1000;

  async generatePDF(
    html: string,
    options?: PDFGenerationOptions
  ): Promise<PDFResult> {
    const deploymentToken = process.env.ABACUSAI_API_KEY;
    if (!deploymentToken) {
      return { success: false, error: "ABACUSAI_API_KEY not configured" };
    }

    const merged = { ...DEFAULT_OPTIONS, ...options };

    try {
      // Step 1: Create the PDF generation request
      const createResponse = await fetch(
        `${this.apiBase}/createConvertHtmlToPdfRequest`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deployment_token: deploymentToken,
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

      const { request_id } = await createResponse.json();
      if (!request_id) {
        return { success: false, error: "No request ID returned from PDF API" };
      }

      // Step 2: Poll for completion
      let attempts = 0;
      while (attempts < this.maxAttempts) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.pollIntervalMs)
        );

        const statusResponse = await fetch(
          `${this.apiBase}/getConvertHtmlToPdfStatus`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              request_id,
              deployment_token: deploymentToken,
            }),
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
          if (result?.result) {
            const buffer = Buffer.from(result.result, "base64");
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

export const pdfService: IPDFService = new AbacusAIPDFService();
