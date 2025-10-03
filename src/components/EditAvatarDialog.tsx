
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';
import { Edit, Loader2, ShoppingBag, ImageUp } from 'lucide-react';
import { DocumentReference, arrayUnion, increment } from 'firebase/firestore';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { useAuth, useStorage, updateDocumentNonBlocking, useMemoFirebase, useDoc } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { avatarOptions } from '@/lib/data';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { useDropzone } from 'react-dropzone';
import { ImageCropper } from './ImageCropper';
import { avatarBorders, BorderId } from '@/lib/borders';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';


interface EditAvatarDialogProps {
  userProfileRef: DocumentReference | null;
}

const CUSTOM_AVATAR_COST = 100;

export function EditAvatarDialog({ userProfileRef }: EditAvatarDialogProps) {
  const { user } = useAuth();
  const storage = useStorage();
  const [open, setOpen] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [selectedBorder, setSelectedBorder] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const { toast } = useToast();

  const { data: userProfile } = useDoc(userProfileRef);

  useEffect(() => {
    if (userProfile) {
      setSelectedAvatar(userProfile.profilePictureUrl);
      setSelectedBorder(userProfile.selectedBorderId || 'border_none');
    }
  }, [userProfile]);

  const processFile = (file: File) => {
    if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({
            variant: 'destructive',
            title: 'File too large',
            description: 'Please select an image smaller than 4MB.',
        });
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setImageToCrop(dataUrl);
        setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      processFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.gif', '.webp'] },
    noClick: true,
    noKeyboard: true,
    multiple: false,
    disabled: !userProfile?.customAvatarUnlocked || isSaving
  });
  
  const uploadImage = async (blob: Blob): Promise<string | null> => {
    if (!user || !storage) return null;

    setIsSaving(true);
    try {
        const imageRef = storageRef(storage, `avatars/${user.uid}/profile.jpg`);
        const snapshot = await uploadBytes(imageRef, blob);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading image:", error);
        toast({
            variant: 'destructive',
            title: 'Upload Failed',
            description: 'Could not upload your avatar. Please try again.',
        });
        return null;
    } finally {
        setIsSaving(false);
    }
  };


  const handleCroppedImageSave = async (imageBlob: Blob) => {
    setCropperOpen(false);
    const newAvatarUrl = await uploadImage(imageBlob);
    if (newAvatarUrl) {
      setSelectedAvatar(newAvatarUrl);
    }
  }


  const handleSaveSelection = () => {
    if (!userProfileRef) return;

    setIsSaving(true);
    const updates: any = {};
    if (selectedAvatar && selectedAvatar !== userProfile?.profilePictureUrl) {
      updates.profilePictureUrl = selectedAvatar;
    }
    if (selectedBorder && selectedBorder !== userProfile?.selectedBorderId) {
      updates.selectedBorderId = selectedBorder;
    }

    if (Object.keys(updates).length > 0) {
        updateDocumentNonBlocking(userProfileRef, updates);
        toast({
            title: 'Profile Updated!',
            description: 'Your new avatar and/or border has been saved.',
        });
    }

    setIsSaving(false);
    setOpen(false);
  };

  const handleBuyCustomAvatar = async () => {
    if (!userProfileRef || !userProfile || userProfile.customAvatarUnlocked) return;

    if (userProfile.coins < CUSTOM_AVATAR_COST) {
      toast({
        variant: 'destructive',
        title: 'Not enough coins!',
        description: `You need ${CUSTOM_AVATAR_COST} coins to unlock this. Play games to earn more!`,
      });
      return;
    }
    
    setIsBuying(true);
    try {
        await updateDocumentNonBlocking(userProfileRef, {
            customAvatarUnlocked: true,
            coins: increment(-CUSTOM_AVATAR_COST)
        });
        toast({
            title: 'Feature Unlocked!',
            description: `You can now upload custom avatars. ${CUSTOM_AVATAR_COST} coins have been deducted.`,
        });
    } catch(error) {
        console.error("Error buying custom avatar:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not complete the purchase. Please try again.'
        });
    } finally {
        setIsBuying(false);
    }
  };

  const handleSelectBorder = async (borderId: BorderId) => {
    if (!userProfile) return;

    const border = avatarBorders[borderId];
    if (userProfile.unlockedBorderIds?.includes(borderId) || border.cost === 0) {
      setSelectedBorder(borderId);
      // If it's a free border the user doesn't have, add it to their unlocked list.
      if (border.cost === 0 && !userProfile.unlockedBorderIds?.includes(borderId) && userProfileRef) {
          await updateDocumentNonBlocking(userProfileRef, {
              unlockedBorderIds: arrayUnion(borderId)
          });
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Border Locked',
        description: `Purchase this border from the shop to use it.`,
      });
    }
  }


  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" className="absolute bottom-0 right-0 rounded-full h-8 w-8">
            <Edit className="h-4 w-4"/>
            <span className="sr-only">Edit profile picture</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Change Profile Picture & Border</DialogTitle>
          <DialogDescription>
            Select a pre-made avatar or upload your own. Then, choose a border to frame it.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea {...getRootProps()} className={cn("max-h-[60vh] -mr-4 pr-4 rounded-md", isDragActive && 'outline-dashed outline-2 outline-primary')}>
            <input {...getInputProps()} />
            <div className='py-4 space-y-6'>
                <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-4">Custom Avatar</h4>
                     {userProfile?.customAvatarUnlocked ? (
                         <div
                            className={cn(
                                'relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors',
                                isDragActive && 'border-primary bg-primary/10'
                            )}
                            onClick={() => document.getElementById('custom-avatar-input')?.click()}
                            >
                            <input id="custom-avatar-input" type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && processFile(e.target.files[0])} />
                            <div className="text-center">
                                <ImageUp className="mx-auto h-10 w-10 text-muted-foreground" />
                                <p className="mt-2 text-sm text-muted-foreground">
                                <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-muted-foreground">PNG, JPG or GIF (max. 4MB)</p>
                            </div>
                        </div>
                    ) : (
                        <Button 
                            className="w-full"
                            onClick={handleBuyCustomAvatar}
                            disabled={isBuying || (userProfile && userProfile.coins < CUSTOM_AVATAR_COST)}
                        >
                            {isBuying ? (
                                <Loader2 className="animate-spin mr-2" />
                            ) : (
                                <ShoppingBag className="mr-2" />
                            )}
                            Unlock for {CUSTOM_AVATAR_COST} Coins
                        </Button>
                    )}
                   
                </div>

                <Separator />

                <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-4">Choose a free avatar</h4>
                    <div className="grid grid-cols-5 sm:grid-cols-6 gap-4">
                    {avatarOptions.map((url, index) => (
                        <button
                        key={index}
                        className={cn(
                            "rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                            selectedAvatar === url && "ring-2 ring-primary ring-offset-2"
                        )}
                        onClick={() => setSelectedAvatar(url)}
                        >
                        <Avatar className="h-16 w-16">
                            <AvatarImage asChild src={url}>
                            <Image src={url} alt={`Avatar ${index + 1}`} width={64} height={64} className="object-cover" />
                            </AvatarImage>
                             <AvatarFallback>?</AvatarFallback>
                        </Avatar>
                        </button>
                    ))}
                    </div>
                </div>

                 <Separator />

                <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-4">Choose an avatar border</h4>
                    <TooltipProvider>
                    <div className="grid grid-cols-5 sm:grid-cols-6 gap-4">
                    {(Object.keys(avatarBorders) as BorderId[]).map((borderId) => {
                        const border = avatarBorders[borderId];
                        const isOwned = userProfile?.unlockedBorderIds?.includes(borderId) || border.cost === 0;
                        const isSelected = selectedBorder === borderId;
                        return (
                        <Tooltip key={borderId}>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => handleSelectBorder(borderId)}
                                    className={cn(
                                        "rounded-full h-16 w-16 flex items-center justify-center bg-muted focus:outline-none relative",
                                        isSelected && 'ring-2 ring-primary ring-offset-2'
                                    )}
                                    disabled={!isOwned}
                                >
                                    <div className={cn("h-14 w-14 rounded-full", border.className)}></div>
                                    {!isOwned && (
                                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white">
                                            <ShoppingBag className="h-6 w-6" />
                                        </div>
                                    )}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                               <p className="font-semibold">{border.name}</p>
                               <p className="text-xs text-muted-foreground">{isOwned ? border.description : `Costs ${border.cost} coins. Purchase in shop.`}</p>
                            </TooltipContent>
                        </Tooltip>
                        )
                    })}
                    </div>
                    </TooltipProvider>
                </div>
            </div>
        </ScrollArea>

        <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveSelection} disabled={isSaving}>
                {isSaving && <Loader2 className="animate-spin mr-2" />}
                Save Changes
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    {imageToCrop && (
        <ImageCropper 
            isOpen={cropperOpen}
            onOpenChange={setCropperOpen}
            imageSrc={imageToCrop}
            onSave={handleCroppedImageSave}
        />
    )}
    </>
  );
}
