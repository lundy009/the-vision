import imageCompression from "browser-image-compression";

export async function processImage(file: File) {
  const options = {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
  };

  const compressed = await imageCompression(file, options);
  return compressed;
}
