'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileQuestion, ArrowLeft, BrainCircuit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AddQuestionDialog } from '@/components/AddQuestionDialog';
import { AiGenerateButton } from '@/components/AiGenerateButton';
import { generateQuizQuestions } from '@/app/actions/generate-quiz-questions';
import { useToast } from '@/hooks/use-toast';

export default function QuizDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { quizId } = params;
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

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

  const handleAiGenerate = async () => {
    if (!quiz || !questionsQuery) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Quiz information not available.',
        });
        return;
    }

    try {
        const generatedQuestions = await generateQuizQuestions({
            topic: quiz.topic,
            difficulty: quiz.difficulty,
        });

        if (!generatedQuestions || generatedQuestions.length === 0) {
           throw new Error("AI did not return any questions.");
        }
        
        // Save questions to firestore
        generatedQuestions.forEach(q => {
            const newQuestion = {
                quizId: quizId,
                questionType: q.questionType,
                ...q,
            };
            if (q.questionType === 'Select All That Apply') {
              // The schema expects correctAnswer to be an array for SATA
              // and incorrectAnswers to also be an array.
              // This structure is already correct from the flow.
            } else {
              // For multiple choice, it should be a single string.
               newQuestion.questionType = 'Multiple Choice';
            }
            // Use non-blocking adds for faster UI feedback
            addDocumentNonBlocking(questionsQuery, newQuestion);
        });

        toast({
            title: 'Success!',
            description: `${generatedQuestions.length} new questions are being added to your quiz.`
        });

    } catch (error) {
         toast({
            variant: 'destructive',
            title: 'AI Generation Failed',
            description: 'Could not generate questions. Please try again.',
        });
        console.error("AI Question Generation failed:", error);
    }
  }


  if (isQuizLoading) {
    return (
        <div className="flex flex-1 flex-col gap-4 md:gap-8">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-5 w-1/3" />
            <div className="mt-4">
                <Skeleton className="h-40 w-full" />
            </div>
        </div>
    );
  }

  if (!quiz) {
    return <div>Quiz not found.</div>;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
       <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.push('/quizzes')}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
        <div className="flex-1">
          <h1 className="font-headline text-3xl font-bold">{quiz.title}</h1>
          <div className="flex items-center gap-2 mt-1">
             <Badge variant="secondary">{quiz.topic}</Badge>
             <Badge variant="outline">{quiz.difficulty}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <AiGenerateButton onGenerate={handleAiGenerate} />
            <AddQuestionDialog quizId={quizId as string} />
            {questions && questions.length > 0 && (
              <Button asChild>
                <Link href={`/quizzes/${quizId}/take`}>
                  <BrainCircuit className="mr-2 h-4 w-4" /> Take Quiz
                </Link>
              </Button>
            )}
        </div>
      </div>
      
       {quiz.description && (
          <p className="text-muted-foreground max-w-2xl">{quiz.description}</p>
       )}

        {areQuestionsLoading ? (
            <div className="grid gap-4 md:grid-cols-1">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
            </div>
        ) : questions && questions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-1">
                {questions.map((question, index) => (
                    <Card key={question.id}>
                        <CardHeader>
                            <CardTitle className="text-base font-medium">
                                {index + 1}. {question.questionText}
                            </CardTitle>
                            <CardDescription>
                                Correct Answer: {Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer}
                            </CardDescription>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        ) : (
            <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed bg-card mt-4">
                <div className="text-center p-8">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                        <FileQuestion className="h-8 w-8" />
                    </div>
                    <h2 className="font-headline text-xl font-semibold">No Questions Yet</h2>
                    <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                        This quiz is empty. Use "AI Generate" or "Add Question" to build this quiz.
                    </p>
                </div>
            </div>
        )}
    </div>
  );
}
