export type UseBlobUrlOptions = {
  componentId: string;
};

export type BlobUrlResult = {
  objectUrl: string | null;
  createUrl: (blob: Blob) => string;
  revokeUrl: () => void;
};