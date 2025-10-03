
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { CreateQuizDialog } from '@/components/CreateQuizDialog';
import { FileQuestion } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function QuizzesPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const quizzesQuery = useMemoFirebase(() => {
    if (user) {
      return collection(firestore, 'users', user.uid, 'quizzes');
    }
    return null;
  }, [user, firestore]);

  const { data: quizzes, isLoading: quizzesLoading } = useCollection(quizzesQuery);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (quizzes && user) {
      const fetchCounts = async () => {
        const counts: Record<string, number> = {};
        const countPromises = quizzes.map(async (quiz) => {
          const questionsRef = collection(firestore, 'users', user.uid, 'quizzes', quiz.id, 'questions');
          const questionsSnapshot = await getDocs(questionsRef);
          counts[quiz.id] = questionsSnapshot.size;
        });
        await Promise.all(countPromises);
        setQuestionCounts(counts);
      };
      fetchCounts();
    }
  }, [quizzes, user, firestore]);

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">My Quizzes</h1>
          <p className="text-muted-foreground">
            Create, manage, and take quizzes to test your knowledge.
          </p>
        </div>
        <CreateQuizDialog />
      </div>

      {quizzesLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-3/4 rounded bg-muted animate-pulse"></div>
                <div className="h-5 w-1/4 rounded bg-muted animate-pulse mt-2"></div>
              </CardHeader>
              <CardContent>
                 <div className="h-4 w-full rounded bg-muted animate-pulse"></div>
              </CardContent>
              <CardFooter>
                 <div className="h-10 w-full rounded bg-muted animate-pulse"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : quizzes && quizzes.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quizzes?.map((quiz: any) => (
            <Card key={quiz.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{quiz.title}</CardTitle>
                <CardDescription>
                  <Badge variant="secondary">{quiz.topic}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="text-sm text-muted-foreground">
                  {questionCounts[quiz.id] ?? 0} questions
                </div>
                 <div className="mt-2">
                    <Badge variant="outline">{quiz.difficulty}</Badge>
                 </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/quizzes/${quiz.id}`}>View Quiz</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
         <div className="flex-1 flex items-center justify-center text-center">
            <div className="p-8 border-2 border-dashed rounded-xl bg-card">
                 <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                    <FileQuestion className="h-8 w-8" />
                </div>
                <h3 className="font-headline text-lg font-semibold">No Quizzes Yet!</h3>
                <p className="text-muted-foreground mt-2">Click "Create New Quiz" to get started.</p>
            </div>
        </div>
      )}
    </div>
  );
}
