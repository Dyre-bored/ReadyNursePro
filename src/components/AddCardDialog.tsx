
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle } from 'lucide-react';
import { Textarea } from './ui/textarea';

export function AddCardDialog({ deckId }: { deckId: string }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setFrontText('');
    setBackText('');
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not Logged In',
        description: 'You must be logged in to add a card.',
      });
      return;
    }

    if (!frontText || !backText) {
        toast({
            variant: 'destructive',
            title: 'Missing Fields',
            description: 'Please fill out both the front and back of the card.',
        });
        return;
    }

    setIsSaving(true);

    const flashcardsRef = collection(firestore, 'users', user.uid, 'flashcardDecks', deckId, 'flashcards');
    const newCard = {
      flashcardDeckId: deckId,
      frontText,
      backText,
      isStarred: false,
    };

    try {
      await addDocumentNonBlocking(flashcardsRef, newCard);
      
      // Also update cardCount on the deck (optional, but good practice)
      const deckRef = doc(firestore, 'users', user.uid, 'flashcardDecks', deckId);
      // We would ideally use a transaction or server-side increment here,
      // but for client-side simplicity, we'll read and write.
      // This is disabled for now to keep the example simple.
      // updateDocumentNonBlocking(deckRef, { cardCount: ... })

      toast({
        title: 'Card Added!',
        description: `The new card has been added to your deck.`,
      });
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error('Error creating card:', error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'Could not add the card. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2" /> Add a Card
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Add New Flashcard</DialogTitle>
          <DialogDescription>
            Enter the content for the front and back of your card.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="front-text">
              Front Text (Term/Question)
            </Label>
            <Textarea id="front-text" value={frontText} onChange={(e) => setFrontText(e.target.value)} className="min-h-[100px]" placeholder="e.g., What is the normal range for potassium?" />
          </div>
           <div className="grid gap-2">
            <Label htmlFor="back-text">
              Back Text (Definition/Answer)
            </Label>
            <Textarea id="back-text" value={backText} onChange={(e) => setBackText(e.target.value)} className="min-h-[100px]" placeholder="e.g., 3.5 to 5.0 mEq/L" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Card'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
