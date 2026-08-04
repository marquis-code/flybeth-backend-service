// src/modules/integrations/interfaces/experiences-adapter.interface.ts

export interface ExperienceSearchQuery {
  latitude: number;
  longitude: number;
  radius?: number; // km
  query?: string; // Search string (e.g. city name)
}

export interface ExperienceSearchResult {
  provider: string;
  experienceId: string;
  name: string;
  description: string;
  shortDescription?: string;
  photos: string[];
  price: number;
  currency: string;
  rating?: number;
  bookingLink?: string;
  minimumDuration?: string;
}

export interface ExperiencesAdapter {
  providerName: string;
  searchExperiences(
    query: ExperienceSearchQuery,
  ): Promise<ExperienceSearchResult[]>;
  getExperienceDetails(
    experienceId: string,
  ): Promise<ExperienceSearchResult | null>;
  bookExperience?(bookingData: any): Promise<any>;
  cancelBooking?(reference: string): Promise<any>;
}
