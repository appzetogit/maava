/**
 * Google Maps API Key Utility
 * Fetches API key from backend database instead of .env file
 */

let cachedApiKey = null;
let apiKeyPromise = null;
let lastFailureTimestamp = 0;
const RETRY_COOLDOWN_MS = 30000; // Wait 30s before retrying after a failure

/**
 * Get Google Maps API Key from backend
 * Uses caching to avoid multiple requests
 * @returns {Promise<string>} Google Maps API Key
 */
export async function getGoogleMapsApiKey() {
  // Return cached key if available
  if (cachedApiKey) {
    return cachedApiKey;
  }

  // Return existing promise if already fetching
  if (apiKeyPromise) {
    return apiKeyPromise;
  }

  // Check cooldown after failure
  const now = Date.now();
  if (now - lastFailureTimestamp < RETRY_COOLDOWN_MS) {
    console.debug(`⏳ Google Maps API key fetch throttled due to recent failure. Retrying in ${Math.round((RETRY_COOLDOWN_MS - (now - lastFailureTimestamp)) / 1000)}s`);
    return '';
  }

  // Fetch from backend
  apiKeyPromise = (async () => {
    try {
      const { adminAPI } = await import('../api/index.js');
      const response = await adminAPI.getPublicEnvVariables();

      if (response.data.success && response.data.data?.VITE_GOOGLE_MAPS_API_KEY) {
        cachedApiKey = response.data.data.VITE_GOOGLE_MAPS_API_KEY;
        lastFailureTimestamp = 0; // Reset failure timestamp on success
        return cachedApiKey;
      }

      // No fallback - return empty if not in database
      console.warn('⚠️ Google Maps API key not found in database. Please set it in Admin → System → Environment Variables');
      lastFailureTimestamp = Date.now();
      return '';
    } catch (error) {
      console.warn('Failed to fetch Google Maps API key from backend:', error.message);
      lastFailureTimestamp = Date.now();
      // No fallback - return empty on error
      return '';
    } finally {
      apiKeyPromise = null;
    }
  })();

  return apiKeyPromise;
}

/**
 * Clear cached API key (call after updating in admin panel)
 */
export function clearGoogleMapsApiKeyCache() {
  cachedApiKey = null;
  apiKeyPromise = null;
}

