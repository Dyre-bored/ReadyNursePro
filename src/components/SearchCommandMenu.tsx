
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { FileQuestion, FlaskConical, LayoutGrid, Loader2 } from 'lucide-react';

interface SearchCommandMenuProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SearchCommandMenu({ open, onOpenChange }: SearchCommandMenuProps) {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();

  const decksQuery = useMemoFirebase(() => {
    if (user) return collection(firestore, 'users', user.uid, 'flashcardDecks');
    return null;
  }, [user, firestore]);

  const quizzesQuery = useMemoFirebase(() => {
    if (user) return collection(firestore, 'users', user.uid, 'quizzes');
    return null;
  }, [user, firestore]);

  const drugsQuery = useMemoFirebase(() => collection(firestore, 'drugs'), [firestore]);

  const { data: decks, isLoading: decksLoading } = useCollection(decksQuery);
  const { data: quizzes, isLoading: quizzesLoading } = useCollection(quizzesQuery);
  const { data: drugs, isLoading: drugsLoading } = useCollection(drugsQuery);

  const handleSelect = (path: string) => {
    router.push(path);
    onOpenChange(false);
  };
  
  const isLoading = decksLoading || quizzesLoading || drugsLoading;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search flashcards, quizzes, drugs..." />
      <CommandList>
        <CommandEmpty>
            {isLoading ? (
                <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : 'No results found.'}
        </CommandEmpty>
        
        {!decksLoading && decks && decks.length > 0 && (
          <CommandGroup heading="Flashcard Decks">
            {decks.map((deck: any) => (
              <CommandItem key={`deck-${deck.id}`} value={`Deck: ${deck.title} ${deck.subject}`} onSelect={() => handleSelect(`/flashcards/${deck.id}`)}>
                <LayoutGrid className="mr-2 h-4 w-4" />
                <span>{deck.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!quizzesLoading && quizzes && quizzes.length > 0 && (
          <CommandGroup heading="Quizzes">
            {quizzes.map((quiz: any) => (
              <CommandItem key={`quiz-${quiz.id}`} value={`Quiz: ${quiz.title} ${quiz.topic}`} onSelect={() => handleSelect(`/quizzes/${quiz.id}`)}>
                <FileQuestion className="mr-2 h-4 w-4" />
                <span>{quiz.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!drugsLoading && drugs && drugs.length > 0 && (
          <CommandGroup heading="Drug Library">
            {drugs.map((drug: any) => (
              <CommandItem key={`drug-${drug.id}`} value={`Drug: ${drug.genericName} ${drug.drugClass}`} onSelect={() => handleSelect('/library')}>
                <FlaskConical className="mr-2 h-4 w-4" />
                <span>{drug.genericName}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
