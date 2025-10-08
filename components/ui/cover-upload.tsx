"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Image as ImageIcon, Upload, X } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface CoverUploadProps {
  currentCoverUrl?: string
  onCoverChange: (url: string) => void
  disabled?: boolean
}

export function CoverUpload({ currentCoverUrl, onCoverChange, disabled }: CoverUploadProps) {
  const [uploading, setUploading] = React.useState(false)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    // 10MB limit for covers
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB")
      return
    }

    try {
      setUploading(true)

      // Local preview
      const preview = URL.createObjectURL(file)
      setPreviewUrl(preview)

      // Upload to Supabase Storage (covers bucket)
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("covers")
        .upload(filePath, file)

      if (uploadError) {
        console.error("Upload error:", uploadError)
        alert("Failed to upload image. Please try again.")
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from("covers")
        .getPublicUrl(filePath)

      onCoverChange(publicUrl)
    } catch (error) {
      console.error("Upload error:", error)
      alert("Failed to upload image. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreviewUrl(null)
    onCoverChange("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const displayUrl = previewUrl || currentCoverUrl || ""

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-lg border border-dashed border-border">
        <div className="h-32 w-full lg:h-48 bg-muted flex items-center justify-center">
          {displayUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displayUrl} alt="Cover preview" className="h-full w-full object-cover" />
          ) : (
            <div className="text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
            </div>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 p-2 flex items-center justify-center gap-2 bg-gradient-to-t from-background/80">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || disabled}
          >
            {uploading ? "Uploading..." : (<><Upload className="h-4 w-4 mr-1" />Change</>)}
          </Button>
          {displayUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              disabled={uploading || disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
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


