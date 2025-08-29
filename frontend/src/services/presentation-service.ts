import { getCookie } from 'cookies-next';

// Use local proxy in development, and the Vercel env variable in production
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? '/api'
  : `${process.env.NEXT_PUBLIC_API_URL}/api`;

export interface Presentation {
  id: string;
  title: string;
  // Remove description field since it doesn't exist in backend
  markdown: string;
  html?: string;
  theme?: string;
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
    // Don't set token in constructor for Next.js compatibility
  }

  public static getInstance(): PresentationService {
    if (!PresentationService.instance) {
      PresentationService.instance = new PresentationService();
    }
    return PresentationService.instance;
  }

  private getToken(): string | null {
    // Always get fresh token to ensure it's current
    if (typeof window !== 'undefined') {
      return getCookie('token') as string || localStorage.getItem('token') || this.token;
    }
    return this.token;
  }

  private getHeaders() {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  public async getAllByUser(): Promise<Presentation[]> {
    const headers = this.getHeaders();
    
    console.log('Fetching presentations from:', `${API_BASE_URL}/presentations/`);
    console.log('With headers:', headers);
    
    const response = await fetch(`${API_BASE_URL}/presentations/`, {
      method: 'GET',
      headers: headers,
      credentials: 'include',
    });
    
    if (!response.ok) {
      console.error('Failed to fetch presentations:', response.status, response.statusText);
      throw new Error(`Failed to fetch presentations: ${response.status}`);
    }
    
    return response.json();
  }

  public async getById(id: string): Promise<Presentation> {
    const headers = this.getHeaders();
    
    console.log('Fetching presentation by ID with headers:', headers); // Debug log
    
    const response = await fetch(`${API_BASE_URL}/presentations/${id}`, {
      method: 'GET',
      headers: headers,
      credentials: 'include',
    });
    
    if (!response.ok) {
      console.error('Failed to fetch presentation:', response.status, response.statusText);
      throw new Error(`Failed to fetch presentation: ${response.status}`);
    }
    
    return response.json();
  }

  public async generateSlides(request: GenerateSlideRequest): Promise<Presentation> {
    const headers = this.getHeaders();

    const response = await fetch(`${API_BASE_URL}/presentations/generate`, {
      method: 'POST',
      headers: headers,
      credentials: 'include',
      body: JSON.stringify({
        markdown_input: request.markdown_input,
        title: request.title,
        theme: request.theme || 'default'
      }),
    });
    
    if (!response.ok) {
      console.error('Failed to generate presentation:', response.status, response.statusText);
      throw new Error(`Failed to generate presentation: ${response.status}`);
    }
    
    return response.json();
  }

  public async updatePresentation(id: string, data: Partial<Presentation>): Promise<Presentation> {
    const headers = this.getHeaders();
    
    const response = await fetch(`${API_BASE_URL}/presentations/${id}`, {
      method: 'PUT',
      headers: headers,
      credentials: 'include',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      console.error('Failed to update presentation:', response.status, response.statusText);
      throw new Error(`Failed to update presentation: ${response.status}`);
    }
    
    return response.json();
  }

  public async deletePresentation(id: string): Promise<boolean> {
    const headers = this.getHeaders();
    
    const response = await fetch(`${API_BASE_URL}/presentations/${id}`, {
      method: 'DELETE',
      headers: headers,
      credentials: 'include',
    });
    
    if (!response.ok) {
      console.error('Failed to delete presentation:', response.status, response.statusText);
    }
    
    return response.ok;
  }

  public setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}`;
    }
  }

  public clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    }
  }
}

export default PresentationService.getInstance();