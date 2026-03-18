export interface SectionText { title: string; description: string; buttonText: string; }
export interface AllSectionTexts { designs: SectionText; influencers: SectionText; merchandising: SectionText; }
export interface PersonalizationContent { videoUrl: string | null; title: string; subtitle: string; steps: string[]; buttonText: string; }
export interface CarouselSlide {
  id: string; order: number; title: string; subtitle: string;
  collection: string; collectionName: string; collectionSubtitle: string;
  primaryBtn: string; secondaryBtn: string; buttonColor: string; buttonTextColor?: string;
  bgColor?: string; mediaUrl?: string; mediaType: 'image' | 'video';
  cloudinaryPublicId?: string; isActive: boolean;
  createdAt: string; updatedAt: string;
}
export interface GenreOption { value: string; label: string; }
export interface CarouselSettings {
  autoPlayInterval: number | null; // ms — null or 0 = no autoplay
}
