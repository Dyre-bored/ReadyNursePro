'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, X } from 'lucide-react';
import { FlashcardPlayer } from '@/components/FlashcardPlayer';

export default function StudyPage() {
  const params = useParams();
  const router = useRouter();
  const { deckId } = params;
  const { user } = useUser();
  const firestore = useFirestore();

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

  if (isDeckLoading || areFlashcardsLoading) {
    return (
      <div className="flex flex-col h-full flex-1 p-4 md:p-8">
        <div className="flex items-center justify-between mb-8">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-10" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <Skeleton className="w-full max-w-2xl h-72" />
            <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-32" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-12 w-32" />
            </div>
        </div>
      </div>
    )
  }

  if (!deck) {
    return <div>Deck not found.</div>;
  }

  if (!flashcards || flashcards.length === 0) {
    return (
        <div className="flex flex-col flex-1 items-center justify-center text-center">
            <h2 className="text-2xl font-bold">This deck has no cards!</h2>
            <p className="text-muted-foreground mt-2">Add some cards to start studying.</p>
            <Button asChild className="mt-4">
                <Link href={`/flashcards/${deckId}`}>Back to Deck</Link>
            </Button>
        </div>
    )
  }

  return (
    <div className="flex flex-col h-full flex-1">
        {/* Header */}
        <header className="p-4 flex items-center justify-between border-b">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                </Button>
                <h1 className="text-xl font-semibold font-headline">{deck.title}</h1>
            </div>
            <Button variant="ghost" size="icon" asChild>
                <Link href={`/flashcards/${deckId}`}>
                    <X className="h-5 w-5" />
                    <span className="sr-only">End Session</span>
                </Link>
            </Button>
        </header>

        {/* Player */}
        <main className="flex-1 flex items-center justify-center p-4">
            <FlashcardPlayer cards={flashcards} />
        </main>
    </div>
  );
}
