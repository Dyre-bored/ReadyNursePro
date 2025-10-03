
'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, X } from 'lucide-react';
import { QuizPlayer } from '@/components/QuizPlayer';
import { addDocumentNonBlocking } from '@/firebase';

export default function TakeQuizPage() {
  const params = useParams();
  const router = useRouter();
  const { quizId } = params;
  const { user } = useUser();
  const firestore = useFirestore();

  const quizRef = useMemoFirebase(() => {
    if (user && quizId) {
      return doc(firestore, 'users', user.uid, 'quizzes', quizId as string);
    }
    return null;
  }, [user, firestore, quizId]);

  const questionsQuery = useMemoFirebase(() => {
    if (user && quizId) {
        return collection(firestore, 'users', user.uid, 'quizzes', quizId as string, 'questions');
    }
    return null;
  }, [user, firestore, quizId]);

  const { data: quiz, isLoading: isQuizLoading } = useDoc(quizRef);
  const { data: questions, isLoading: areQuestionsLoading } = useCollection(questionsQuery);

  const handleQuizComplete = (score: number) => {
    if (user && quizId) {
      const resultsRef = collection(firestore, 'users', user.uid, 'quizResults');
      addDocumentNonBlocking(resultsRef, {
        userProfileId: user.uid,
        quizId: quizId,
        score: score,
        dateTaken: new Date().toISOString(),
      });
    }
  };


  if (isQuizLoading || areQuestionsLoading) {
    return (
      <div className="flex flex-col h-full flex-1 p-4 md:p-8">
        <div className="flex items-center justify-between mb-8">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-10" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <Skeleton className="w-full max-w-2xl h-96" />
        </div>
      </div>
    )
  }

  if (!quiz) {
    return <div>Quiz not found.</div>;
  }

  if (!questions || questions.length === 0) {
    return (
        <div className="flex flex-col flex-1 items-center justify-center text-center">
            <h2 className="text-2xl font-bold">This quiz has no questions!</h2>
            <p className="text-muted-foreground mt-2">Add some questions to start playing.</p>
            <Button asChild className="mt-4">
                <Link href={`/quizzes/${quizId}`}>Back to Quiz Details</Link>
            </Button>
        </div>
    )
  }

  return (
    <div className="flex flex-col h-full flex-1">
        {/* Header */}
        <header className="p-4 flex items-center justify-between border-b">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold font-headline">{quiz.title}</h1>
            </div>
            <Button variant="ghost" size="icon" asChild>
                <Link href={`/quizzes/${quizId}`}>
                    <X className="h-5 w-5" />
                    <span className="sr-only">End Session</span>
                </Link>
            </Button>
        </header>

        {/* Player */}
        <main className="flex-1 flex items-center justify-center p-4">
            <QuizPlayer questions={questions} onQuizComplete={handleQuizComplete} />
        </main>
    </div>
  );
}
