
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, RefreshCw, Trophy, CheckSquare, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

type Question = {
  id: string;
  questionType: 'Multiple Choice' | 'Select All That Apply';
  questionText: string;
  correctAnswer: string | string[];
  incorrectAnswers: string[];
  explanation?: string;
};

interface QuizPlayerProps {
  questions: Question[];
  onQuizComplete: (score: number) => void;
}

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

export function QuizPlayer({ questions, onQuizComplete }: QuizPlayerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // For SATA, selectedAnswer will be an array of strings
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = useMemo(() => questions[currentQuestionIndex], [questions, currentQuestionIndex]);
  const isSATA = currentQuestion?.questionType === 'Select All That Apply';

  const answerOptions = useMemo(() => {
    if (!currentQuestion) return [];
    const correct = Array.isArray(currentQuestion.correctAnswer) ? currentQuestion.correctAnswer : [currentQuestion.correctAnswer];
    return shuffleArray([...correct, ...currentQuestion.incorrectAnswers]);
  }, [currentQuestion]);

  useEffect(() => {
    // When the quiz is finished, call the onQuizComplete callback
    if (showResults) {
      const finalScore = Math.round((score / questions.length) * 100);
      onQuizComplete(finalScore);
    }
  }, [showResults, score, questions.length, onQuizComplete]);

  const handleSATASelect = (answer: string) => {
    if (isAnswered) return;
    setSelectedAnswers(prev => 
      prev.includes(answer) ? prev.filter(a => a !== answer) : [...prev, answer]
    );
  };
  
  const handleSubmitAnswer = () => {
    if (isAnswered) return;

    let isCorrect = false;
    if (isSATA) {
        const correctAnswers = currentQuestion.correctAnswer as string[];
        // Correct if the selected answers match the correct answers exactly
        isCorrect = selectedAnswers.length === correctAnswers.length &&
                    selectedAnswers.every(answer => correctAnswers.includes(answer));
    } else {
        isCorrect = selectedAnswers.length === 1 && selectedAnswers[0] === currentQuestion.correctAnswer;
    }

    if (isCorrect) {
        setScore(prev => prev + 1);
    }
    
    setIsAnswered(true);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setIsAnswered(false);
      setSelectedAnswers([]);
    } else {
      setShowResults(true);
    }
  };
  
  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswers([]);
    setIsAnswered(false);
    setShowResults(false);
  }

  const progress = useMemo(() => {
    return ((currentQuestionIndex + (isAnswered ? 1: 0)) / questions.length) * 100;
  }, [currentQuestionIndex, isAnswered, questions.length]);

  if (showResults) {
    const finalScore = Math.round((score / questions.length) * 100);
    return (
        <Card className="w-full max-w-2xl text-center">
            <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4 border-2 border-primary">
                    <Trophy className="h-8 w-8" />
                </div>
                <CardTitle className="font-headline text-3xl">Quiz Complete!</CardTitle>
                <CardDescription>You scored</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-6xl font-bold">{finalScore}%</p>
                <p className="text-muted-foreground mt-2">{score} out of {questions.length} correct</p>
            </CardContent>
            <CardFooter className="justify-center">
                 <Button onClick={handleRestart}>
                    <RefreshCw className="mr-2" />
                    Take Again
                </Button>
            </CardFooter>
        </Card>
    );
  }
  
  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="w-full max-w-3xl flex flex-col gap-8">
        {/* Progress Bar */}
        <div>
            <div className="flex justify-between mb-1 text-sm text-muted-foreground">
                <span>Progress</span>
                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            </div>
            <Progress value={progress} />
        </div>

        {/* Question Card */}
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl font-normal">{currentQuestion.questionText}</CardTitle>
                {isSATA && !isAnswered && <CardDescription>Select all that apply.</CardDescription>}
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {answerOptions.map(answer => {
                    const isSelected = selectedAnswers.includes(answer);
                    const correctAnswerSet = Array.isArray(currentQuestion.correctAnswer) ? currentQuestion.correctAnswer : [currentQuestion.correctAnswer];
                    const isCorrectChoice = correctAnswerSet.includes(answer);

                    return (
                        <Button
                            key={answer}
                            variant="outline"
                            size="lg"
                            className={cn(
                                "h-auto py-4 whitespace-normal justify-start text-left",
                                isSelected && !isAnswered && "bg-accent/50 border-accent",
                                isAnswered && isCorrectChoice && "bg-green-100 border-green-400 text-green-800 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700",
                                isAnswered && isSelected && !isCorrectChoice && "bg-red-100 border-red-400 text-red-800 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700"
                            )}
                            onClick={() => isSATA ? handleSATASelect(answer) : setSelectedAnswers([answer])}
                            disabled={isAnswered && !isSATA}
                        >
                            {isSATA ? (
                                isSelected ? <CheckSquare className="mr-3 text-primary"/> : <Square className="mr-3"/>
                            ) : (
                                isAnswered && (
                                    isCorrectChoice ? <CheckCircle className="mr-3 text-green-600" /> :
                                    isSelected && !isCorrectChoice ? <XCircle className="mr-3 text-destructive" /> : 
                                    <span className="mr-3 h-4 w-4"/>
                                )
                            )}
                            {answer}
                        </Button>
                    );
                })}
            </CardContent>
            
            <CardFooter className="flex-col items-start gap-4 border-t pt-6">
                {isAnswered ? (
                    <>
                        {currentQuestion.explanation && (
                            <div className="prose prose-sm text-muted-foreground">
                                <p className="font-semibold text-foreground">Explanation</p>
                                <p>{currentQuestion.explanation}</p>
                            </div>
                        )}
                        <Button onClick={handleNext} className="ml-auto">
                            {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'View Results'}
                        </Button>
                    </>
                ) : (
                    <Button onClick={handleSubmitAnswer} className="ml-auto" disabled={selectedAnswers.length === 0}>
                        Submit Answer
                    </Button>
                )}
            </CardFooter>
        </Card>
    </div>
  );
}

    
