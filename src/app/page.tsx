import {Button} from '@/components/ui/button';
import Link from 'next/link';
import {Logo} from '@/components/alt-id/Logo';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {ExternalLink} from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
      <main className="flex flex-1 flex-col items-center justify-center p-4 text-center">
        <Card className="w-full max-w-md animate-fade-in-up shadow-lg">
          <CardHeader>
            <div className="mx-auto mb-4">
              <Logo />
            </div>
            <CardTitle className="text-2xl font-headline">Welcome to a Partner Platform</CardTitle>
            <CardDescription>
              This is a demonstration of a partner website integrating with AltID for identity verification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-muted-foreground">Click the button below to start the secure verification process.</p>
            <Button asChild size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/verify">
                Verify with AltID
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-xs text-muted-foreground">Your security is our priority.</p>
          </CardFooter>
        </Card>
      </main>
      <footer className="p-4 text-center text-sm text-muted-foreground">Powered by AltID</footer>
    </div>
  );
}
