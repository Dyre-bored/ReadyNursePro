
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
import { Target, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';

export function CreateGoalDialog() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [goalType, setGoalType] = useState('Weekly');
  const [isSaving, setIsSaving] = useState(false);
  const [endDate, setEndDate] = useState<Date | undefined>(addDays(new Date(), 7));

  const resetForm = () => {
    setDescription('');
    setGoalType('Weekly');
    setEndDate(addDays(new Date(), 7));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not Logged In',
        description: 'You must be logged in to create a goal.',
      });
      return;
    }

    if (!description || !goalType || !endDate) {
        toast({
            variant: 'destructive',
            title: 'Missing Fields',
            description: 'Please fill out all fields.',
        });
        return;
    }

    setIsSaving(true);

    const goalsRef = collection(firestore, 'users', user.uid, 'userGoals');
    const newGoal = {
      userProfileId: user.uid,
      description,
      goalType,
      startDate: new Date().toISOString(),
      endDate: endDate.toISOString(),
      isCompleted: false,
    };

    try {
      await addDocumentNonBlocking(goalsRef, newGoal);
      toast({
        title: 'Goal Set!',
        description: `Your new goal has been added.`,
      });
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'Could not set the goal. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleGoalTypeChange = (value: string) => {
    setGoalType(value);
    switch (value) {
        case 'Daily':
            setEndDate(addDays(new Date(), 1));
            break;
        case 'Weekly':
            setEndDate(addDays(new Date(), 7));
            break;
        case 'Monthly':
            setEndDate(addDays(new Date(), 30));
            break;
        default:
            setEndDate(undefined);
            break;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Set New Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Set a New Study Goal
          </DialogTitle>
          <DialogDescription>
            What do you want to accomplish? Be specific!
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="description">Goal Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Review 50 Pharmacology flashcards" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="goalType">Goal Type</Label>
             <Select onValueChange={handleGoalTypeChange} value={goalType}>
                <SelectTrigger id="goalType">
                    <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
            </Select>
          </div>
           <div className="grid gap-2">
                <Label htmlFor="end-date">Target End Date</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                        )}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Set Goal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
