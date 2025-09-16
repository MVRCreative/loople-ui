"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Image, File, Video, Download, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import NextImage from "next/image";

interface MediaAttachmentProps {
  attachment: {
    id: number;
    file_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    file_type: string;
  };
  onDelete?: (attachmentId: number) => void;
  canDelete?: boolean;
}

export function MediaAttachment({ attachment, onDelete, canDelete = false }: MediaAttachmentProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageError, setImageError] = useState(false);

  const getFileIcon = () => {
    switch (attachment.file_type) {
      case 'image':
        return <Image className="h-4 w-4" aria-label="Image file" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const getFileUrl = () => {
    const { data: { publicUrl } } = supabase.storage
      .from('post-media')
      .getPublicUrl(attachment.file_path);
    return publicUrl;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    const url = getFileUrl();
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this attachment?')) {
      setIsDeleting(true);
      try {
        await onDelete?.(attachment.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const renderPreview = () => {
    if (attachment.file_type === 'image' && !imageError) {
      return (
        <div className="relative group">
          <NextImage
            src={getFileUrl()}
            alt={attachment.file_name}
            width={400}
            height={128}
            className="w-full h-32 object-cover rounded-lg"
            onError={() => setImageError(true)}
          />
          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/50">
        <div className="flex-shrink-0">
          {getFileIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-card-foreground truncate">
            {attachment.file_name}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(attachment.file_size)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-8 w-8 p-0"
          >
            <Download className="h-3 w-3" />
          </Button>
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-3">
      {renderPreview()}
    </div>
  );
}
