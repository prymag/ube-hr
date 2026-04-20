import { useRef } from 'react';
import { Button } from '@ube-hr/ui';
import { Camera, X } from 'lucide-react';
import {
  useUploadUserProfilePicture,
  useRemoveUserProfilePicture,
} from '../users.queries';

interface ProfilePictureProps {
  userId: number;
  url: string | null;
}

export function ProfilePicture({ userId, url }: ProfilePictureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadUserProfilePicture(userId);
  const removeMutation = useRemoveUserProfilePicture(userId);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadMutation.mutateAsync(file);
  };

  return (
    <div className="flex flex-col items-center gap-4 mb-8">
      <div className="relative group">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center border">
          {url ? (
            <img
              src={url}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-muted-foreground text-xs">No Photo</span>
          )}
        </div>
        <Button
          variant="secondary"
          size="icon"
          className="absolute bottom-0 right-0 w-8 h-8 rounded-full p-0 shadow-sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending}
        >
          <Camera className="w-4 h-4" />
        </Button>
      </div>

      {url && (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-destructive hover:text-destructive"
          onClick={() => removeMutation.mutate()}
          disabled={removeMutation.isPending}
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
