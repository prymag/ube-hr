import { useRef, useState, useEffect } from 'react';
import { Button } from '@ube-hr/ui';
import { Camera, X } from 'lucide-react';

interface ProfilePictureProps {
  url: string | null;
  onUpload?: (file: File) => void;
  onRemove?: () => void;
  isPending?: boolean;
  disabled?: boolean;
}

export function ProfilePicture({
  url,
  onUpload,
  onRemove,
  isPending,
  disabled,
}: ProfilePictureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(url);

  useEffect(() => {
    setPreview(url);
  }, [url]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    onUpload?.(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onRemove?.();
  };

  return (
    <div className="flex flex-col items-center gap-4 mb-8">
      <div className="relative group">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center border">
          {preview ? (
            <img
              src={preview}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-muted-foreground text-xs">No Photo</span>
          )}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute bottom-0 right-0 w-8 h-8 rounded-full p-0 shadow-sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending || disabled}
        >
          <Camera className="w-4 h-4" />
        </Button>
      </div>

      {preview && onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs text-destructive hover:text-destructive"
          onClick={handleRemove}
          disabled={isPending || disabled}
        >
          <X className="w-3 h-3 mr-1" />
          Remove Photo
        </Button>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}
