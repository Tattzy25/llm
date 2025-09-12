export type ModelCardData = {
  id: string;
  name: string;
  provider: string;
  description: string;
  modelType: string;
  status: 'Available' | 'Busy' | 'Offline';
  contextWindow: string;
  responseTime: string;
  imageUrl: string;
  usageCount: number;
  fontFamily: string;
  providerIconUrl: string;
  brandLogoUrl: string;
  cardBackgroundColor: string;
  headerBackgroundColor: string;
  glowColor: string;
  shadowColor: string;
};