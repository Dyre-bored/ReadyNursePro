
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { ArrowLeft, ArrowRight, CheckCircle, Gamepad2, LayoutGrid, ClipboardCheck, ShoppingBag } from 'lucide-react';
import { DocumentReference } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase';

const tutorialSteps = [
  {
    title: 'Welcome to ReadyNurse Pro!',
    description: "Let's take a quick tour of your new study companion. This dashboard is your home base.",
    icon: null,
  },
  {
    title: 'Flashcards & Quizzes',
    description: 'Use the sidebar to navigate to Flashcards or Quizzes. You can create your own study sets or use our AI to generate them for you!',
    icon: LayoutGrid,
    icon2: ClipboardCheck,
  },
  {
    title: 'Games & Tools',
    description: 'Sharpen your skills with fun games like "Vital Signs Crisis" and use essential tools like the Drug Dosage Calculator.',
    icon: Gamepad2,
  },
  {
    title: 'Earn Coins & Rewards',
    description: 'Playing games earns you coins! Visit the Shop to unlock cool features like custom avatars and profile badges.',
    icon: ShoppingBag,
  },
];

interface WelcomeTutorialProps {
  userProfileRef?: DocumentReference;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onFinish?: () => void;
}

export function WelcomeTutorial({ userProfileRef, isOpen, onOpenChange, onFinish }: WelcomeTutorialProps) {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < tutorialSteps.length - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleFinish = () => {
    if (onFinish) {
        onFinish(); // This will call the logic to update firestore
    }
    onOpenChange(false); // Close the dialog
    setTimeout(() => setStep(0), 300); // Reset for next time
  };

  const currentStep = tutorialSteps[step];
  const StepIcon = currentStep.icon;
  const StepIcon2 = currentStep.icon2;


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent onInteractOutside={(e) => {
          if(userProfileRef) e.preventDefault(); // Prevent closing during initial forced tutorial
      }}>
        <DialogHeader className="text-center items-center">
            {StepIcon && (
              <div className="flex gap-4">
                 <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <StepIcon className="h-8 w-8" />
                 </div>
                 {StepIcon2 && (
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                        <StepIcon2 className="h-8 w-8" />
                    </div>
                 )}
              </div>
            )}
          <DialogTitle className="font-headline text-2xl">{currentStep.title}</DialogTitle>
          <DialogDescription className="text-base pt-2">{currentStep.description}</DialogDescription>
        </DialogHeader>

        <div className="flex justify-center items-center my-4">
            {tutorialSteps.map((_, index) => (
                <div key={index} className={`h-2 w-2 rounded-full mx-1 ${index === step ? 'bg-primary' : 'bg-muted'}`} />
            ))}
        </div>

        <DialogFooter>
          {step > 0 && (
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="mr-2" /> Back
            </Button>
          )}
          <Button onClick={handleNext} className="ml-auto">
            {step === tutorialSteps.length - 1 ? 'Finish' : 'Next'}
            {step < tutorialSteps.length - 1 ? <ArrowRight className="ml-2" /> : <CheckCircle className="ml-2" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
