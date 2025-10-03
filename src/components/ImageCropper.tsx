
'use client'

import React, { useState, useRef } from 'react'
import 'react-image-crop/dist/ReactCrop.css'
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from 'react-image-crop'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from './ui/button'
import { RotateCw, Loader2 } from 'lucide-react'

// This function is adapted from the react-image-crop docs
function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop,
  rotation = 0
): Promise<Blob | null> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = crop.width;
        canvas.height = crop.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            reject(new Error('Canvas context is not available.'));
            return;
        }

        const pixelRatio = window.devicePixelRatio;
        canvas.width = crop.width * pixelRatio;
        canvas.height = crop.height * pixelRatio;
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        ctx.imageSmoothingQuality = 'high';

        const centerX = image.width / 2;
        const centerY = image.height / 2;

        ctx.save();
        // Translate and rotate the canvas to the center of the image
        ctx.translate(centerX, centerY);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
        
        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            crop.width,
            crop.height
        );
        ctx.restore();

        canvas.toBlob(blob => {
            if (!blob) {
                reject(new Error('Canvas is empty.'));
                return;
            }
            resolve(blob);
        }, 'image/jpeg');
    });
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  )
}

interface ImageCropperProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  imageSrc: string;
  onSave: (croppedImageBlob: Blob) => void;
}

export function ImageCropper({ isOpen, onOpenChange, imageSrc, onSave }: ImageCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [rotation, setRotation] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const aspect = 1;

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height, aspect))
  }
  
  const handleSave = async () => {
    if (!completedCrop || !imgRef.current) {
      return
    }
    setIsSaving(true)
    try {
        const imageBlob = await getCroppedImg(imgRef.current, completedCrop, rotation);
        if (imageBlob) {
            onSave(imageBlob);
        }
    } catch (e) {
        console.error(e)
    } finally {
        setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crop Your Image</DialogTitle>
          <DialogDescription>Adjust the image to fit the square aspect ratio.</DialogDescription>
        </DialogHeader>
        <div className="my-4 flex justify-center bg-muted">
            <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspect}
                circularCrop
            >
                <img
                    ref={imgRef}
                    alt="Crop me"
                    src={imageSrc}
                    style={{ transform: `rotate(${rotation}deg)`}}
                    onLoad={onImageLoad}
                />
            </ReactCrop>
        </div>
        <div className="flex items-center justify-center">
            <Button variant="outline" onClick={() => setRotation(r => r - 90)}>
                <RotateCw className="mr-2 h-4 w-4" />
                Rotate
            </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Avatar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
