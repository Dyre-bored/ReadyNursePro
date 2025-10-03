
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface MobileBottomNavProps {
  navItems: NavItem[];
}

export default function MobileBottomNav({ navItems }: MobileBottomNavProps) {
  const pathname = usePathname();

  // For mobile, we might not want to show all items. Let's filter some out.
  const mobileNavItems = navItems.filter(item => 
    !['Tools', 'Library', 'Shop'].includes(item.label)
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-card md:hidden">
      <div className={`grid h-16 grid-cols-${mobileNavItems.length}`}>
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary',
                isActive && 'text-primary'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
