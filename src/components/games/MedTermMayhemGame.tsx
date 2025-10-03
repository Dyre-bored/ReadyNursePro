
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Trophy, SpellCheck, Heart, Repeat, TimerIcon } from 'lucide-react';
import { generateMedTermQuestions, type MedTermQuestion } from '@/ai/flows/generate-med-term-flow';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, updateDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc, increment } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { updateLeaderboard } from '@/ai/flows/update-leaderboard-flow';


type GameState = 'menu' | 'loading' | 'playing' | 'result';
type AnswerState = 'unanswered' | 'correct' | 'incorrect' | 'timeout';

const QUESTION_BATCH_SIZE = 5;
const TIME_PER_QUESTION = 15; // 15 seconds

export function MedTermMayhemGame() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userProfile } = useDoc(userProfileRef);

  const [gameState, setGameState] = useState<GameState>('menu');
  const [answerState, setAnswerState] = useState<AnswerState>('unanswered');
  
  const [questionQueue, setQuestionQueue] = useState<MedTermQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<MedTermQuestion | null>(null);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [sessionScore, setSessionScore] = useState(0);

  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const isFetching = useRef(false);

  // Use refs to hold the latest state for the cleanup function
  const sessionScoreRef = useRef(sessionScore);
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    sessionScoreRef.current = sessionScore;
    gameStateRef.current = gameState;
  }, [sessionScore, gameState]);

  const clearTimer = () => {
    if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
    }
  };

  useEffect(() => {
    // This cleanup function will run when the component unmounts.
    return () => {
      clearTimer();
      // Only award coins if a game was in progress when the user left.
      if (gameStateRef.current === 'playing' || gameStateRef.current === 'result') {
         if (user && sessionScoreRef.current > 0) {
            const userRef = doc(firestore, 'users', user.uid);
            const coinsEarned = Math.floor(sessionScoreRef.current / 12);
            if (coinsEarned > 0) {
                updateDocumentNonBlocking(userRef, {
                  coins: increment(coinsEarned),
                });
                console.log(`Awarded ${coinsEarned} coins on exit.`);
            }
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, firestore]);

  const fetchAndFillQueue = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    
    try {
      const newQuestions = await generateMedTermQuestions({ count: QUESTION_BATCH_SIZE });
      if (newQuestions.length > 0) {
        setQuestionQueue(prev => [...prev, ...newQuestions]);
      } else {
        throw new Error('AI returned no questions.');
      }
    } catch (error) {
      console.error('Failed to generate questions:', error);
      toast({
        variant: 'destructive',
        title: 'AI Error',
        description: 'Could not fetch new questions. Please try again.'
      });
      setGameState('menu');
    } finally {
        isFetching.current = false;
    }
  }, [toast]);

  useEffect(() => {
    if (gameState === 'loading' && questionQueue.length > 0) {
        const [next, ...rest] = questionQueue;
        setCurrentQuestion(next);
        setQuestionQueue(rest);
        setAnswerState('unanswered');
        setGameState('playing');
    }

    if (gameState === 'playing' && questionQueue.length < QUESTION_BATCH_SIZE / 2 && !isFetching.current) {
      fetchAndFillQueue();
    }
  }, [questionQueue, gameState, fetchAndFillQueue]);

  useEffect(() => {
    if (gameState === 'playing' && answerState === 'unanswered') {
        setTimeLeft(TIME_PER_QUESTION);
        clearTimer();
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearTimer();
                    handleTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    } else {
        clearTimer();
    }

    return clearTimer;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, currentQuestion]);

  const advanceToNextQuestion = () => {
    if (lives <= 0) {
        handleEndSession(true);
        return;
    }

    if (questionQueue.length > 0) {
      const [next, ...rest] = questionQueue;
      setCurrentQuestion(next);
      setQuestionQueue(rest);
      setAnswerState('unanswered');
      setGameState('playing');
    } else {
      setGameState('loading');
      if (!isFetching.current) fetchAndFillQueue();
    }
  };
  
  const handleAnswer = (selectedAnswer: string) => {
    if (!currentQuestion || answerState !== 'unanswered') return;
    
    const updatedQuestion = { ...currentQuestion, userGuess: selectedAnswer };
    setCurrentQuestion(updatedQuestion);

    if (selectedAnswer === currentQuestion.correctAnswer) {
      const points = 80 + Math.max(0, lives - 1) * 10;
      setAnswerState('correct');
      setScore((s) => s + points);
      setSessionScore((s) => s + points);
    } else {
      setAnswerState('incorrect');
      setLives(l => l - 1);
    }
    setGameState('result');
  };
  
  const handleTimeout = () => {
    if (answerState !== 'unanswered') return; // Prevent multiple triggers
    setAnswerState('timeout');
    setLives(l => l - 1);
    setGameState('result');
  };

  const handleNext = () => {
    advanceToNextQuestion();
  };

  const handleEndSession = (gameOver = false) => {
    if (user && userProfile && sessionScore > 0) {
        // Update coins
        const coinsEarned = Math.floor(sessionScore / 12);
        if (coinsEarned > 0) {
            updateDocumentNonBlocking(doc(firestore, 'users', user.uid), {
            coins: increment(coinsEarned),
            });
            toast({
            title: gameOver ? 'Game Over!' : 'Session Ended',
            description: `You earned ${coinsEarned} coins!`,
            });
        }

        // Update leaderboard
        updateLeaderboard({
            gameId: 'medterm-mayhem',
            score: sessionScore,
            userId: user.uid,
            userName: userProfile.name,
            userAvatarUrl: userProfile.profilePictureUrl,
            userSelectedBorderId: userProfile.selectedBorderId
        });

    } else if (gameOver) {
         toast({
          title: 'Game Over!',
          description: `Better luck next time!`,
        });
    }

    setScore(0);
    setSessionScore(0);
    setQuestionQueue([]);
    setCurrentQuestion(null);
    setGameState('menu');
  };
  
  const handleStartGame = () => {
    setScore(0);
    setLives(3);
    setSessionScore(0);
    setQuestionQueue([]);
    setCurrentQuestion(null);
    setGameState('loading');
    fetchAndFillQueue();
  };

  const renderContent = () => {
    switch (gameState) {
      case 'menu':
        return (
          <div className="text-center p-6 flex flex-col items-center justify-center flex-1">
             <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary mb-4 border-2 border-primary">
                <SpellCheck className="h-10 w-10" />
            </div>
            <h3 className="font-headline text-xl font-semibold">MedTerm Mayhem</h3>
            <p className="text-muted-foreground mt-2 mb-4 max-w-sm">
              Define medical terms and abbreviations against the clock. You have 3 lives.
            </p>
            <Button size="lg" onClick={handleStartGame}>Start Game</Button>
          </div>
        );
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground flex-1">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p>Compiling medical dictionary...</p>
          </div>
        );
      case 'playing':
      case 'result':
        if (!currentQuestion) return null;
        const timeProgress = (timeLeft / TIME_PER_QUESTION) * 100;
        return (
          <>
            <CardHeader className="pb-4">
              <CardTitle className="font-headline text-center">{currentQuestion.question}</CardTitle>
               <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        <span className="font-bold text-lg text-foreground">{score}</span>
                    </div>
                     <div className="flex items-center gap-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Heart key={i} className={cn("h-6 w-6", i < lives ? "text-destructive fill-destructive" : "text-muted-foreground/50")}/>
                        ))}
                    </div>
                </div>
                <div className="pt-4 space-y-2">
                  <Progress value={timeProgress} className={cn("h-2", timeProgress < 25 && "bg-destructive")} />
                  <div className="flex items-center justify-center text-xs text-muted-foreground gap-1">
                    <TimerIcon className="h-3 w-3"/>
                    <span>{timeLeft}s</span>
                  </div>
                </div>
            </CardHeader>
            <CardContent className="w-full">
              <div className='p-4 rounded-lg bg-muted/50 mb-4 text-center'>
                <p className="text-2xl font-bold font-headline">{currentQuestion.term}</p>
              </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentQuestion.options.map((option) => {
                         const isCorrect = option === currentQuestion.correctAnswer;
                         const isSelected = option === currentQuestion.userGuess;
                         let variant = 'outline';
                          if (gameState === 'result') {
                              if (isCorrect) variant = 'correct';
                              else if (isSelected) variant = 'incorrect';
                          }

                        return (
                            <Button
                                key={option}
                                variant={variant as any}
                                size="lg"
                                className={cn("h-auto py-3 whitespace-normal justify-center text-center text-base", {
                                    'bg-green-100 border-green-400 text-green-800 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700': variant === 'correct',
                                    'bg-red-100 border-red-400 text-red-800 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700': variant === 'incorrect',
                                })}
                                onClick={() => gameState === 'playing' && handleAnswer(option)}
                                disabled={gameState === 'result'}
                            >
                                {option}
                            </Button>
                        )
                    })}
                </div>
              
              {gameState === 'result' && (
                <>
                  <Alert variant={answerState === 'correct' ? 'default' : 'destructive'} className={cn(
                    "mt-4",
                    answerState === 'correct' && 'border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 [&>svg]:text-green-700 dark:[&>svg]:text-green-300',
                    (answerState === 'incorrect' || answerState === 'timeout') && 'border-red-500 bg-red-50 dark:bg-red-950'
                  )}>
                    {answerState === 'correct' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    <AlertTitle className="font-headline">
                      {answerState === 'correct' ? 'Correct!' : (answerState === 'timeout' ? "Time's Up!" : 'Incorrect!')}
                    </AlertTitle>
                    <AlertDescription>
                      {currentQuestion.explanation}
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </CardContent>

            <CardFooter className="flex-col gap-4 pt-6">
                {gameState === 'result' ? (
                     <div className="flex justify-center gap-4">
                        <Button size="lg" onClick={handleNext}>
                          {lives > 0 ? 'Next Question' : 'View Results'}
                        </Button>
                    </div>
                ) : (
                     <div className="text-center">
                        <Button variant="link" size="sm" onClick={() => handleEndSession()}>Exit to Main Menu</Button>
                    </div>
                )}
            </CardFooter>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="w-full flex flex-col min-h-[500px]">
        {renderContent()}
    </Card>
  );
}
