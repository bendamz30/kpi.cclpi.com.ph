"use client"

import { User } from "lucide-react"
import { useState, useEffect } from "react"

interface ProfilePictureProps {
  src?: string | null
  alt?: string
  size?: "sm" | "md" | "lg" | "xl" | "2xl"
  className?: string
  showBorder?: boolean
  borderColor?: string
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8", 
  lg: "h-10 w-10",
  xl: "h-12 w-12",
  "2xl": "h-16 w-16"
}

export function ProfilePicture({ 
  src, 
  alt = "Profile picture", 
  size = "md", 
  className = "",
  showBorder = false,
  borderColor = "border-gray-300"
}: ProfilePictureProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const sizeClass = sizeClasses[size]
  const borderClass = showBorder ? `border-2 ${borderColor}` : ""
  
  // Reset error state when src changes
  useEffect(() => {
    setImageError(false)
    setImageLoaded(false)
  }, [src])
  
  const handleSrcChange = () => {
    setImageError(false)
    setImageLoaded(false)
  }
  
  // Handle image load success
  const handleImageLoad = () => {
    setImageLoaded(true)
    setImageError(false)
  }
  
  // Handle image load error
  const handleImageError = () => {
    console.warn(`Failed to load profile picture: ${src}`)
    setImageError(true)
    setImageLoaded(false)
  }
  
  // Determine if we should show the image or fallback
  const shouldShowImage = src && !imageError
  const shouldShowFallback = !src || imageError
  
  return (
    <div className={`relative flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-100 to-yellow-200 overflow-hidden shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105 ${sizeClass} ${borderClass} ${className}`}>
      {shouldShowImage && (
        <img
          src={src}
          alt={alt}
          className={`h-full w-full object-cover transition-transform duration-200 hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          onLoadStart={handleSrcChange}
        />
      )}
      {shouldShowFallback && (
        <User className="h-1/2 w-1/2 text-yellow-600 transition-colors duration-200" />
      )}
    </div>
  )
}
