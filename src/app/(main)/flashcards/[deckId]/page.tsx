'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileQuestion, ArrowLeft, BrainCircuit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AddCardDialog } from '@/components/AddCardDialog';
import { generateFlashcards } from '@/ai/flows/generate-flashcards-flow';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { AiGenerateButton } from '@/components/AiGenerateButton';

export default function DeckDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { deckId } = params;
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const deckRef = useMemoFirebase(() => {
    if (user && deckId) {
      return doc(firestore, 'users', user.uid, 'flashcardDecks', deckId as string);
    }
    return null;
  }, [user, firestore, deckId]);

  const flashcardsQuery = useMemoFirebase(() => {
    if (user && deckId) {
        return collection(firestore, 'users', user.uid, 'flashcardDecks', deckId as string, 'flashcards');
    }
    return null;
  }, [user, firestore, deckId]);

  const { data: deck, isLoading: isDeckLoading } = useDoc(deckRef);
  const { data: flashcards, isLoading: areFlashcardsLoading } = useCollection(flashcardsQuery);

  const handleAiGenerate = async () => {
    if (!deck || !flashcardsQuery) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Deck information not available.',
        });
        return;
    }

    try {
        const generatedCards = await generateFlashcards({
            subject: deck.subject,
            topic: deck.topic,
            difficulty: deck.difficulty,
        });

        if (!generatedCards || generatedCards.length === 0) {
           throw new Error("AI did not return any cards.");
        }
        
        // Save cards to firestore
        const savePromises = generatedCards.map(card => {
            const newCard = {
                flashcardDeckId: deckId,
                frontText: card.frontText,
                backText: card.backText,
                isStarred: false,
            };
            // Use non-blocking adds for faster UI feedback
            return addDocumentNonBlocking(flashcardsQuery, newCard);
        });

        // We don't need to await all promises here if we are using non-blocking writes.
        // The UI will update reactively as cards are added.

        toast({
            title: 'Success!',
            description: `${generatedCards.length} new flashcards are being generated and added to your deck.`
        });
    } catch (error) {
         toast({
            variant: 'destructive',
            title: 'AI Generation Failed',
            description: 'Could not generate flashcards. Please try again.',
        });
        console.error("AI Generation failed:", error);
    }
  }


  if (isDeckLoading) {
    return (
        <div className="flex flex-1 flex-col gap-4 md:gap-8">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-5 w-1/3" />
            <div className="mt-4">
                <Skeleton className="h-40 w-full" />
            </div>
        </div>
    );
  }

  if (!deck) {
    return <div>Deck not found.</div>;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
       <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
        <div className="flex-1">
          <h1 className="font-headline text-3xl font-bold">{deck.title}</h1>
          <p className="text-muted-foreground mt-1">
            {deck.description || `Topic: ${deck.topic} | Difficulty: ${deck.difficulty}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
            <AiGenerateButton onGenerate={handleAiGenerate} />
            <AddCardDialog deckId={deckId as string} />
            {flashcards && flashcards.length > 0 && (
              <Button asChild>
                <Link href={`/flashcards/${deckId}/study`}>
                  <BrainCircuit className="mr-2 h-4 w-4" /> Study Deck
                </Link>
              </Button>
            )}
        </div>
      </div>

        {areFlashcardsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
            </div>
        ) : flashcards && flashcards.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {flashcards.map((card) => (
                    <Card key={card.id}>
                        <CardHeader>
                            <CardTitle className="text-base font-medium line-clamp-2">{card.frontText}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-3">{card.backText}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        ) : (
            <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed bg-card mt-4">
                <div className="text-center p-8">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                        <FileQuestion className="h-8 w-8" />
                    </div>
                    <h2 className="font-headline text-xl font-semibold">No Flashcards Yet</h2>
                    <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                        This deck is empty. Start by using "AI Generate" or "Add a Card" to build your collection.
                    </p>
                </div>
            </div>
        )}
    </div>
  );
}
