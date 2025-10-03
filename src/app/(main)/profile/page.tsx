
'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EditAvatarDialog } from '@/components/EditAvatarDialog';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { achievementBadges, BadgeId } from '@/lib/data';
import { cn } from '@/lib/utils';
import { doc, updateDoc } from 'firebase/firestore';
import { Edit, Gem, Sparkles, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { schools } from '@/lib/schools';
import { Combobox } from '@/components/ui/combobox';
import { QuizHistory } from '@/components/QuizHistory';
import { WelcomeTutorial } from '@/components/WelcomeTutorial';
import { avatarBorders } from '@/lib/borders';
import { UserGoals } from '@/components/UserGoals';


export default function ProfilePage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const [isTutorialOpen, setIsTutorialOpen] = useState(false);
    const [isChangingTheme, setIsChangingTheme] = useState(false);

    const userProfileRef = useMemoFirebase(() => {
        if (user) {
            return doc(firestore, 'users', user.uid);
        }
        return null;
    }, [user, firestore]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [school, setSchool] = useState('');
    const [yearLevel, setYearLevel] = useState('');

    useEffect(() => {
        if (userProfile) {
            setName(userProfile.name || '');
            setEmail(userProfile.email || '');
            setSchool(userProfile.nursingSchool || '');
            setYearLevel(userProfile.yearLevel || '');
        }
    }, [userProfile]);
    
    const handleTutorialFinish = () => {
        if (userProfileRef) {
          updateDoc(userProfileRef, { hasSeenTutorial: true });
        }
    };

    const handleSaveChanges = async () => {
        if (userProfileRef) {
            await updateDoc(userProfileRef, {
                name: name,
                email: email,
                nursingSchool: school,
                yearLevel: yearLevel,
            });
        }
    };

    const handleThemeChange = async (themeId: string) => {
        if (!userProfileRef || userProfile?.selectedTheme === themeId) return;
        
        setIsChangingTheme(true);
        await updateDoc(userProfileRef, { selectedTheme: themeId });
        
        // Force a reload to apply the new theme
        window.location.reload();
    };

    if (isProfileLoading) {
        return (
            <div className="flex flex-1 flex-col gap-4 md:gap-8">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-5 w-48 mt-2" />
                    </div>
                </div>
                <div className="grid gap-8 md:grid-cols-3">
                    <div className="md:col-span-1">
                        <Skeleton className="h-[450px] w-full" />
                    </div>
                    <div className="md:col-span-2">
                        <Skeleton className="h-[500px] w-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (!userProfile) {
        return (
            <div className="flex flex-1 items-center justify-center">
                 <Card className="w-full max-w-lg text-center">
                    <CardHeader>
                        <CardTitle>Profile Not Found</CardTitle>
                        <CardDescription>
                            We couldn't load your profile. Please try logging out and back in.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    const ownedBadgeIds = (userProfile?.achievementBadgeIds || []).filter(
      (id: string): id is BadgeId => id in achievementBadges
    );

    const profilePictureSrc = userProfile.profilePictureUrl || "https://images.unsplash.com/photo-1684070006672-09792c2ea5af?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxwcm9maWxlJTIwcGVyc29ufGVufDB8fHx8MTc1OTQyMTczMnww&ixlib=rb-4.1.0&q=80&w=1080";

    const schoolOptions = schools.map(s => ({ value: s, label: s }));
    
    const selectedBorderId = userProfile.selectedBorderId || 'border_none';
    const selectedBorder = avatarBorders[selectedBorderId as keyof typeof avatarBorders];
    
    const unlockedThemes = userProfile.unlockedThemeIds || [];
    if (!unlockedThemes.includes('default')) {
        unlockedThemes.push('default');
    }

    return (
        <div className="flex flex-1 flex-col gap-4 md:gap-8">
            <Dialog open={isChangingTheme}>
                <DialogContent className="sm:max-w-xs text-center" hideCloseButton>
                    <DialogHeader>
                    <DialogTitle className="font-headline text-center">Applying Theme...</DialogTitle>
                    </DialogHeader>
                    <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                </DialogContent>
            </Dialog>
            {userProfileRef && (
              <WelcomeTutorial 
                isOpen={isTutorialOpen} 
                onOpenChange={setIsTutorialOpen} 
                userProfileRef={userProfileRef}
                onFinish={handleTutorialFinish}
              />
            )}
            <div className="flex items-center justify-between">
                <div>
                <h1 className="font-headline text-2xl font-bold">My Profile</h1>
                <p className="text-muted-foreground">
                    Manage your account and track your progress.
                </p>
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
                <div className="md:col-span-1">
                <Card>
                    <CardHeader className="items-center text-center">
                        <div className="relative">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Avatar className={cn(
                                        "h-24 w-24 cursor-pointer hover:opacity-80 transition-opacity",
                                        selectedBorder?.className
                                    )}>
                                        <AvatarImage asChild src={profilePictureSrc}>
                                            <Image src={profilePictureSrc} alt={userProfile.name} width={96} height={96} className="object-cover rounded-full" data-ai-hint={userProfile.profilePictureUrl ? '' : 'profile person'}/>
                                        </AvatarImage>
                                        <AvatarFallback className="text-3xl">{userProfile.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </DialogTrigger>
                                <DialogContent className="p-0 border-0 max-w-md">
                                    <DialogTitle className="sr-only">{userProfile.name}'s Profile Picture</DialogTitle>
                                    <Image src={profilePictureSrc} alt={userProfile.name} width={600} height={600} className="rounded-lg object-cover"/>
                                </DialogContent>
                            </Dialog>
                            <EditAvatarDialog userProfileRef={userProfileRef} />
                        </div>
                    <CardTitle className="mt-4 text-2xl font-headline">{userProfile.name}</CardTitle>
                    <CardDescription>{userProfile.yearLevel} Nursing Student</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                    <p className="text-sm text-muted-foreground">{userProfile.nursingSchool}</p>
                    <Separator className="my-4" />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-center">
                        <div className="font-bold">{userProfile.studyStreak}</div>
                        <div className="text-muted-foreground">Streak</div>
                        </div>
                        <div className="text-center">
                        <div className="font-bold">{userProfile.totalStudyHours}h</div>
                        <div className="text-muted-foreground">Total Study</div>
                        </div>
                        <div className="text-center">
                        <div className="font-bold">{userProfile.achievementBadgeIds?.length || 0}</div>
                        <div className="text-muted-foreground">Badges</div>
                        </div>
                        <div className="text-center">
                        <div className="font-bold">Expert</div>
                        <div className="text-muted-foreground">Rank</div>
                        </div>
                    </div>
                    {ownedBadgeIds.length > 0 && (
                        <>
                            <Separator className="my-4" />
                            <div>
                                <h3 className="font-headline text-sm font-semibold tracking-wider text-muted-foreground uppercase mb-3">Badges</h3>
                                <div className="flex justify-center gap-4 flex-wrap">
                                <TooltipProvider>
                                  {ownedBadgeIds.map((badgeId) => {
                                      const badge = achievementBadges[badgeId];
                                      const Icon = badge.icon;
                                      return (
                                        <Tooltip key={badgeId}>
                                            <TooltipTrigger>
                                            <div className={cn("flex h-12 w-12 items-center justify-center rounded-full border-2", badge.className)}>
                                                <Icon className="h-6 w-6" />
                                            </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                            <p className="font-semibold">{badge.name}</p>
                                            <p className="text-xs text-muted-foreground">{badge.description}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                      )
                                  })}
                                    </TooltipProvider>
                                </div>
                            </div>
                        </>
                    )}
                    </CardContent>
                </Card>
                </div>

                <div className="md:col-span-2">
                    <Tabs defaultValue="account">
                        <TabsList>
                            <TabsTrigger value="account">Account</TabsTrigger>
                            <TabsTrigger value="appearance">Appearance</TabsTrigger>
                            <TabsTrigger value="history">Quiz History</TabsTrigger>
                            <TabsTrigger value="notifications">Notifications</TabsTrigger>
                            <TabsTrigger value="goals">Goals</TabsTrigger>
                        </TabsList>
                        <TabsContent value="account">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Account Information</CardTitle>
                                    <CardDescription>Update your personal details here.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="school">Nursing School</Label>
                                        <Combobox
                                            options={schoolOptions}
                                            value={school}
                                            onChange={setSchool}
                                            placeholder="Select or search for a school..."
                                            searchPlaceholder="Search schools..."
                                            notFoundMessage="No school found."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="year-level">Year Level</Label>
                                        <Select onValueChange={setYearLevel} value={yearLevel}>
                                            <SelectTrigger id="year-level">
                                                <SelectValue placeholder="Select your year level" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1st Year">1st Year</SelectItem>
                                                <SelectItem value="2nd Year">2nd Year</SelectItem>
                                                <SelectItem value="3rd Year">3rd Year</SelectItem>
                                                <SelectItem value="4th Year">4th Year</SelectItem>
                                                <SelectItem value="Graduate">Graduate</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center gap-4 pt-2">
                                        <Button onClick={handleSaveChanges}>Save Changes</Button>
                                        <Button variant="outline" onClick={() => setIsTutorialOpen(true)}>View Tutorial</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="appearance">
                             <Card>
                                <CardHeader>
                                    <CardTitle>Appearance Settings</CardTitle>
                                    <CardDescription>Customize the look and feel of your app.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                     <div>
                                        <Label className="text-base">Color Theme</Label>
                                        <p className="text-sm text-muted-foreground mb-4">Select a theme for the application.</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => handleThemeChange('default')}
                                                className={cn("border-2 rounded-lg p-4 text-left", (userProfile.selectedTheme === 'default' || !userProfile.selectedTheme) ? 'border-primary' : 'border-border')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-primary"></div>
                                                    <h4 className="font-semibold">Default</h4>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-2">The standard look and feel.</p>
                                            </button>
                                            <button
                                                onClick={() => unlockedThemes.includes('ube') && handleThemeChange('ube')}
                                                className={cn(
                                                    "border-2 rounded-lg p-4 text-left relative",
                                                    userProfile.selectedTheme === 'ube' ? 'border-primary' : 'border-border',
                                                    !unlockedThemes.includes('ube') && 'opacity-50 cursor-not-allowed'
                                                )}
                                                disabled={!unlockedThemes.includes('ube')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-[hsl(280_85%_75%)] flex items-center justify-center">
                                                        <Gem className="w-4 h-4 text-purple-950"/>
                                                    </div>
                                                    <h4 className="font-semibold">Ube</h4>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-2">A vibrant, stylish purple theme.</p>
                                                {!unlockedThemes.includes('ube') && (
                                                     <p className="text-xs font-semibold text-amber-500 mt-1">Purchase in Shop</p>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => unlockedThemes.includes('strawberry') && handleThemeChange('strawberry')}
                                                className={cn(
                                                    "border-2 rounded-lg p-4 text-left relative",
                                                    userProfile.selectedTheme === 'strawberry' ? 'border-primary' : 'border-border',
                                                    !unlockedThemes.includes('strawberry') && 'opacity-50 cursor-not-allowed'
                                                )}
                                                disabled={!unlockedThemes.includes('strawberry')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-[hsl(340_82%_60%)] flex items-center justify-center">
                                                        <Sparkles className="w-4 h-4 text-pink-950"/>
                                                    </div>
                                                    <h4 className="font-semibold">Strawberry</h4>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-2">A sweet and fresh pink theme.</p>
                                                {!unlockedThemes.includes('strawberry') && (
                                                     <p className="text-xs font-semibold text-amber-500 mt-1">Purchase in Shop</p>
                                                )}
                                            </button>
                                        </div>
                                     </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                         <TabsContent value="history">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Quiz History</CardTitle>
                                    <CardDescription>Review your past quiz performance.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <QuizHistory />
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="notifications">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Notification Settings</CardTitle>
                                    <CardDescription>Manage how you receive notifications.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div>
                                            <Label htmlFor="study-reminders">Study Reminders</Label>
                                            <p className="text-sm text-muted-foreground">Get reminders to keep your streak.</p>
                                        </div>
                                        <Switch id="study-reminders" defaultChecked/>
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div>
                                            <Label htmlFor="goal-updates">Goal Updates</Label>
                                            <p className="text-sm text-muted-foreground">Notifications on your goal progress.</p>
                                        </div>
                                        <Switch id="goal-updates" defaultChecked/>
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div>
                                            <Label htmlFor="new-content">New Content Alerts</Label>
                                            <p className="text-sm text-muted-foreground">Get notified about new community decks.</p>
                                        </div>
                                        <Switch id="new-content" />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="goals">
                            <UserGoals />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}

    
