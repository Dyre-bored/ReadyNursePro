
'use client';

import AppLayout from '@/components/layout/AppLayout';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
       <div className="flex min-h-screen w-full">
        {/* Skeleton for sidebar */}
        <div className="hidden md:flex md:w-20 flex-col gap-4 border-r p-4 bg-background">
          <Skeleton className="h-8 w-12" />
          <div className="space-y-2 mt-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
        <div className="flex-1">
           {/* Skeleton for header */}
          <header className="flex h-16 items-center border-b px-6 bg-background">
            <Skeleton className="h-8 w-1/4" />
            <div className="ml-auto flex items-center gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </header>
           {/* Skeleton for content */}
          <main className="p-6 bg-muted/40 flex-1">
            <Skeleton className="h-96 w-full" />
          </main>
        </div>
      </div>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}
