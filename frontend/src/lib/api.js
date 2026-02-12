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
    console.log('Raw API Response:', data);
    console.log('Type:', typeof data);
    console.log('Is Array?', Array.isArray(data));
    
    // Handle different response formats
    if (Array.isArray(data)) {
      return data;
    } else if (data && Array.isArray(data.releases)) {
      console.log('Found releases array in object wrapper');
      return data.releases;
    } else if (data && typeof data === 'object') {
      const firstKey = Object.keys(data)[0];
      if (Array.isArray(data[firstKey])) {
        console.log(`Found array at key: ${firstKey}`);
        return data[firstKey];
      }
    }
    
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
      const errorData = await response.json().catch(() => ({}));
      console.error('API error response:', errorData);
      throw new Error(`API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error updating distribution for ${releaseId}:`, error);
    throw error;
  }
}

/**
 * Delete a distribution entry
 * @param {string} releaseId - The release ID
 * @param {string} pathType - Distribution path: "release", "submit", or "promote"
 * @param {string} timestamp - The timestamp of the entry to delete
 */
export async function deleteDistributionEntry(releaseId, pathType, timestamp) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/releases/${releaseId}/distribution/${pathType}/${timestamp}`,
      { method: 'DELETE' }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete entry');
    }
    
    return response.json();
  } catch (error) {
    console.error(`Error deleting distribution entry:`, error);
    throw error;
  }
}

/**
 * Update an existing distribution entry
 * @param {string} releaseId - The release ID
 * @param {string} pathType - Distribution path: "release", "submit", or "promote"
 * @param {string} timestamp - The timestamp of the entry to update
 * @param {object} updatedData - The updated data
 */
export async function updateDistributionEntry(releaseId, pathType, timestamp, updatedData) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/releases/${releaseId}/distribution/${pathType}/${timestamp}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update entry');
    }
    
    return response.json();
  } catch (error) {
    console.error(`Error updating distribution entry:`, error);
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
/**
 * Delete an entire release
 * @param {string} releaseId - The release ID to delete
 */
export async function deleteRelease(releaseId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/releases/${releaseId}`,
      { method: 'DELETE' }
    )
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete release')
    }
    
    return response.json()
  } catch (error) {
    console.error(`Error deleting release:`, error)
    throw error
  }
}
