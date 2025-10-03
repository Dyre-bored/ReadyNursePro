
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Zap, Pill, SpellCheck, Trophy, Medal, Award } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { avatarBorders } from '@/lib/borders';

interface LeaderboardEntry {
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  userSelectedBorderId?: string;
  score: number;
}

function LeaderboardList({ gameId }: { gameId: string }) {
  const firestore = useFirestore();

  const leaderboardQuery = useMemoFirebase(() => {
    return query(
      collection(firestore, 'leaderboards', gameId, 'entries'),
      orderBy('score', 'desc'),
      limit(10)
    );
  }, [firestore, gameId]);

  const { data: entries, isLoading } = useCollection<LeaderboardEntry>(leaderboardQuery);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 0:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 1:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 2:
        return <Award className="w-5 h-5 text-yellow-700" />;
      default:
        return <span className="w-5 text-center">{rank + 1}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
        <div className="text-center p-8 text-muted-foreground">
            <p>No scores submitted yet. Be the first!</p>
        </div>
    );
  }

  return (
    <div className="space-y-2">
        {entries.map((entry, index) => {
            const borderId = entry.userSelectedBorderId || 'border_none';
            const border = avatarBorders[borderId as keyof typeof avatarBorders];
            return (
                 <div key={entry.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="text-muted-foreground font-semibold">{getRankIcon(index)}</div>
                     <Avatar className={cn('h-10 w-10', border?.className)}>
                        <AvatarImage src={entry.userAvatarUrl} alt={entry.userName} asChild>
                            <Image src={entry.userAvatarUrl!} alt={entry.userName} width={40} height={40} className="object-cover" />
                        </AvatarImage>
                        <AvatarFallback>{entry.userName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <p className="font-medium flex-1 truncate">{entry.userName}</p>
                    <p className="font-bold text-lg">{entry.score.toLocaleString()}</p>
                </div>
            )
        })}
    </div>
  );
}


export default function LeaderboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">Leaderboards</h1>
          <p className="text-muted-foreground">
            See who's at the top of their game.
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="vitals-crisis" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto">
          <TabsTrigger value="vitals-crisis">
            <Zap className="mr-2" />
            Vital Signs Crisis
            </TabsTrigger>
          <TabsTrigger value="drug-dash">
            <Pill className="mr-2" />
            Drug Dash
          </TabsTrigger>
          <TabsTrigger value="medterm-mayhem">
            <SpellCheck className="mr-2" />
            MedTerm Mayhem
          </TabsTrigger>
        </TabsList>
        <TabsContent value="vitals-crisis" className="mt-6">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Top 10 Players</CardTitle>
                <CardDescription>Highest scores for Vital Signs Crisis.</CardDescription>
            </CardHeader>
            <CardContent>
                <LeaderboardList gameId="vitals-crisis" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="drug-dash" className="mt-6">
           <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Top 10 Players</CardTitle>
                <CardDescription>Highest scores for Drug Dash.</CardDescription>
            </CardHeader>
            <CardContent>
                <LeaderboardList gameId="drug-dash" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="medterm-mayhem" className="mt-6">
           <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Top 10 Players</CardTitle>
                <CardDescription>Highest scores for MedTerm Mayhem.</CardDescription>
            </CardHeader>
            <CardContent>
                <LeaderboardList gameId="medterm-mayhem" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}
