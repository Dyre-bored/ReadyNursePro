
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, getDoc, doc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from './ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from './ui/scroll-area';

interface QuizResult {
  id: string;
  quizId: string;
  score: number;
  dateTaken: string;
  quizTitle?: string;
}

export function QuizHistory() {
  const { user } = useUser();
  const firestore = useFirestore();
  
  const resultsQuery = useMemoFirebase(() => {
    if (user) {
      return query(
        collection(firestore, 'users', user.uid, 'quizResults'),
        orderBy('dateTaken', 'desc')
      );
    }
    return null;
  }, [user, firestore]);

  const { data: results, isLoading } = useCollection<Omit<QuizResult, 'id'>>(resultsQuery);
  const [hydratedResults, setHydratedResults] = useState<QuizResult[]>([]);

  useEffect(() => {
    if (results && user) {
      const fetchQuizTitles = async () => {
        const promises = results.map(async (result) => {
          const quizRef = doc(firestore, 'users', user.uid, 'quizzes', result.quizId);
          const quizSnap = await getDoc(quizRef);
          return {
            ...result,
            quizTitle: quizSnap.exists() ? quizSnap.data().title : 'Unknown Quiz',
          };
        });
        const newHydratedResults = await Promise.all(promises);
        setHydratedResults(newHydratedResults);
      };
      fetchQuizTitles();
    }
  }, [results, user, firestore]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
        <p>You haven't taken any quizzes yet.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-96">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Quiz</TableHead>
            <TableHead className="text-center">Score</TableHead>
            <TableHead className="text-right">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {hydratedResults.map((result) => (
            <TableRow key={result.id}>
              <TableCell className="font-medium">{result.quizTitle}</TableCell>
              <TableCell className="text-center">{result.score}%</TableCell>
              <TableCell className="text-right">
                {formatDistanceToNow(new Date(result.dateTaken), { addSuffix: true })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
