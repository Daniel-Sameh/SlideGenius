import { getCookie } from 'cookies-next';
import apiClient from './api-client';

// Use local proxy in development, and the Vercel env variable in production
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? '/api'
  : `${process.env.NEXT_PUBLIC_API_URL}/api`;

export interface GenerateSlideRequest {
  markdown_input: string;
  title: string;
  theme?: string;
}

export interface PresentationGenerationStatus {
  presentation_id: string;
  status: 'pending' | 'complete' | 'failed';
}

export interface Presentation extends PresentationGenerationStatus {
  id: string;
  title: string;
  markdown_content: string;
  html_content?: string;
  theme?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  // Legacy fields for backward compatibility
  markdown?: string;
  html?: string;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
}

class PresentationService {
  private static instance: PresentationService;
  private cache: Map<string, any> = new Map();
  private listCache: any[] | null = null;

  private constructor() {}

  public static getInstance(): PresentationService {
    if (!PresentationService.instance) {
      PresentationService.instance = new PresentationService();
    }
    return PresentationService.instance;
  }

  public async getAllByUser(): Promise<Presentation[]> {
    if (this.listCache) {
      return this.listCache;
    }
    try {
      const response = await apiClient.get<Presentation[]>('/presentations');
      this.listCache = response.data;
      return response.data;
    } catch (error) {
      console.error('Failed to fetch presentations:', error);
      throw new Error('Failed to fetch presentations');
    }
  }

  public async getById(id: string): Promise<Presentation> {
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }
    try {
      const response = await apiClient.get<Presentation>(`/presentations/${id}`);
      this.cache.set(id, response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch presentation:', error);
      throw new Error('Failed to fetch presentation');
    }
  }

  public async startGeneratingSlides(request: GenerateSlideRequest): Promise<PresentationGenerationStatus> {
    try {
      const response = await apiClient.post<PresentationGenerationStatus>('/presentations/generate', request);
      return response.data;
    } catch (error) {
      console.error('Failed to start slide generation:', error);
      throw new Error('Failed to start slide generation');
    }
  }

  public async getGenerationStatus(id: string): Promise<Presentation> {
    try {
      const response = await apiClient.get<Presentation>(`/presentations/${id}/status`);
      return response.data;
    } catch (error) {
      console.error('Failed to get generation status:', error);
      throw new Error('Failed to get generation status');
    }
  }

  public async generateSlides(request: GenerateSlideRequest): Promise<Presentation> {
    try {
      const response = await apiClient.post<Presentation>('/presentations/generate', {
        markdown_input: request.markdown_input,
        title: request.title,
        theme: request.theme || 'default'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to generate presentation:', error);
      throw new Error('Failed to generate presentation');
    }
  }

  public async updatePresentation(id: string, data: Partial<Presentation>): Promise<Presentation> {
    try {
      const response = await apiClient.put<Presentation>(`/presentations/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Failed to update presentation:', error);
      throw new Error('Failed to update presentation');
    }
  }

  public async deletePresentation(id: string): Promise<boolean> {
    try {
      const response = await apiClient.delete(`/presentations/${id}`);
      if (response.status === 200 || response.status === 204) {
        this.cache.delete(id);
        this.listCache = null;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete presentation:', error);
      return false;
    }
  }

  public clearCache(): void {
    this.cache.clear();
    this.listCache = null;
  }
}

export default PresentationService.getInstance();