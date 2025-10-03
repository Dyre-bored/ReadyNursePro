
'use client';

import { useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from './ui/skeleton';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { format, isPast } from 'date-fns';
import { CreateGoalDialog } from './CreateGoalDialog';
import { Target } from 'lucide-react';

interface UserGoal {
  id: string;
  description: string;
  goalType: string;
  startDate: string;
  endDate: string;
  isCompleted: boolean;
}

export function UserGoals() {
  const { user } = useUser();
  const firestore = useFirestore();
  
  const goalsQuery = useMemoFirebase(() => {
    if (user) {
      return query(
        collection(firestore, 'users', user.uid, 'userGoals'),
        orderBy('endDate', 'desc')
      );
    }
    return null;
  }, [user, firestore]);

  const { data: goals, isLoading } = useCollection<UserGoal>(goalsQuery);
  
  const handleGoalToggle = (goalId: string, isCompleted: boolean) => {
    if (!user) return;
    const goalRef = doc(firestore, 'users', user.uid, 'userGoals', goalId);
    updateDocumentNonBlocking(goalRef, { isCompleted: !isCompleted });
  };
  
  const activeGoals = useMemo(() => goals?.filter(g => !g.isCompleted && !isPast(new Date(g.endDate))) || [], [goals]);
  const completedGoals = useMemo(() => goals?.filter(g => g.isCompleted) || [], [goals]);
  const expiredGoals = useMemo(() => goals?.filter(g => !g.isCompleted && isPast(new Date(g.endDate))) || [], [goals]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Study Goals</CardTitle>
          <CardDescription>Set and track your study objectives to stay motivated.</CardDescription>
        </div>
        <CreateGoalDialog />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : goals && goals.length > 0 ? (
          <div className="space-y-6">
            <div>
              <h3 className="font-headline text-base font-medium mb-2 text-primary">Active Goals</h3>
              {activeGoals.length > 0 ? (
                <div className="space-y-2">
                    {activeGoals.map(goal => (
                        <div key={goal.id} className="flex items-center gap-4 rounded-md border p-3">
                           <Checkbox 
                             id={`goal-${goal.id}`} 
                             checked={goal.isCompleted}
                             onCheckedChange={() => handleGoalToggle(goal.id, goal.isCompleted)}
                           />
                           <div className="flex-1">
                             <label htmlFor={`goal-${goal.id}`} className="font-medium">{goal.description}</label>
                             <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                               <Badge variant="secondary">{goal.goalType}</Badge>
                               <span>Ends {format(new Date(goal.endDate), 'MMM d, yyyy')}</span>
                             </div>
                           </div>
                        </div>
                    ))}
                </div>
              ) : <p className="text-sm text-muted-foreground p-3">No active goals. Create one to get started!</p>}
            </div>

            {completedGoals.length > 0 && (
                <div>
                    <h3 className="font-headline text-base font-medium mb-2 text-muted-foreground">Completed</h3>
                    <div className="space-y-2">
                        {completedGoals.map(goal => (
                            <div key={goal.id} className="flex items-center gap-4 rounded-md border p-3 bg-muted/50">
                               <Checkbox 
                                 id={`goal-${goal.id}`} 
                                 checked={goal.isCompleted}
                                 onCheckedChange={() => handleGoalToggle(goal.id, goal.isCompleted)}
                               />
                               <div className="flex-1">
                                 <label htmlFor={`goal-${goal.id}`} className="font-medium text-muted-foreground line-through">{goal.description}</label>
                                 <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                   <Badge variant="outline">Completed</Badge>
                                 </div>
                               </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
             {expiredGoals.length > 0 && (
                <div>
                    <h3 className="font-headline text-base font-medium mb-2 text-destructive">Expired</h3>
                     <div className="space-y-2">
                        {expiredGoals.map(goal => (
                            <div key={goal.id} className="flex items-center gap-4 rounded-md border border-destructive/50 p-3 bg-destructive/10">
                               <Checkbox id={`goal-${goal.id}`} checked={goal.isCompleted} disabled />
                               <div className="flex-1">
                                 <label htmlFor={`goal-${goal.id}`} className="font-medium text-destructive/80">{goal.description}</label>
                                 <div className="flex items-center gap-2 text-xs text-destructive/70 mt-1">
                                   <Badge variant="destructive">Expired</Badge>
                                   <span>Ended {format(new Date(goal.endDate), 'MMM d, yyyy')}</span>
                                 </div>
                               </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </div>
        ) : (
          <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
            <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold">You haven't set any goals yet.</h3>
            <p className="text-sm mt-1">Click "Set New Goal" to add your first objective.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
