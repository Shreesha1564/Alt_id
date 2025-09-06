"use client";

import {useState, useRef, useEffect, useCallback} from 'react';
import {Camera, RefreshCw} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';

interface SelfieCaptureProps {
  onSelfieCaptured: (dataUri: string) => void;
  onRetry: () => void;
}

export function SelfieCapture({onSelfieCaptured, onRetry}: SelfieCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    // Stop any existing stream before starting a new one
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setError(null);
    setCapturedImage(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {facingMode: 'user'},
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      setError('Camera access is required. Please enable it in your browser settings and try again.');
    }
  }, [stream]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const captureSelfie = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        // Flip the image horizontally to un-mirror it
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/png');
        setCapturedImage(dataUri);
        stream?.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onSelfieCaptured(capturedImage);
    }
  };

  if (error) {
    return (
      <div className="w-full text-center">
        <Alert variant="destructive">
          <AlertTitle>Camera Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={onRetry} variant="outline" className="mt-4">
          Try Verification Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="relative w-full max-w-sm overflow-hidden rounded-lg border aspect-square bg-muted shadow-inner">
        {capturedImage ? (
          <img src={capturedImage} alt="Captured selfie" className="h-full w-full object-cover" />
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover scale-x-[-1]" />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>
      <div className="flex gap-4">
        {capturedImage ? (
          <>
            <Button variant="outline" onClick={startCamera}>
              <RefreshCw className="mr-2 h-4 w-4" /> Retake
            </Button>
            <Button onClick={handleConfirm} className="bg-accent text-accent-foreground hover:bg-accent/90">
              Confirm Selfie
            </Button>
          </>
        ) : (
          <Button size="lg" onClick={captureSelfie} disabled={!stream}>
            <Camera className="mr-2 h-4 w-4" /> Capture
          </Button>
        )}
      </div>
    </div>
  );
}
