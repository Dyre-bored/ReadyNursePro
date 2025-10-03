'use client';

import { VitalSignsCrisisGame } from '@/components/games/VitalSignsCrisisGame';
import { DrugDashGame } from '@/components/games/DrugDashGame';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Pill, SpellCheck } from 'lucide-react';
import { MedTermMayhemGame } from '@/components/games/MedTermMayhemGame';

export default function GamesPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">Nursing Games</h1>
          <p className="text-muted-foreground">
            Sharpen your skills with these fun challenges.
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
          <div className="max-w-3xl mx-auto">
             <VitalSignsCrisisGame />
          </div>
        </TabsContent>
        <TabsContent value="drug-dash" className="mt-6">
           <div className="max-w-3xl mx-auto">
            <DrugDashGame />
          </div>
        </TabsContent>
        <TabsContent value="medterm-mayhem" className="mt-6">
           <div className="max-w-3xl mx-auto">
            <MedTermMayhemGame />
          </div>
        </TabsContent>
      </Tabs>

    </div>
  );
}
