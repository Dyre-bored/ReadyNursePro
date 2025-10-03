
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
import { Loader2, CheckCircle, XCircle, Trophy, Pill, Heart, Repeat } from 'lucide-react';
import { generateDrugGameScenario, type DrugGameScenario } from '@/ai/flows/generate-drug-game-flow';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, updateDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc, increment } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { updateLeaderboard } from '@/ai/flows/update-leaderboard-flow';

type GameState = 'menu' | 'loading' | 'playing' | 'result';
type AnswerState = 'unanswered' | 'correct' | 'incorrect';

const SCENARIO_BATCH_SIZE = 3;

export function DrugDashGame() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userProfile } = useDoc(userProfileRef);

  const [gameState, setGameState] = useState<GameState>('menu');
  const [answerState, setAnswerState] = useState<AnswerState>('unanswered');
  
  const [scenarioQueue, setScenarioQueue] = useState<DrugGameScenario[]>([]);
  const [currentScenario, setCurrentScenario] = useState<DrugGameScenario | null>(null);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [sessionScore, setSessionScore] = useState(0);
  
  const isFetching = useRef(false);

  // Use refs to hold the latest state for the cleanup function
  const sessionScoreRef = useRef(sessionScore);
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    sessionScoreRef.current = sessionScore;
    gameStateRef.current = gameState;
  }, [sessionScore, gameState]);

  useEffect(() => {
    // This cleanup function will run when the component unmounts.
    return () => {
      // Only award coins if a game was in progress when the user left.
      if (gameStateRef.current === 'playing' || gameStateRef.current === 'result') {
         if (user && sessionScoreRef.current > 0) {
            const userRef = doc(firestore, 'users', user.uid);
            const coinsEarned = Math.floor(sessionScoreRef.current / 15);
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
      const newScenarios = await generateDrugGameScenario({ count: SCENARIO_BATCH_SIZE });
      if (newScenarios.length > 0) {
        setScenarioQueue(prev => [...prev, ...newScenarios]);
      } else {
        throw new Error('AI returned no scenarios.');
      }
    } catch (error) {
      console.error('Failed to generate scenarios:', error);
      toast({
        variant: 'destructive',
        title: 'AI Error',
        description: 'Could not fetch new drug scenarios. Please try again.'
      });
      setGameState('menu');
    } finally {
        isFetching.current = false;
    }
  }, [toast]);

  useEffect(() => {
    if (gameState === 'loading' && scenarioQueue.length > 0) {
        const [next, ...rest] = scenarioQueue;
        setCurrentScenario(next);
        setScenarioQueue(rest);
        setAnswerState('unanswered');
        setGameState('playing');
    }

    if (gameState === 'playing' && scenarioQueue.length < SCENARIO_BATCH_SIZE && !isFetching.current) {
      fetchAndFillQueue();
    }
  }, [scenarioQueue, gameState, fetchAndFillQueue]);

  const advanceToNextScenario = () => {
    if (lives <= 0) {
        handleEndSession(true);
        return;
    }

    if (scenarioQueue.length > 0) {
      const [next, ...rest] = scenarioQueue;
      setCurrentScenario(next);
      setScenarioQueue(rest);
      setAnswerState('unanswered');
      setGameState('playing');
    } else {
      setGameState('loading');
      if (!isFetching.current) fetchAndFillQueue();
    }
  };
  
  const handleAnswer = (selectedDrug: string) => {
    if (!currentScenario) return;
    
    // Create a mutable copy to update userGuess
    const updatedScenario = { ...currentScenario, userGuess: selectedDrug };
    setCurrentScenario(updatedScenario);

    if (selectedDrug === currentScenario.correctDrug) {
      const points = 150 + Math.max(0, lives - 1) * 20;
      setAnswerState('correct');
      setScore((s) => s + points);
      setSessionScore((s) => s + points);
    } else {
      setAnswerState('incorrect');
      setLives(l => l - 1);
    }
    setGameState('result');
  };

  const handleNext = () => {
    advanceToNextScenario();
  };

  const handleEndSession = (gameOver = false) => {
    if (user && userProfile && sessionScore > 0) {
        // Update coins
        const coinsEarned = Math.floor(sessionScore / 15);
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
            gameId: 'drug-dash',
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
    setScenarioQueue([]);
    setCurrentScenario(null);
    setGameState('menu');
  };
  
  const handleStartGame = () => {
    setScore(0);
    setLives(3);
    setSessionScore(0);
    setScenarioQueue([]);
    setCurrentScenario(null);
    setGameState('loading');
    fetchAndFillQueue();
  };

  const renderContent = () => {
    switch (gameState) {
      case 'menu':
        return (
          <div className="text-center p-6 flex flex-col items-center justify-center flex-1">
             <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary mb-4 border-2 border-primary">
                <Pill className="h-10 w-10" />
            </div>
            <h3 className="font-headline text-xl font-semibold">Drug Dash</h3>
            <p className="text-muted-foreground mt-2 mb-4 max-w-sm">
              Read the patient case and choose the correct medication. You have 3 lives. Don't mis-medicate!
            </p>
            <Button size="lg" onClick={handleStartGame}>Start Game</Button>
          </div>
        );
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground flex-1">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p>Preparing the pharmacy...</p>
          </div>
        );
      case 'playing':
      case 'result':
        if (!currentScenario) return null;
        return (
          <>
            <CardHeader className="pb-4">
              <CardTitle className="font-headline text-center">Which drug is indicated?</CardTitle>
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
            </CardHeader>
            <CardContent className="w-full">
              <div className='p-4 rounded-lg bg-muted/50 mb-4'>
                <p className="text-sm">{currentScenario.scenario}</p>
              </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentScenario.options.map((drug) => {
                         const isCorrect = drug === currentScenario.correctDrug;
                         const isSelected = drug === currentScenario.userGuess;
                         const variant = gameState === 'result' ? (isCorrect ? 'correct' : (isSelected ? 'incorrect' : 'outline')) : 'outline';

                        return (
                            <Button
                                key={drug}
                                variant={variant as any}
                                size="lg"
                                className={cn("h-auto py-3 whitespace-normal justify-center text-center text-base", {
                                    'bg-green-100 border-green-400 text-green-800 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700': variant === 'correct',
                                    'bg-red-100 border-red-400 text-red-800 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700': variant === 'incorrect',
                                })}
                                onClick={() => gameState === 'playing' && handleAnswer(drug)}
                                disabled={gameState === 'result'}
                            >
                                {drug}
                            </Button>
                        )
                    })}
                </div>
              
              {gameState === 'result' && (
                <>
                  <Alert variant={answerState === 'correct' ? 'default' : 'destructive'} className={cn(
                    "mt-4",
                    answerState === 'correct' && 'border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 [&>svg]:text-green-700 dark:[&>svg]:text-green-300',
                    answerState === 'incorrect' && 'border-red-500 bg-red-50 dark:bg-red-950'
                  )}>
                    {answerState === 'correct' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    <AlertTitle className="font-headline">
                      {answerState === 'correct' ? 'Correct!' : 'Incorrect!'}
                    </AlertTitle>
                    <AlertDescription>
                      {currentScenario.explanation}
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
