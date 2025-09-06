import {VerificationFlow} from '@/components/alt-id/VerificationFlow';
import {Logo} from '@/components/alt-id/Logo';
import Link from 'next/link';

export default function VerifyPage() {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center bg-background p-4 sm:p-6 md:p-8">
      <header className="mb-8 w-full max-w-2xl">
        <Link href="/" aria-label="Back to home">
          <Logo />
        </Link>
      </header>
      <main className="w-full flex-1 flex items-start justify-center">
        <VerificationFlow />
      </main>
    </div>
  );
}
