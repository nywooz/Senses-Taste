export type TasteCategory = 'umami' | 'spicy' | 'sweet' | 'sour' | 'savory';

export type TasteFilter = 'all' | TasteCategory;

export type AppView = 'globe' | 'index' | 'matrix' | 'notes';

export type MapEngine = 'google' | 'globe';

export type GoogleMapStyle = 'roadmap' | 'hybrid' | 'terrain';

export type Continent =
  | 'East & Southeast Asia'
  | 'South Asia'
  | 'Europe'
  | 'Middle East & North Africa'
  | 'Sub-Saharan Africa'
  | 'Latin America'
  | 'North America'
  | 'Oceania';

export interface FlavorProfile {
  umami: number; // 0 - 100
  spicy: number; // 0 - 100
  sweet: number; // 0 - 100
  sour: number; // 0 - 100
  savory: number; // 0 - 100
}

export interface CulinaryDish {
  id: string;
  name: string;
  localName: string;
  city: string;
  country: string;
  continent: Continent;
  lat: number;
  lon: number;
  primaryTaste: TasteCategory;
  secondaryTaste: TasteCategory;
  intensity: number; // 0 - 100 composite sensory intensity
  flavorProfile: FlavorProfile;
  signatureAromas: string[];
  keyIngredients: string[];
  tastingNotes: string;
  heritageSource: string;
  pairing: string;
  relatedIds: string[];
}

export interface LayerVisibility {
  columns: boolean;
  arcs: boolean;
  aroma: boolean;
  borders: boolean;
}

export interface TasteMetadata {
  id: TasteCategory;
  label: string;
  shortLabel: string;
  color: string;
  hexNumber: number;
  compoundNote: string;
  description: string;
  imagePath: string;
}
