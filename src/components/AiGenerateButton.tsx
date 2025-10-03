
'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Sparkles, Loader2 } from 'lucide-react';

interface AiGenerateButtonProps {
  onGenerate: () => Promise<void>;
}

export function AiGenerateButton({ onGenerate }: AiGenerateButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleClick = async () => {
    setIsGenerating(true);
    await onGenerate();
    setIsGenerating(false);
  };

  return (
    <Button variant="outline" onClick={handleClick} disabled={isGenerating}>
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 text-primary" /> AI Generate
        </>
      )}
    </Button>
  );
}
