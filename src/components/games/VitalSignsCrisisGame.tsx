
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
import { Loader2, CheckCircle, XCircle, Trophy, Zap, Heart } from 'lucide-react';
import { generatePatientScenarios, type PatientScenario } from '@/ai/flows/generate-vital-sign-flow';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '../ui/separator';
import { Label } from '@/components/ui/label';
import { useUser, useFirestore, useDoc, updateDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc, increment } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { updateLeaderboard } from '@/ai/flows/update-leaderboard-flow';

type GameState = 'menu' | 'loading' | 'playing' | 'result';
type AnswerState = 'unanswered' | 'correct' | 'incorrect';

const SCENARIO_BATCH_SIZE = 3;
const REFILL_THRESHOLD = 1;

export function VitalSignsCrisisGame() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userProfile } = useDoc(userProfileRef);

  const [gameState, setGameState] = useState<GameState>('menu');
  const [answerState, setAnswerState] = useState<AnswerState>('unanswered');
  
  const [scenarioQueue, setScenarioQueue] = useState<PatientScenario[]>([]);
  const [currentScenario, setCurrentScenario] = useState<PatientScenario | null>(null);

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [patientType, setPatientType] = useState('adult');
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
            const coinsEarned = Math.floor(sessionScoreRef.current / 10);
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
      const newScenarios = await generatePatientScenarios({ patientType: patientType as any, count: SCENARIO_BATCH_SIZE });
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
        description: 'Could not fetch new patient scenarios. The game will return to the menu.'
      });
      // If fetching fails, we should reset to the menu state
      setGameState('menu');
    } finally {
        isFetching.current = false;
    }
  }, [patientType, toast]);

  // Effect to manage the scenario queue and game state transitions
  useEffect(() => {
    // If we are in the playing state and the queue is getting low, pre-fetch more scenarios.
    if (gameState === 'playing' && scenarioQueue.length <= REFILL_THRESHOLD && !isFetching.current) {
      fetchAndFillQueue();
    }
    
    // If the game is in the 'loading' state and scenarios have arrived in the queue, start the next one.
    if (gameState === 'loading' && scenarioQueue.length > 0) {
        const [next, ...rest] = scenarioQueue;
        setCurrentScenario(next);
        setScenarioQueue(rest);
        setAnswerState('unanswered');
        setGameState('playing');
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
      // Queue is empty, enter loading state and wait for useEffect to pick up new scenarios
      setGameState('loading');
      if (!isFetching.current) {
        fetchAndFillQueue();
      }
    }
  };
  
  const handleAnswer = (userAnswer: boolean) => {
    if (!currentScenario) return;

    if (userAnswer === currentScenario.isNormal) {
      const points = 100 + streak * 10;
      setAnswerState('correct');
      setScore((s) => s + points);
      setSessionScore((s) => s + points);
      setStreak((s) => s + 1);
    } else {
      setAnswerState('incorrect');
      setLives(l => l - 1);
      setStreak(0);
    }
    setGameState('result');
  };

  const handleNext = () => {
    advanceToNextScenario();
  };

  const handleEndSession = (gameOver = false) => {
    if (user && userProfile && sessionScore > 0) {
        // Update coins
        const coinsEarned = Math.floor(sessionScore / 10);
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
            gameId: 'vitals-crisis',
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
    setStreak(0);
    setSessionScore(0);
    setScenarioQueue([]);
    setCurrentScenario(null);
    setGameState('menu');
  };
  
  const handleStartGame = () => {
    setScore(0);
    setStreak(0);
    setLives(3);
    setSessionScore(0);
    setScenarioQueue([]);
    setCurrentScenario(null);
    setGameState('loading');
    // We clear the queue and fetch a fresh batch to start
    fetchAndFillQueue();
  };

  const renderContent = () => {
    switch (gameState) {
      case 'menu':
        return (
          <div className="text-center p-6 flex flex-col items-center justify-center flex-1">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary mb-4 border-2 border-primary">
                <Zap className="h-10 w-10" />
            </div>
            <h3 className="font-headline text-xl font-semibold">Vital Signs Crisis</h3>
            <p className="text-muted-foreground mt-2 mb-4">
              Assess the patient scenario and determine if the vital signs are Normal or Abnormal. You have 3 lives.
            </p>
             <div className="max-w-xs w-full mx-auto mb-6">
              <Label htmlFor="patient-type-select">Select Patient Type</Label>
              <Select value={patientType} onValueChange={setPatientType}>
                <SelectTrigger id="patient-type-select">
                  <SelectValue placeholder="Select Patient Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="adult">Adult</SelectItem>
                  <SelectItem value="pediatric">Pediatric</SelectItem>
                  <SelectItem value="geriatric">Geriatric</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button size="lg" onClick={handleStartGame}>Start Game</Button>
          </div>
        );
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground flex-1">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p>Generating new patient scenarios...</p>
          </div>
        );
      case 'playing':
      case 'result':
        if (!currentScenario) return null;
        return (
          <>
            <CardHeader className="text-center pb-4">
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="font-bold text-lg text-foreground">{score}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-500" />
                  <span className="font-bold text-lg text-foreground">{streak}x</span>
                </div>
                <div className="flex items-center gap-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Heart key={i} className={cn("h-6 w-6", i < lives ? "text-destructive fill-destructive" : "text-muted-foreground/50")} />
                  ))}
                </div>
              </div>
              <Separator className="mt-4" />
              <CardTitle className="font-headline pt-4">Patient Scenario</CardTitle>
              <CardDescription>{currentScenario.patientDescription}</CardDescription>
            </CardHeader>
            <CardContent className="w-full max-w-md mx-auto">
              <div className='space-y-4'>
                {currentScenario.vitals.map((vital, index) => (
                  <div key={index} className='flex items-center justify-between text-lg'>
                    <span className="text-muted-foreground">{vital.name}</span>
                    <div className='flex items-center gap-3'>
                      <span className={cn(
                        "font-bold font-code",
                         gameState === 'result' && (vital.isNormal ? 'text-green-600' : 'text-destructive')
                      )}>
                        {vital.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              {gameState === 'result' && (
                <>
                  <Separator className="my-6" />
                  <Alert variant={answerState === 'correct' ? 'default' : 'destructive'} className={cn(
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
                {gameState === 'playing' ? (
                     <div className="flex flex-col items-center gap-4">
                        <h3 className="font-headline text-lg">Is this set of vital signs normal?</h3>
                        <div className="flex justify-center gap-4">
                            <Button size="lg" className="bg-destructive hover:bg-destructive/90 w-32" onClick={() => handleAnswer(false)}>Abnormal</Button>
                            <Button size="lg" className="bg-green-600 hover:bg-green-700 w-32" onClick={() => handleAnswer(true)}>Normal</Button>
                        </div>
                        <Button variant="link" size="sm" onClick={() => handleEndSession()}>Exit to Main Menu</Button>
                    </div>
                ) : (
                    <div className="flex justify-center gap-4">
                        <Button size="lg" onClick={handleNext}>
                          {lives > 0 ? 'Next Scenario' : 'View Results'}
                        </Button>
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
