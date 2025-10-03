
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HeartPulse, BookOpen, ClipboardCheck, Calculator, Gamepad2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUser, useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function HomePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    auth.signOut();
    router.push('/');
  };

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
    <div className="flex flex-col min-h-screen animated-gradient">
      <div className="flex flex-col min-h-screen bg-background/80 backdrop-blur-sm">
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
            <Link href="/" className="flex items-center gap-2">
              <HeartPulse className="h-7 w-7 text-primary" />
              <span className="font-headline text-xl font-bold">ReadyNurse Pro</span>
            </Link>
            <nav className="flex items-center gap-4">
              <ThemeToggle />
              {isUserLoading ? (
                <div className="h-10 w-36 animate-pulse rounded-md bg-muted" />
              ) : user ? (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>
                  <Button onClick={handleLogout}>Logout</Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </>
              )}
            </nav>
          </div>
        </header>

        <main className="flex-1 bg-background/0">
          <section 
            className="container mx-auto flex flex-col items-center justify-center px-4 py-20 text-center md:px-6 md:py-32 relative"
          >
            <div className="relative z-10">
              <Badge
                variant="secondary"
                className="mb-4 animate-fade-in-up border-2 border-primary"
              >
                For Nursing Students, By Nursing Students
              </Badge>
              <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                Your Ultimate Study Companion
              </h1>
              <p className="mx-auto mt-6 max-w-[700px] text-lg text-muted-foreground md:text-xl">
                ReadyNurse Pro is designed to help you conquer your nursing studies. From flashcards to dosage calculations, we provide the tools you need to succeed.
              </p>
              <Button size="lg" asChild className="mt-8">
                <Link href="/signup">Start Studying for Free</Link>
              </Button>
            </div>
          </section>

          <section id="features" className="w-full bg-muted/80 py-20 md:py-32">
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
        </main>

        <footer className="border-t bg-background/95">
          <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 text-center md:flex-row md:px-6">
              <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} ReadyNurse Pro. All rights reserved.</p>
              <p className="text-sm text-muted-foreground">Created by E.J.R.M.</p>
              <div className="flex items-center gap-4">
                  <Link href="/" className="text-sm text-muted-foreground hover:text-primary">Home</Link>
                  <Link href="/login" className="text-sm text-muted-foreground hover:text-primary">Login</Link>
                  <Link href="/signup" className="text-sm text-muted-foreground hover:text-primary">Sign Up</Link>
              </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
