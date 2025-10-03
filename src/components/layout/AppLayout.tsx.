
'use client';

import React from 'react';
import DesktopSidebar from './DesktopSidebar';
import MobileBottomNav from './MobileBottomNav';
import Header from './Header';
import { navLinks } from '@/lib/data';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';


// This is the correct place for client-side logic that needs user data.
function ThemedBody({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (user) {
      return doc(firestore, 'users', user.uid);
    }
    return null;
  }, [user, firestore]);

  const { data: userProfile } = useDoc(userProfileRef);

  React.useEffect(() => {
    // Ensure we are on the client side
    if (typeof window !== 'undefined') {
      const body = document.body;
      // Remove all theme classes before adding the correct one
      body.classList.remove('theme-ube', 'theme-strawberry');
      
      if (userProfile?.selectedTheme === 'ube') {
        body.classList.add('theme-ube');
      } else if (userProfile?.selectedTheme === 'strawberry') {
        body.classList.add('theme-strawberry');
      }
    }
  }, [userProfile]);

  return <>{children}</>;
}


export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemedBody>
      <div className="min-h-screen w-full bg-background">
        <DesktopSidebar navItems={navLinks} />
        <div className="flex flex-col md:pl-20">
          <Header />
          <main className="flex-grow p-4 sm:p-6 md:p-8 pb-24 md:pb-8">
              {children}
          </main>
        </div>
        <MobileBottomNav navItems={navLinks} />
      </div>
    </ThemedBody>
  );
}
