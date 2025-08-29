'use client';

const API_BASE_URL = 'https://slidegenius-production.up.railway.app/api';

export interface Presentation {
  id: string;
  title: string;
  description?: string;
  markdown: string;
  html?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface GenerateSlideRequest {
  markdown_input: string;
  title: string;
  theme?: string;
}

class PresentationService {
  private static instance: PresentationService;
  private token: string | null = null;

  private constructor() {
    // Get token from localStorage if it exists
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  public static getInstance(): PresentationService {
    if (!PresentationService.instance) {
      PresentationService.instance = new PresentationService();
    }
    return PresentationService.instance;
  }

  private getHeaders() {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  public async getAllByUser(): Promise<Presentation[]> {
    const response = await fetch(`${API_BASE_URL}/presentations/`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch presentations');
    return response.json();
  }

  public async getById(id: string): Promise<Presentation> {
    const response = await fetch(`${API_BASE_URL}/presentations/${id}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch presentation');
    return response.json();
  }

  public async generateSlides(request: GenerateSlideRequest): Promise<Presentation> {
    const headers = this.getHeaders();
    headers['Content-Type'] = 'application/json';

    const response = await fetch(`${API_BASE_URL}/presentations/generate`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        markdown_input: request.markdown_input,
        title: request.title,
        theme: request.theme || 'default'
      }),
    });
    if (!response.ok) throw new Error('Failed to generate presentation');
    return response.json();
  }

  public async deletePresentation(id: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/presentations/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return response.ok;
  }

  public setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  public clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }
}

export default PresentationService.getInstance();
