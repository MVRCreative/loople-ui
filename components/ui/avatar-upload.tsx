"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserRound, Upload, X } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface AvatarUploadProps {
  currentAvatarUrl?: string
  onAvatarChange: (url: string) => void
  disabled?: boolean
}

export function AvatarUpload({ currentAvatarUrl, onAvatarChange, disabled }: AvatarUploadProps) {
  const [uploading, setUploading] = React.useState(false)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    try {
      setUploading(true)
      
      // Create preview URL
      const preview = URL.createObjectURL(file)
      setPreviewUrl(preview)

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (error) {
        console.error('Upload error:', error)
        alert('Failed to upload image. Please try again.')
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      onAvatarChange(publicUrl)
      
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveAvatar = () => {
    setPreviewUrl(null)
    onAvatarChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const displayUrl = previewUrl || currentAvatarUrl

  return (
    <div className="flex items-center gap-x-3">
      <Avatar className="h-12 w-12 rounded-lg">
        <AvatarImage src={displayUrl || ""} alt="Avatar preview" />
        <AvatarFallback className="rounded-lg">
          <UserRound className="h-6 w-6" />
        </AvatarFallback>
      </Avatar>
      
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || disabled}
        >
          {uploading ? (
            "Uploading..."
          ) : (
            <>
              <Upload className="h-4 w-4 mr-1" />
              Change
            </>
          )}
        </Button>
        
        {displayUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemoveAvatar}
            disabled={uploading || disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
