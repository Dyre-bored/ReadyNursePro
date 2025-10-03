
'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Search,
  CircleDollarSign,
  Menu,
  ShoppingBag,
  Gamepad2,
  HelpCircle,
} from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '../ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { navLinks } from '@/lib/data';
import Image from 'next/image';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { WelcomeTutorial } from '../WelcomeTutorial';
import { cn } from '@/lib/utils';
import { avatarBorders } from '@/lib/borders';
import { SearchCommandMenu } from '../SearchCommandMenu';

export default function Header() {
  const auth = useAuth();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const userProfileRef = useMemoFirebase(() => {
    if (user) {
      return doc(firestore, 'users', user.uid);
    }
    return null;
  }, [user, firestore]);

  const { data: userProfile } = useDoc(userProfileRef);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsSearchOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])
  
  const handleLogout = () => {
    auth.signOut();
  };

  const selectedBorderId = userProfile?.selectedBorderId || 'border_none';
  const selectedBorder = avatarBorders[selectedBorderId as keyof typeof avatarBorders];

  return (
    <>
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
       <WelcomeTutorial isOpen={isTutorialOpen} onOpenChange={setIsTutorialOpen} />
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <nav className="grid gap-2 text-lg font-medium">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-semibold mb-4"
            >
              <HeartPulse className="h-6 w-6 text-primary" />
              <span className="font-headline">ReadyNurse Pro</span>
            </Link>
            {navLinks.map((item) => (
                <Link
                key={item.label}
                href={item.href}
                className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
              >
                <item.icon className="h-5 w-5 text-primary" />
                {item.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 sm:flex-initial">
          <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground sm:w-[300px] md:w-[200px] lg:w-[300px]"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <span className="pl-6">Search...</span>
            <kbd className="pointer-events-none absolute right-2 top-[6px] hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>
         {userProfile && (
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2">
                  <CircleDollarSign className="h-5 w-5 text-yellow-500" />
                  <span>{userProfile.coins ?? 0}</span>
               </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Coins</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/shop"><ShoppingBag className="mr-2 h-4 w-4 text-primary" /> Go to Shop</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/games"><Gamepad2 className="mr-2 h-4 w-4 text-primary" /> Earn More</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
           </DropdownMenu>
         )}
        <Button variant="outline" size="icon" onClick={() => setIsTutorialOpen(true)}>
            <HelpCircle className="h-5 w-5" />
            <span className="sr-only">Help</span>
        </Button>
        <ThemeToggle />
        {userProfile && (
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className={cn("h-8 w-8", selectedBorder?.className)}>
                        {userProfile.profilePictureUrl ? (
                            <AvatarImage asChild src={userProfile.profilePictureUrl}>
                               <Image src={userProfile.profilePictureUrl} alt={userProfile.name} width={32} height={32} className="object-cover rounded-full"/>
                            </AvatarImage>
                        ): (
                            <AvatarImage asChild src="https://images.unsplash.com/photo-1684070006672-09792c2ea5af?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxwcm9maWxlJTIwcGVyc29ufGVufDB8fHx8MTc1OTQyMTczMnww&ixlib=rb-4.1.0&q=80&w=1080">
                                <Image src="https://images.unsplash.com/photo-1684070006672-09792c2ea5af?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxwcm9maWxlJTIwcGVyc29ufGVufDB8fHx8MTc1OTQyMTczMnww&ixlib=rb-4.1.0&q=80&w=1080" alt={userProfile.name} width={32} height={32} data-ai-hint="profile person" className="object-cover" />
                            </AvatarImage>
                        )}
                        <AvatarFallback>{userProfile.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                <span className="sr-only">Toggle user menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link href="/profile">Profile</Link></DropdownMenuItem>
                <DropdownMenuItem>Support</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        )}
      </div>
    </header>
    <SearchCommandMenu open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  );
}
