
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HeartPulse, LogOut } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { avatarBorders } from '@/lib/borders';


interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface DesktopSidebarProps {
  navItems: NavItem[];
}

export default function DesktopSidebar({ navItems }: DesktopSidebarProps) {
  const pathname = usePathname();
  const auth = useAuth();
  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (user) {
      return doc(firestore, 'users', user.uid);
    }
    return null;
  }, [user, firestore]);

  const { data: userProfile } = useDoc(userProfileRef);
  
  const handleLogout = () => {
    auth.signOut();
  };

  const selectedBorderId = userProfile?.selectedBorderId || 'border_none';
  const selectedBorder = avatarBorders[selectedBorderId as keyof typeof avatarBorders];

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-20 flex-col border-r bg-background md:flex">
      <TooltipProvider>
        <nav className="flex flex-col items-center gap-4 px-2 py-4">
          <Link
            href="/"
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
          >
            <HeartPulse className="h-5 w-5 transition-all group-hover:scale-110" />
            <span className="sr-only">ReadyNurse Pro</span>
          </Link>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
               <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                      isActive && 'bg-accent text-accent-foreground'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="sr-only">{item.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 py-4">
            {userProfile && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="rounded-full h-10 w-10" size="icon">
                             <Avatar className={cn('h-8 w-8', selectedBorder?.className)}>
                              {userProfile.profilePictureUrl ? (
                                  <AvatarImage asChild src={userProfile.profilePictureUrl}>
                                  <Image src={userProfile.profilePictureUrl} alt={userProfile.name} width={32} height={32} className="object-cover rounded-full" />
                                  </AvatarImage>
                              ) : (
                                  <AvatarImage asChild src="https://images.unsplash.com/photo-1684070006672-09792c2ea5af?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxwcm9maWxlJTIwcGVyc29ufGVufDB8fHx8MTc1OTQyMTczMnww&ixlib=rb-4.1.0&q=80&w=1080">
                                  <Image src="https://images.unsplash.com/photo-1684070006672-09792c2ea5af?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxwcm9maWxlJTIwcGVyc29ufGVufDB8fHx8MTc1OTQyMTczMnww&ixlib=rb-4.1.0&q=80&w=1080" alt={userProfile.name} width={32} height={32} data-ai-hint="profile person" className="object-cover" />
                                  </AvatarImage>
                              )}
                              <AvatarFallback>{userProfile.name?.charAt(0)}</AvatarFallback>
                              </Avatar>
                            <span className="sr-only">Toggle user menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="end">
                        <DropdownMenuLabel>{userProfile.name}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild><Link href="/profile">Profile</Link></DropdownMenuItem>
                         <DropdownMenuItem asChild><Link href="/shop">Shop ({userProfile.coins?.toLocaleString() ?? 0} Coins)</Link></DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </nav>
      </TooltipProvider>
    </aside>
  );
}
