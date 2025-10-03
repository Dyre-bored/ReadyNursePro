'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { CreateDeckDialog } from '@/components/CreateDeckDialog';

export default function FlashcardsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const decksQuery = useMemoFirebase(() => {
    if (user) {
      return collection(firestore, 'users', user.uid, 'flashcardDecks');
    }
    return null;
  }, [user, firestore]);

  const { data: decks, isLoading: decksLoading } = useCollection(decksQuery);

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">My Flashcard Decks</h1>
          <p className="text-muted-foreground">
            Organize, study, and master your subjects.
          </p>
        </div>
        <CreateDeckDialog />
      </div>

      {decksLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-3/4 rounded bg-muted animate-pulse"></div>
                <div className="h-5 w-1/4 rounded bg-muted animate-pulse mt-2"></div>
              </CardHeader>
              <CardContent>
                 <div className="h-4 w-1/4 rounded bg-muted animate-pulse"></div>
                 <div className="h-2 w-full rounded bg-muted animate-pulse mt-4"></div>
              </CardContent>
              <CardFooter>
                 <div className="h-10 w-full rounded bg-muted animate-pulse"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : decks && decks.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {decks?.map((deck: any) => (
            <Card key={deck.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{deck.title}</CardTitle>
                <CardDescription>
                  <Badge variant="outline">{deck.subject}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="text-sm text-muted-foreground">
                  {deck.cardCount || 0} cards
                </div>
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-sm">
                    <span>Mastery</span>
                    <span>{deck.mastery || 0}%</span>
                  </div>
                  <Progress value={deck.mastery || 0} aria-label={`${deck.mastery || 0}% mastered`} />
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/flashcards/${deck.id}`}>View Deck</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
         <div className="flex-1 flex items-center justify-center text-center">
            <div className="p-8 border-2 border-dashed rounded-xl">
                <h3 className="font-headline text-lg font-semibold">No Decks Yet!</h3>
                <p className="text-muted-foreground mt-2">Click "Create New Deck" to get started.</p>
            </div>
        </div>
      )}
    </div>
  );
}
