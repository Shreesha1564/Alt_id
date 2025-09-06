"use client";

import {useState, useTransition} from 'react';
import {useRouter} from 'next/navigation';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {StepIndicator} from './StepIndicator';
import {SelfieCapture} from './SelfieCapture';
import {Spinner} from '@/components/icons/Spinner';
import {useToast} from '@/hooks/use-toast';
import {createSimulatedJwt} from '@/lib/jwt';
import {DEMO_PUBLIC_KEYS} from '@/lib/public-keys';
import {extractInfoFromId, type ExtractInfoFromIdOutput} from '@/ai/flows/extract-info-from-id';
import {verifySelfie, type VerifySelfieOutput} from '@/ai/flows/verify-selfie';
import {AlertCircle, ArrowLeft, CheckCircle, UploadCloud, ShieldCheck, FileCheck2, UserCheck} from 'lucide-react';

import * as pdfjs from 'pdfjs-dist';

if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

type VerificationStep = 'welcome' | 'uploadId' | 'processingId' | 'captureSelfie' | 'processingSelfie' | 'success' | 'error';
type ProgressStep = 'upload' | 'selfie' | 'verified';

// A mock function to simulate digital signature verification
async function verifyDigitalSignature(file: File): Promise<{success: boolean; error?: string}> {
  console.log('Verifying digital signature for:', file.name);
  // Simulate network delay for a more realistic feel.
  await new Promise(resolve => setTimeout(resolve, 1500));

  // --- Start of Simulated Verification Logic ---
  // To test, upload a file with an even file size to trigger a failure.
  if (file.size % 2 === 0) {
    console.error('Simulated failure: Document signature could not be validated (file size is even).');
    return {
      success: false,
      error: 'Invalid digital signature. The document may not be signed or the signature is corrupted.',
    };
  }

  const publicKeyUsed = DEMO_PUBLIC_KEYS[file.size % DEMO_PUBLIC_KEYS.length];
  console.log('Simulated success: Document appears to be signed with public key index:', file.size % DEMO_PUBLIC_KEYS.length);
  // --- End of Simulated Verification Logic ---

  return {success: true};
}

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function VerificationFlow() {
  const [step, setStep] = useState<VerificationStep>('welcome');
  const [progress, setProgress] = useState<ProgressStep>('upload');
  const [idImageFile, setIdImageFile] = useState<File | null>(null);
  const [idImageDataUri, setIdImageDataUri] = useState<string | null>(null);
  const [selfieImageDataUri, setSelfieImageDataUri] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractInfoFromIdOutput | null>(null);
  const [selfieResult, setSelfieResult] = useState<VerifySelfieOutput | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const {toast} = useToast();
  const router = useRouter();

  const handleIdUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIdImageFile(file);
    setStep('processingId');
    setProgress('upload');

    startTransition(async () => {
      // Step 1: Verify digital signature first.
      const signatureResult = await verifyDigitalSignature(file);
      if (!signatureResult.success) {
        const message = signatureResult.error || 'Invalid digital signature.';
        setErrorMessage(message);
        setStep('error');
        toast({
          variant: 'destructive',
          title: 'ID Verification Failed',
          description: message,
        });
        return; // Stop the process here.
      }

      // Step 2: If signature is valid, proceed with extraction.
      try {
        const data = new Uint8Array(await file.arrayBuffer());
        const pdf = await pdfjs.getDocument(data).promise;
        let bestResult: { info: ExtractInfoFromIdOutput, imageUri: string } | null = null;

        for (let i = 1; i <= pdf.numPages; i++) {
          try {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({scale: 2.0});
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const context = canvas.getContext('2d');
            if (!context) continue;

            await page.render({canvasContext: context, viewport: viewport}).promise;
            const pageImageUri = canvas.toDataURL('image/png');

            const textContent = await page.getTextContent();
            const ageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');

            const extracted = await extractInfoFromId({
              photoDataUri: pageImageUri,
              ageText: ageText,
            });

            if (extracted.name && (extracted.dateOfBirth || extracted.age)) {
               bestResult = { info: extracted, imageUri: pageImageUri };
               // If we found a good result, we can break early.
               break;
            }
          } catch (pageError) {
            console.warn(`Could not process page ${i}:`, pageError);
          }
        }

        if (!bestResult) {
            throw new Error('Could not extract required information from the PDF. Please use a clearer ID document.');
        }

        if (!bestResult.info.ageVerified) {
            throw new Error(`Verification failed. User does not meet age requirement.`);
        }

        setExtractedData(bestResult.info);
        setIdImageDataUri(bestResult.imageUri); // Use the photo extracted by the AI
        setStep('captureSelfie');
        setProgress('selfie');
      } catch (error) {
        console.error(error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred during ID processing.';
        setErrorMessage(message);
        setStep('error');
        toast({
          variant: 'destructive',
          title: 'ID Verification Failed',
          description: message,
        });
      }
    });
  };

  const handleSelfieCapture = (dataUri: string) => {
    setSelfieImageDataUri(dataUri);
    setStep('processingSelfie');

    startTransition(async () => {
      if (!idImageDataUri) {
        setErrorMessage('ID image data is missing. Please start over.');
        setStep('error');
        return;
      }
      try {
        const result = await verifySelfie({selfieDataUri: dataUri, idPhotoDataUri: idImageDataUri});

        if (!result.isLive) {
           throw new Error(`Liveness check failed. Please ensure you are in a well-lit environment and not holding a photo. Liveness confidence: ${result.livenessConfidence.toFixed(1)}%`);
        }
        
        if (!result.isMatch || result.matchConfidence < 85) {
          throw new Error(`Selfie does not match the ID photo. Match confidence: ${result.matchConfidence.toFixed(1)}%. Please try again.`);
        }
        setSelfieResult(result);
        setStep('success');
        setProgress('verified');

        setTimeout(() => {
          router.push('/?verified=true');
        }, 8000);
      } catch (error) {
        console.error(error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred during selfie verification.';
        setErrorMessage(message);
        setStep('error');
        toast({
          variant: 'destructive',
          title: 'Selfie Verification Failed',
          description: message,
        });
      }
    });
  };

  const resetFlow = () => {
    setStep('welcome');
    setProgress('upload');
    setIdImageFile(null);
    setIdImageDataUri(null);
    setSelfieImageDataUri(null);
    setExtractedData(null);
    setSelfieResult(null);
    setErrorMessage('');
  };

  const renderContent = () => {
    if (isPending || step.startsWith('processing')) {
      let text = 'Processing...';
      if (step === 'processingId') text = 'Verifying signature and extracting data from PDF...';
      if (step === 'processingSelfie') text = 'Performing liveness check and comparing selfie with ID photo...';
      return (
        <div className="flex flex-col items-center justify-center text-center gap-4 py-16">
          <Spinner />
          <p className="text-muted-foreground animate-pulse">{text}</p>
        </div>
      );
    }
    switch (step) {
      case 'welcome':
        return (
          <>
            <CardHeader className="text-center">
              <CardTitle className="font-headline text-3xl">Verify Your Identity</CardTitle>
              <CardDescription>The process is fast, simple, and secure. It involves uploading your ID and taking a quick selfie.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ShieldCheck className="mx-auto h-16 w-16 text-primary opacity-20" />
            </CardContent>
            <CardFooter>
              <Button onClick={() => setStep('uploadId')} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                Start Verification
              </Button>
            </CardFooter>
          </>
        );
      case 'uploadId':
        return (
          <>
            <CardHeader>
              <Button variant="ghost" size="sm" className="absolute left-4 top-4 text-muted-foreground" onClick={() => setStep('welcome')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <CardTitle className="font-headline text-center pt-8">Upload Your ID</CardTitle>
              <CardDescription className="text-center">Please upload a clear, government-issued photo ID. Ensure the digital signature is valid.</CardDescription>
            </CardHeader>
            <CardContent>
              <label
                htmlFor="id-upload"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">PDF</p>
                </div>
                <Input id="id-upload" type="file" className="hidden" accept="application/pdf" onChange={handleIdUpload} />
              </label>
            </CardContent>
          </>
        );
      case 'captureSelfie':
        return (
          <>
            <CardHeader className="text-center">
              <CardTitle className="font-headline">Take a Live Selfie</CardTitle>
              <CardDescription>Position your face in the center of the frame. Make sure you're in a well-lit area.</CardDescription>
            </CardHeader>
            <CardContent>
              <SelfieCapture onSelfieCaptured={handleSelfieCapture} onRetry={resetFlow} />
            </CardContent>
          </>
        );
      case 'success':
        const issuedAt = new Date();
        const expiresAt = new Date(issuedAt.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now

        const payload = {
          token_id: `altid_${crypto.randomUUID()}`,
          verified: true,
          gov_id_type: 'Aadhaar',
          source: 'AltID Demo',
          name: extractedData?.name || 'Shreesha',
          age: extractedData?.age || 19,
          age_verified: extractedData?.ageVerified === true,
          face_match_score: selfieResult ? (selfieResult.matchConfidence / 100) : 0.95,
          liveness_score: selfieResult ? (selfieResult.livenessConfidence / 100) : 0.99,
          issued_at: issuedAt.toISOString(),
          expires_in: expiresAt.toISOString(),
          revocable: true,
          aud: 'hackathon.io',
          redirect_url: 'https://hackathon.io/form',
        };

        const jwt = createSimulatedJwt(
          payload,
          '-----BEGIN PRIVATE KEY-----\nSIMULATED_PRIVATE_KEY_FOR_DEMO_PURPOSES_ONLY\n-----END PRIVATE KEY-----'
        );

        return (
          <>
            <CardHeader className="items-center text-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <CardTitle className="font-headline text-3xl">Verification Successful!</CardTitle>
              <CardDescription>You will be redirected back to the partner site shortly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-md border bg-muted/50 p-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span className="font-medium">Digital Signature Verified</span>
              </div>
              <div className="flex items-center justify-between rounded-md border bg-muted/50 p-3">
                <UserCheck className="h-5 w-5 text-primary" />
                <span className="font-medium">
                  {extractedData?.name} (Age: {extractedData?.age || 'N/A'})
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md border bg-muted/50 p-3">
                <FileCheck2 className="h-5 w-5 text-primary" />
                <span className="font-mono text-sm">
                  Face Match: {(selfieResult?.matchConfidence || 95).toFixed(1)}%
                </span>
              </div>
               <div className="flex items-center justify-between rounded-md border bg-muted/50 p-3">
                <ShieldCheck className="h-5 w-5 text-green-500" />
                <span className="font-mono text-sm">
                  Liveness: {(selfieResult?.livenessConfidence || 99).toFixed(1)}%
                </span>
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor="jwt-payload" className="text-xs text-muted-foreground">
                  Verified Data (JWT Payload)
                </Label>
                <Textarea
                  id="jwt-payload"
                  readOnly
                  value={JSON.stringify(payload, null, 2)}
                  rows={8}
                  className="text-xs font-mono bg-muted"
                />
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor="jwt" className="text-xs text-muted-foreground">
                  Redirect Token (JWT)
                </Label>
                <Textarea id="jwt" readOnly value={jwt} rows={4} className="text-xs font-mono bg-muted" />
              </div>
            </CardContent>
          </>
        );
      case 'error':
        return (
          <>
            <CardHeader className="items-center text-center">
              <AlertCircle className="h-16 w-16 text-destructive" />
              <CardTitle className="font-headline text-3xl">Verification Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertTitle>Error Details</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button onClick={resetFlow} className="w-full" variant="outline">
                Try Again
              </Button>
            </CardFooter>
          </>
        );
    }
  };

  return (
    <Card className="w-full max-w-lg shadow-2xl relative overflow-hidden animate-fade-in-up">
      <div className="p-6 border-b">
        <StepIndicator currentStep={progress} />
      </div>
      {renderContent()}
    </Card>
  );
}
