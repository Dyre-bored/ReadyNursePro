
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
import { PlusCircle, X, Plus } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';

export function AddQuestionDialog({ quizId }: { quizId: string }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [questionType, setQuestionType] = useState('Multiple Choice');
  const [questionText, setQuestionText] = useState('');
  const [correctAnswers, setCorrectAnswers] = useState(['']);
  const [incorrectAnswers, setIncorrectAnswers] = useState(['', '', '']);
  const [explanation, setExplanation] = useState('');


  const resetForm = () => {
    setQuestionType('Multiple Choice');
    setQuestionText('');
    setCorrectAnswers(['']);
    setIncorrectAnswers(['', '', '']);
    setExplanation('');
  };

  const handleCorrectAnswerChange = (index: number, value: string) => {
    const newAnswers = [...correctAnswers];
    newAnswers[index] = value;
    setCorrectAnswers(newAnswers);
  };
   const handleAddCorrectAnswer = () => {
    setCorrectAnswers([...correctAnswers, '']);
  };
  const handleRemoveCorrectAnswer = (index: number) => {
    if (correctAnswers.length > 1) {
      const newAnswers = correctAnswers.filter((_, i) => i !== index);
      setCorrectAnswers(newAnswers);
    }
  };


  const handleIncorrectAnswerChange = (index: number, value: string) => {
    const newAnswers = [...incorrectAnswers];
    newAnswers[index] = value;
    setIncorrectAnswers(newAnswers);
  };
   const handleAddIncorrectAnswer = () => {
    setIncorrectAnswers([...incorrectAnswers, '']);
  };
  const handleRemoveIncorrectAnswer = (index: number) => {
    if (incorrectAnswers.length > 1) {
      const newAnswers = incorrectAnswers.filter((_, i) => i !== index);
      setIncorrectAnswers(newAnswers);
    }
  };


  const handleSubmit = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not Logged In' });
      return;
    }

    if (
      !questionText ||
      correctAnswers.some(ans => !ans.trim()) ||
      incorrectAnswers.some(ans => !ans.trim())
    ) {
        toast({
            variant: 'destructive',
            title: 'Missing Fields',
            description: 'Please fill out the question and all answer fields.',
        });
        return;
    }
    
    if (questionType === 'Multiple Choice' && correctAnswers.length > 1) {
        toast({
            variant: 'destructive',
            title: 'Invalid Input',
            description: 'Multiple Choice questions can only have one correct answer.',
        });
        return;
    }

    setIsSaving(true);

    const questionsRef = collection(firestore, 'users', user.uid, 'quizzes', quizId, 'questions');
    const newQuestion = {
      quizId,
      questionType,
      questionText,
      correctAnswer: questionType === 'Multiple Choice' ? correctAnswers[0] : correctAnswers,
      incorrectAnswers: incorrectAnswers.filter(ans => ans.trim() !== ''),
      explanation,
    };

    try {
      await addDocumentNonBlocking(questionsRef, newQuestion);
      toast({
        title: 'Question Added!',
        description: 'The new question has been added to your quiz.',
      });
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error('Error creating question:', error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'Could not add the question. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) resetForm();
        setOpen(isOpen);
    }}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Question
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Add New Question</DialogTitle>
          <DialogDescription>
            Build your quiz by adding questions one by one.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] pr-6 -mr-2">
            <div className="grid gap-6 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="question-type">Question Type</Label>
                    <Select onValueChange={(value) => {
                        setQuestionType(value);
                        // Reset answers when type changes
                        setCorrectAnswers(['']);
                        setIncorrectAnswers(['','','']);
                    }} value={questionType}>
                        <SelectTrigger id="question-type">
                            <SelectValue placeholder="Select a question type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Multiple Choice">Multiple Choice</SelectItem>
                            <SelectItem value="Select All That Apply">Select All That Apply</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="question-text">Question Text</Label>
                    <Textarea id="question-text" value={questionText} onChange={(e) => setQuestionText(e.target.value)} placeholder="e.g., Which of the following is a common side effect of beta-blockers?" className="min-h-28" />
                </div>
                
                <div className="grid gap-4">
                    {correctAnswers.map((answer, index) => (
                        <div key={index} className="grid gap-2">
                            <Label htmlFor={`correct-answer-${index}`} className="text-green-600">Correct Answer #{index + 1}</Label>
                            <div className="flex items-center gap-2">
                                <Input id={`correct-answer-${index}`} value={answer} onChange={(e) => handleCorrectAnswerChange(index, e.target.value)} placeholder="Enter a correct answer"/>
                                {questionType === 'Select All That Apply' && (
                                     <Button variant="ghost" size="icon" onClick={() => handleRemoveCorrectAnswer(index)} disabled={correctAnswers.length <= 1}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                    {questionType === 'Select All That Apply' && (
                        <Button variant="outline" size="sm" onClick={handleAddCorrectAnswer} className="w-fit">
                            <Plus className="mr-2 h-4 w-4" /> Add Correct Answer
                        </Button>
                    )}

                    {incorrectAnswers.map((answer, index) => (
                         <div key={index} className="grid gap-2">
                            <Label htmlFor={`incorrect-answer-${index}`} className="text-red-600">Incorrect Answer #{index + 1}</Label>
                            <div className="flex items-center gap-2">
                                <Input id={`incorrect-answer-${index}`} value={answer} onChange={(e) => handleIncorrectAnswerChange(index, e.target.value)} placeholder={`Enter an incorrect answer`}/>
                                {questionType === 'Select All That Apply' && (
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveIncorrectAnswer(index)} disabled={incorrectAnswers.length <= 1}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                     {questionType === 'Select All That Apply' && (
                        <Button variant="outline" size="sm" onClick={handleAddIncorrectAnswer} className="w-fit">
                            <Plus className="mr-2 h-4 w-4" /> Add Incorrect Answer
                        </Button>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="explanation">Explanation (Optional)</Label>
                    <Textarea id="explanation" value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="Explain why the correct answer is right and the others are wrong." />
                </div>
            </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Question'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    
