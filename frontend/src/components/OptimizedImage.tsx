import { useState } from "react";
import Image from "next/image";
import { getOptimizedImageUrl } from "@/lib/cloudinary";
import { CloudinaryImage } from "@/types";
import eventImageTemplate from "../../public/EventImageTemplate.png";

interface OptimizedImageProps {
  src: string | null | undefined | any;  // Updated to handle any type
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  const getImageUrl = (src: string | CloudinaryImage | null | undefined): string => {
    if (!src) return "/placeholder.svg";
    
    if (typeof src === 'object' && 'secure_url' in src) {
      return src.secure_url;
    }
    
    return src;
  };

  // Handle potentially invalid src values
  let imageSrc = getImageUrl(src);
  
  // Now optimize the valid string URL
  const optimizedSrc = imageSrc !== "/placeholder.svg" 
    ? getOptimizedImageUrl(imageSrc, { width, height }) 
    : imageSrc;

  return (
    <div className={`relative ${className || ""}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse rounded-lg" />
      )}
      <Image
        src={optimizedSrc}
        alt={alt || "Image"}
        width={width}
        height={height}
        className={`${className || ""} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity`}
        priority={priority}
        onError={() => {
          setImageError(true);
          setIsLoading(false);
        }}
        onLoadingComplete={() => setIsLoading(false)}
      />
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
          {/* <span className="text-gray-400">Image not available</span> */}
          <Image
        src={eventImageTemplate}
        alt={alt || "Image"}
        width={width}
        height={height}
        className={`${className || ""} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity`}
        priority={priority}
        onError={() => {
          setImageError(true);
          setIsLoading(false);
        }}
        onLoadingComplete={() => setIsLoading(false)}
      />
        </div>
        
      )}
    </div>
  );
}