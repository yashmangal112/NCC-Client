// Remove the direct Cloudinary import - it's causing browser compatibility issues

// Update the getOptimizedImageUrl function to handle various input types
export const getOptimizedImageUrl = (
  input: any,
  options: any = {}
) => {
  if (!input) return '';

  if (typeof input === 'object') {
    if (input.secure_url) return input.secure_url;
    if (input.url) return input.url;

    return '/placeholder.svg';
  }

  const url = String(input);

  // If it's already a Cloudinary URL, use it directly.
  if (url.startsWith('https://res.cloudinary.com/')) {
    return url;
  }

  return url;
};

// Remove empty default export
// export default { config: () => {} };

export interface UploadResult {
  public_id: string;
  secure_url: string;
  format: string;
  width: number;
  height: number;
  original_filename: string;
}

/**
 * Uploads a file (image or video) to Cloudinary using the API route
 * @param file The file to upload
 * @param folder Optional folder path to organize files
 * @returns Promise with upload result
 */
export const uploadToCloudinary = async (
  file: File,
  folder: string = 'procurement_ledger'
): Promise<UploadResult> => {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }
  
  const result = await response.json();
  
  return {
    public_id: result.public_id,
    secure_url: result.secure_url,
    format: result.format || 'jpg',
    width: result.width || 0,
    height: result.height || 0,
    original_filename: file.name,
  };
};

export const uploadImage = uploadToCloudinary;

/**
 * Converts a file to base64 string
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};
