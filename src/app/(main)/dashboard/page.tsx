'use client';
import Link from 'next/link';
import {
  ArrowUpRight,
  BookOpen,
  ClipboardCheck,
  LayoutGrid,
  Calculator,
  Gamepad2,
} from 'lucide-react';
import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, limit, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { WelcomeTutorial } from '@/components/WelcomeTutorial';

export default function Dashboard() {
  const { user } = useUser();
  const firestore = useFirestore();

  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  const userProfileRef = useMemoFirebase(() => {
    if (user) {
        return doc(firestore, 'users', user.uid);
    }
    return null;
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  const decksQuery = useMemoFirebase(() => {
    if (user) {
      return query(collection(firestore, 'users', user.uid, 'flashcardDecks'), limit(5));
    }
    return null;
  }, [user, firestore]);

  const { data: recentDecks, isLoading: decksLoading } = useCollection(decksQuery);
  
  React.useEffect(() => {
    if (userProfile && userProfile.hasSeenTutorial === false) {
      setIsTutorialOpen(true);
    }
  }, [userProfile]);

  const handleTutorialFinish = () => {
    if (userProfileRef) {
      updateDocumentNonBlocking(userProfileRef, { hasSeenTutorial: true });
    }
  };

  const dashboardStats = [
    {
      label: 'Study Streak',
      value: `${userProfile?.studyStreak || 0} days`,
      change: `Keep it up!`,
    },
    {
      label: 'Total Study Hours',
      value: `${userProfile?.totalStudyHours || 0} hours`,
      change: 'Logged in the app',
    },
    {
      label: 'Coins',
      value: userProfile?.coins?.toLocaleString() || '0',
      change: 'Earned from games',
    },
    {
      label: 'Badges Earned',
      value: userProfile?.achievementBadgeIds?.length || 0,
      change: 'View on your profile',
    },
  ];

  const features = [
    {
      icon: BookOpen,
      title: 'Unlimited Flashcards',
      description: 'Create and study flashcard decks on any subject. Master concepts with our smart study modes.',
    },
    {
      icon: ClipboardCheck,
      title: 'Interactive Quizzes',
      description: 'Test your knowledge with NCLEX-style quizzes and get immediate feedback to improve.',
    },
    {
      icon: Calculator,
      title: 'Drug Calculator',
      description: 'Perform essential dosage calculations quickly and accurately for safe medication administration.',
    },
    {
      icon: Gamepad2,
      title: 'Engaging Games',
      description: 'Sharpen your clinical judgment with fun, scenario-based nursing games like Vital Signs Crisis.',
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      {userProfileRef && (
          <WelcomeTutorial 
            isOpen={isTutorialOpen} 
            onOpenChange={setIsTutorialOpen} 
            userProfileRef={userProfileRef} 
            onFinish={handleTutorialFinish} 
          />
      )}
      <div className="flex items-center">
        <h1 className="font-headline text-2xl font-bold">Dashboard</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        {isProfileLoading ? (
            <>
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                           <Skeleton className="h-4 w-2/3" />
                        </CardHeader>
                        <CardContent>
                             <Skeleton className="h-8 w-1/2 mb-2" />
                             <Skeleton className="h-3 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </>
        ) : (
            dashboardStats.map((stat) => (
            <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {stat.label}
                </CardTitle>
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                    {stat.change}
                </p>
                </CardContent>
            </Card>
            ))
        )}
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Recent Flashcard Decks</CardTitle>
              <CardDescription>
                Your recently studied or created decks.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/flashcards">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {decksLoading ? (
               <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deck Title</TableHead>
                    <TableHead className="hidden sm:table-cell">Category</TableHead>
                    <TableHead className="hidden md:table-cell">Mastery</TableHead>
                    <TableHead className="text-right">Cards</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(3)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-16" /></TableCell>
                            <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-5 w-8 ml-auto" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
              </Table>
            ) : recentDecks && recentDecks.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deck Title</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Category
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Mastery
                    </TableHead>
                    <TableHead className="text-right">Cards</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentDecks?.map((deck: any) => (
                    <TableRow key={deck.id}>
                      <TableCell>
                        <div className="font-medium">{deck.title}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline">{deck.subject}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                         <div className="flex items-center gap-2">
                            <Progress value={deck.mastery || 0} className="h-2 w-20" />
                            <span>{deck.mastery || 0}%</span>
                          </div>
                      </TableCell>
                      <TableCell className="text-right">{deck.cardCount || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
                <div className="text-center p-8 text-muted-foreground">
                    <p>You haven't created any flashcard decks yet.</p>
                </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Jump right back into your studies.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button asChild size="lg">
              <Link href="/flashcards">
                <LayoutGrid className="mr-2 h-5 w-5" /> Review Flashcards
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/quizzes">
                <ClipboardCheck className="mr-2 h-5 w-5" /> Start a Quiz
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/library">
                <BookOpen className="mr-2 h-5 w-5" /> Browse Library
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

       <section id="features" className="w-full bg-muted py-20 md:py-32 rounded-lg mt-8">
            <div className="container mx-auto px-4 md:px-6">
              <div className="mx-auto max-w-3xl text-center">
                  <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">Everything You Need in One Place</h2>
                  <p className="mt-4 text-muted-foreground md:text-lg">
                      All the essential tools to help you excel in nursing school and beyond.
                  </p>
              </div>
              <div className="mx-auto mt-12 grid max-w-5xl gap-8 sm:grid-cols-2 md:grid-cols-4">
                {features.map((feature) => (
                  <div key={feature.title} className="flex flex-col items-center text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <feature.icon className="h-7 w-7" />
                    </div>
                    <h3 className="text-lg font-bold">{feature.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
    </div>
  );
}
