
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Book, FlaskConical, Search, BookOpen, Link as LinkIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function DrugDatabase() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  const drugsQuery = useMemoFirebase(() => {
    return collection(firestore, 'drugs');
  }, [firestore]);

  const { data: drugs, isLoading } = useCollection(drugsQuery);

  const filteredDrugs =
    drugs?.filter(
      (drug) =>
        drug.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drug.drugClass.toLowerCase().includes(searchTerm.toLowerCase())
    ) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Drug Database</CardTitle>
        <CardDescription>
          Search for information about various medications.
        </CardDescription>
        <div className="relative pt-2">
          <Search className="absolute left-2.5 top-5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by generic name or class..."
            className="pl-8 w-full md:w-1/2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Generic Name</TableHead>
                  <TableHead>Drug Class</TableHead>
                  <TableHead className="hidden md:table-cell">Indications</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                       <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-64" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredDrugs.length > 0 ? (
                  filteredDrugs.map((drug) => (
                    <TableRow key={drug.id}>
                      <TableCell className="font-medium">{drug.genericName}</TableCell>
                      <TableCell>{drug.drugClass}</TableCell>
                      <TableCell className="hidden md:table-cell">{drug.indications}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      No drugs found. You may need to populate the database.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-4">
          <h4 className="text-sm font-semibold text-muted-foreground">Trusted Information Sources</h4>
            <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                    <Link href="https://www.mims.com/philippines" target="_blank" rel="noopener noreferrer">
                        <LinkIcon className="mr-2 h-4 w-4" /> MIMS Philippines
                    </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                    <Link href="https://www.drugs.com" target="_blank" rel="noopener noreferrer">
                         <LinkIcon className="mr-2 h-4 w-4" /> Drugs.com
                    </Link>
                </Button>
            </div>
        </CardFooter>
    </Card>
  );
}


export default function LibraryPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">Reference Library</h1>
          <p className="text-muted-foreground">
            Your quick-access clinical reference guide.
          </p>
        </div>
      </div>

       <Tabs defaultValue="drug-database" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-lg">
          <TabsTrigger value="drug-database">
            <FlaskConical className="mr-2 h-4 w-4 text-primary" />
            Drug Database
            </TabsTrigger>
          <TabsTrigger value="reference-materials">
            <BookOpen className="mr-2 h-4 w-4 text-primary" />
            Reference Materials
          </TabsTrigger>
        </TabsList>
        <TabsContent value="drug-database" className="mt-6">
          <DrugDatabase />
        </TabsContent>
        <TabsContent value="reference-materials" className="mt-6">
           <div className="flex flex-1 items-center justify-center pt-10">
            <Card className="w-full max-w-lg text-center">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Book className="h-8 w-8" />
                </div>
                <CardTitle className="font-headline">Coming Soon!</CardTitle>
                <CardDescription>
                  The reference materials library is being curated.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>
                  Soon you'll have access to a comprehensive guide for lab values, care plans, and more. For now, check out these trusted resources:
                </p>
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="https://www.pna-ph.org/" target="_blank" rel="noopener noreferrer">
                            <LinkIcon className="mr-2 h-4 w-4" /> PNA
                        </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="https://www.merckmanuals.com/professional" target="_blank" rel="noopener noreferrer">
                            <LinkIcon className="mr-2 h-4 w-4" /> Merck Manual
                        </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="https://www.who.int" target="_blank" rel="noopener noreferrer">
                            <LinkIcon className="mr-2 h-4 w-4" /> WHO
                        </Link>
                    </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

    </div>
  );
}
