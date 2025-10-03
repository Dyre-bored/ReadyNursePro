
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

type Flashcard = {
    id: string;
    frontText: string;
    backText: string;
};

interface FlashcardPlayerProps {
    cards: Flashcard[];
}

export function FlashcardPlayer({ cards }: FlashcardPlayerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const currentCard = useMemo(() => cards[currentIndex], [cards, currentIndex]);

    const handleNavigate = (direction: 'next' | 'prev') => {
        if (isTransitioning) return;
        
        setIsTransitioning(true);
        setIsFlipped(false); // Start flipping back immediately

        // This timeout should be slightly longer than half the animation duration
        // to ensure the content changes while the card is "on its edge"
        setTimeout(() => {
            if (direction === 'next') {
                setCurrentIndex((prev) => (prev + 1) % cards.length);
            } else {
                setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
            }
            // Allow the new content to render, then end the transition
            setTimeout(() => setIsTransitioning(false), 50);
        }, 200); 
    };

    if (!currentCard) {
        return null;
    }

    return (
        <div className="w-full max-w-2xl flex flex-col items-center gap-6">
            {/* The perspective wrapper */}
            <div
                className="w-full h-72 [perspective:1000px] cursor-pointer"
                onClick={() => !isTransitioning && setIsFlipped(!isFlipped)}
            >
                {/* The inner card that flips */}
                <div
                    className={cn(
                        "relative w-full h-full text-center transition-transform duration-500 [transform-style:preserve-3d]",
                        isFlipped && "[transform:rotateY(180deg)]"
                    )}
                >
                    {/* Front of the card */}
                    <Card className="absolute w-full h-full [backface-visibility:hidden] flex items-center justify-center">
                        <CardContent className="flex h-full items-center justify-center p-6">
                           {isTransitioning ? (
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
                           ) : (
                                <p className="text-2xl font-semibold">{currentCard.frontText}</p>
                           )}
                        </CardContent>
                    </Card>

                    {/* Back of the card */}
                    <Card className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] flex items-center justify-center">
                        <CardContent className="flex h-full items-center justify-center p-6">
                             {isTransitioning ? (
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
                           ) : (
                                <p className="text-xl">{currentCard.backText}</p>
                           )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            {/* Controls */}
            <div className="flex items-center justify-center gap-4 w-full">
                <Button variant="outline" size="lg" onClick={() => handleNavigate('prev')} disabled={isTransitioning}>
                    <ChevronLeft className="mr-2" /> Previous
                </Button>
                <div className="text-center font-medium text-muted-foreground w-24">
                    {currentIndex + 1} / {cards.length}
                </div>
                <Button variant="outline" size="lg" onClick={() => handleNavigate('next')} disabled={isTransitioning}>
                    Next <ChevronRight className="ml-2" />
                </Button>
            </div>
        </div>
    );
}
