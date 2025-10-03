
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HeartPulse, Chrome } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { initiateEmailSignUp, initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';


const createProfileIfNotExists = async (firestore: any, user: User, name?: string) => {
    const userRef = doc(firestore, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        const newUserProfile = {
            id: user.uid,
            name: name || user.displayName || 'New User',
            email: user.email,
            yearLevel: '1st Year',
            nursingSchool: 'N/A',
            studyStreak: 0,
            totalStudyHours: 0,
            achievementBadgeIds: [],
            profilePictureUrl: user.photoURL || '',
            studyGoals: '',
            coins: 0,
            customAvatarUnlocked: false,
            hasSeenTutorial: false,
        };
        // This needs to be a blocking call to ensure profile exists before redirect
        await setDoc(userRef, newUserProfile, { merge: true });
    }
};


export default function SignupPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && user) {
        // Profile creation is now handled inside the signup functions to ensure it's created
        // before the redirect. We can just push to dashboard here.
        router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);


  const handleEmailSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'Please fill in all fields.',
      });
      return;
    }
    // We modify initiateEmailSignUp to give us back the user on success
    // For now, we will handle it in the useEffect hook.
    initiateEmailSignUp(auth, email, password, (error) => {
       let description = 'An unknown error occurred.';
        if (error.code === 'auth/email-already-in-use') {
            description = 'This email is already in use. Please log in.';
        } else if (error.code === 'auth/weak-password') {
            description = 'The password is too weak. Please use at least 6 characters.';
        }
        toast({
            variant: 'destructive',
            title: 'Signup Failed',
            description,
        });
    });
  };

  const handleGoogleSignup = () => {
    initiateGoogleSignIn(auth, 
      async (user) => {
        await createProfileIfNotExists(firestore, user);
        router.push('/dashboard');
      },
      (error) => {
        toast({
          variant: 'destructive',
          title: 'Google Signup Failed',
          description: error.message || 'An unknown error occurred.',
        });
      }
    );
  };

  // This effect handles profile creation for email sign up
  useEffect(() => {
    if (!isUserLoading && user && user.providerData.some(p => p.providerId === 'password') && fullName) {
      createProfileIfNotExists(firestore, user, fullName);
    }
  }, [user, isUserLoading, firestore, fullName]);


  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <HeartPulse className="h-8 w-8 text-primary" />
            <span className="font-headline text-2xl font-bold">ReadyNurse Pro</span>
          </div>
          <CardTitle className="font-headline text-2xl">Create an Account</CardTitle>
          <CardDescription>
            Join ReadyNurse Pro to supercharge your studies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailSignup} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="full-name">Full Name</Label>
              <Input
                id="full-name"
                placeholder="Alex Doe"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isUserLoading}>
              {isUserLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
            <Button variant="outline" className="w-full" type="button" onClick={handleGoogleSignup}>
               <Chrome className="mr-2 h-4 w-4" />
              Sign up with Google
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
