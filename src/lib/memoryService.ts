import TokenManager from '../auth/TokenManager';
import AppConfig from '../config/AppConfig';

// Use centralized configuration for API URL - lazy loaded
const getApiUrl = () => {
  try {
    // Get the base URL without the /journal suffix
    const baseUrl = AppConfig.apiUrl.replace('/journal', '');
    return `${baseUrl}/core`;
  } catch (error) {
    console.warn('[memoryService] AppConfig not ready, using fallback URL');
    return 'http://localhost:3000/core';
  }
};

interface MemoryMetadata {
  summary?: string;
  [key: string]: unknown;
}

export interface Memory {
  id: string;
  title: string;
  content: string;
  type?: 'summary' | 'full';
  tags?: string[];
  source?: string;
  sourceEntryId?: string;
  metadata?: MemoryMetadata;
  starred?: boolean;
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryListParams {
  type?: 'summary' | 'full';
  tags?: string[];
  source?: string;
  sourceEntryId?: string;
  includeArchived?: boolean;
  onlyStarred?: boolean;
  limit?: number;
  offset?: number;
}

class MemoryService {
  async getMemories(params: MemoryListParams = {}): Promise<Memory[]> {
    // Force reload token from storage in case it was lost on refresh
    TokenManager.reload();
    const token = TokenManager.getToken();
    
    console.log('[memoryService] Token debug info:', TokenManager.getDebugInfo());
    
    if (!token) {
      console.error('[memoryService] No authentication token found');
      throw new Error('Authentication required');
    }

    const queryParams = new URLSearchParams();
    if (params.type) queryParams.append('type', params.type);
    if (params.tags) params.tags.forEach(tag => queryParams.append('tags', tag));
    if (params.source) queryParams.append('source', params.source);
    if (params.sourceEntryId) queryParams.append('sourceEntryId', params.sourceEntryId);
    if (params.includeArchived !== undefined) queryParams.append('includeArchived', params.includeArchived.toString());
    if (params.onlyStarred !== undefined) queryParams.append('onlyStarred', params.onlyStarred.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    const url = `${getApiUrl()}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  async createMemory(memoryData: {
    title: string;
    content: string;
    type?: 'summary' | 'full';
    tags?: string[];
    source?: string;
    sourceEntryId?: string;
    metadata?: MemoryMetadata;
  }): Promise<Memory> {
    const token = TokenManager.getToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(getApiUrl(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(memoryData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  async updateMemory(id: string, updates: {
    title?: string;
    content?: string;
    tags?: string[];
    starred?: boolean;
    archived?: boolean;
    metadata?: MemoryMetadata;
  }): Promise<Memory> {
    const token = TokenManager.getToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${getApiUrl()}/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  async deleteMemory(id: string): Promise<void> {
    const token = TokenManager.getToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${getApiUrl()}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }
}

export default new MemoryService();

