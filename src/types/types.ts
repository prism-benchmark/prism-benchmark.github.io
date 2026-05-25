export type Author = {
  name: string;
  url?: string;
  institution?: string;
  institutionIndices?: number[];
  notes?: string[];
};

export type Institution = {
  index: number;
  name: string;
};

export type Link = {
  url: string;
  name: string;
  icon?: string;
};

export type Note = {
  symbol: string;
  text: string;
};
