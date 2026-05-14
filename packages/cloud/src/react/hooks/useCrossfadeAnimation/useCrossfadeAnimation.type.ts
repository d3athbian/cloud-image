export type CrossfadeAnimationOptions = {
  enabled: boolean;
  duration: number;
};

export type CrossfadeAnimationResult = {
  opacity: number;
  isTransitioning: boolean;
  onImageLoaded: () => void;
  reset: () => void;
};