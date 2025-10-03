
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';

export function CreateQuizDialog() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setTitle('');
    setTopic('');
    setDescription('');
    setDifficulty('');
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not Logged In',
        description: 'You must be logged in to create a quiz.',
      });
      return;
    }

    if (!title || !topic || !difficulty) {
        toast({
            variant: 'destructive',
            title: 'Missing Fields',
            description: 'Please fill out the Title, Topic, and Difficulty.',
        });
        return;
    }

    setIsSaving(true);

    const quizzesRef = collection(firestore, 'users', user.uid, 'quizzes');
    const newQuiz = {
      userProfileId: user.uid,
      title,
      topic,
      difficulty,
      description,
      questionCount: 0,
    };

    try {
      await addDocumentNonBlocking(quizzesRef, newQuiz);
      toast({
        title: 'Quiz Created!',
        description: `Your new quiz "${title}" has been created.`,
      });
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'Could not create the quiz. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Quiz
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Create New Quiz</DialogTitle>
          <DialogDescription>
            A quiz is a collection of questions. Start by defining the quiz, then add questions to it.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-6">
            <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. NCLEX Pharmacology Practice" />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="topic">Topic</Label>
                <Input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Endocrine System Drugs" />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select onValueChange={setDifficulty} value={difficulty}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Easy">Easy</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                        <SelectItem value="NCLEX-level">NCLEX-level</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="description">
                Description (Optional)
                </Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[100px]" placeholder="Briefly describe what this quiz is about." />
            </div>
            </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Create Quiz'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
