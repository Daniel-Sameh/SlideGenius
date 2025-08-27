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

// Mock data storage (would be replaced by API calls in production)
class PresentationStorage {
  private static instance: PresentationStorage;
  private presentations: Presentation[] = [];

  private constructor() {
    // Load any saved presentations from localStorage
    const saved = localStorage.getItem('presentations');
    if (saved) {
      this.presentations = JSON.parse(saved);
    }
  }

  public static getInstance(): PresentationStorage {
    if (!PresentationStorage.instance) {
      PresentationStorage.instance = new PresentationStorage();
    }
    return PresentationStorage.instance;
  }

  public getAllByUser(userId: string): Presentation[] {
    return this.presentations.filter(p => p.userId === userId);
  }

  public getById(id: string): Presentation | undefined {
    return this.presentations.find(p => p.id === id);
  }

  public save(presentation: Presentation): Presentation {
    const existingIndex = this.presentations.findIndex(p => p.id === presentation.id);
    
    if (existingIndex >= 0) {
      // Update existing presentation
      this.presentations[existingIndex] = {
        ...presentation,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Create new presentation
      this.presentations.push({
        ...presentation,
        id: presentation.id || `pres_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    // Persist to localStorage
    localStorage.setItem('presentations', JSON.stringify(this.presentations));
    
    return this.getById(presentation.id) as Presentation;
  }

  public delete(id: string): boolean {
    const initialLength = this.presentations.length;
    this.presentations = this.presentations.filter(p => p.id !== id);
    
    if (initialLength !== this.presentations.length) {
      localStorage.setItem('presentations', JSON.stringify(this.presentations));
      return true;
    }
    
    return false;
  }
}

export const presentationService = PresentationStorage.getInstance();
