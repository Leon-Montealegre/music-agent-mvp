// Base URL for your Express API
const API_BASE_URL = 'http://localhost:3001';

/**
 * Fetch all releases from the API
 * Returns an array of release objects sorted by date (newest first)
 */
export async function fetchReleases() {
  try {
    const response = await fetch(`${API_BASE_URL}/releases/`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Raw API Response:', data); // Debug
    console.log('Type:', typeof data); // Debug
    console.log('Is Array?', Array.isArray(data)); // Debug
    
    // Handle different response formats
    if (Array.isArray(data)) {
      // Direct array: [...]
      return data;
    } else if (data && Array.isArray(data.releases)) {
      // Wrapped in object: { releases: [...] }
      console.log('Found releases array in object wrapper');
      return data.releases;
    } else if (data && typeof data === 'object') {
      // Some other object format - try to find an array property
      const firstKey = Object.keys(data)[0];
      if (Array.isArray(data[firstKey])) {
        console.log(`Found array at key: ${firstKey}`);
        return data[firstKey];
      }
    }
    
    // If we get here, we couldn't find an array
    console.error('Could not find array in response:', data);
    return [];
  } catch (error) {
    console.error('Error fetching releases:', error);
    throw error;
  }
}

/**
 * Fetch a single release by its releaseId
 * @param {string} releaseId - The release ID (e.g., "2026-02-07_ArtistName_TrackTitle")
 */
export async function fetchRelease(releaseId) {
  try {
    const response = await fetch(`${API_BASE_URL}/releases/${releaseId}/`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching release ${releaseId}:`, error);
    throw error;
  }
}

/**
 * Update distribution tracking for a release
 * @param {string} releaseId - The release ID
 * @param {string} path - Distribution path: "release", "submit", or "promote"
 * @param {object} entry - The data to add (e.g., platform upload or label submission)
 */
export async function updateDistribution(releaseId, path, entry) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/releases/${releaseId}/distribution`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path, entry }),
      }
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error updating distribution for ${releaseId}:`, error);
    throw error;
  }
}

/**
 * Check if the Express API is running
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API health check failed:', error);
    return { status: 'error', message: 'Cannot connect to API' };
  }
}