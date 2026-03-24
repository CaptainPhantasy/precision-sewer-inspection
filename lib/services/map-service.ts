/**
 * Map Service
 * Retrieves municipal sewer maps for Indianapolis properties.
 * Primary: MapIndy screenshot via headless browser.
 * Fallback: Graceful degradation (null result, report generates without map).
 */

import { logger } from "@/lib/logger";
import { uploadBuffer } from "@/lib/s3";

export interface MapResult {
  success: boolean;
  mapImageUrl?: string;
  mapCloudPath?: string;
  source?: "mapindy" | "static" | "manual";
  error?: string;
}

const MAPINDY_BASE_URL = "https://maps.indy.gov/MapIndy/";

class MapService {
  /**
   * Get a sewer map image for a property address.
   * Attempts MapIndy screenshot first, falls back gracefully.
   */
  async getSewerMap(
    address: string,
    city: string,
    state: string
  ): Promise<MapResult> {
    // Only attempt for Indianapolis/Marion County properties
    if (!this.isIndianapolisArea(city, state)) {
      return {
        success: false,
        error: "Municipal sewer map only available for Indianapolis/Marion County properties",
      };
    }

    try {
      // Attempt MapIndy screenshot
      const result = await this.screenshotMapIndy(address, city, state);
      if (result.success) return result;

      // Fallback: return null gracefully
      logger.info("MapIndy screenshot unavailable, proceeding without map", { address });
      return {
        success: false,
        error: "Municipal sewer map temporarily unavailable",
      };
    } catch (error) {
      logger.error("Map service failed", { error, address });
      return {
        success: false,
        error: "Failed to retrieve municipal sewer map",
      };
    }
  }

  /**
   * Screenshot MapIndy with sewer layer enabled.
   *
   * NOTE: This requires a headless browser (Puppeteer).
   * Implementation options:
   * 1. Puppeteer in a separate Lambda/microservice
   * 2. Screenshot API service (ScreenshotOne, Urlbox)
   * 3. AbacusAI browser automation
   *
   * For now, this is a placeholder that returns null.
   * The report template handles missing maps gracefully.
   */
  private async screenshotMapIndy(
    address: string,
    city: string,
    state: string
  ): Promise<MapResult> {
    // TODO: Implement headless browser screenshot
    // The MapIndy URL accepts address search via the UI
    // Steps would be:
    // 1. Navigate to MAPINDY_BASE_URL
    // 2. Enter address in search box
    // 3. Wait for map to load
    // 4. Enable "Sanitary Sewer" layer
    // 5. Screenshot the viewport
    // 6. Upload to S3

    logger.info("MapIndy screenshot not yet implemented", { address, city, state });
    return {
      success: false,
      error: "MapIndy screenshot integration pending",
    };
  }

  /**
   * Check if address is in the Indianapolis/Marion County area.
   */
  private isIndianapolisArea(city: string, state: string): boolean {
    const normalizedCity = city.toLowerCase().trim();
    const normalizedState = state.toLowerCase().trim();

    if (normalizedState !== "in" && normalizedState !== "indiana") return false;

    const indyAreas = [
      "indianapolis",
      "beech grove",
      "lawrence",
      "speedway",
      "southport",
      "cumberland",
      "clermont",
      "brownsburg",
      "avon",
      "plainfield",
      "greenwood",
      "carmel",
      "fishers",
      "noblesville",
      "westfield",
      "zionsville",
    ];

    return indyAreas.some((area) => normalizedCity.includes(area));
  }

  /**
   * Get the MapIndy URL for manual access.
   * Useful as a fallback link in the report.
   */
  getMapIndyUrl(): string {
    return MAPINDY_BASE_URL;
  }
}

export const mapService = new MapService();
export { MapService };
