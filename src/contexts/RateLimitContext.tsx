import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertCircle, Clock } from 'lucide-react';
import { setRateLimitHandler } from '@/lib/api';

interface RateLimitContextType {
  showRateLimitError: (retryAfter?: number) => void;
  hideRateLimitError: () => void;
}

const RateLimitContext = createContext<RateLimitContextType | undefined>(undefined);

export function RateLimitProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | undefined>(undefined);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const showRateLimitError = useCallback((retryAfterSeconds?: number) => {
    // Clear any existing interval
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    
    setRetryAfter(retryAfterSeconds);
    setIsOpen(true);
    
    if (retryAfterSeconds) {
      setCountdown(retryAfterSeconds);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            countdownIntervalRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      countdownIntervalRef.current = interval;
    }
  }, []);

  // Register the handler with the API module
  useEffect(() => {
    setRateLimitHandler(showRateLimitError);
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [showRateLimitError]);

  const hideRateLimitError = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setIsOpen(false);
    setRetryAfter(undefined);
    setCountdown(null);
  }, []);

  return (
    <RateLimitContext.Provider value={{ showRateLimitError, hideRateLimitError }}>
      {children}
      <Dialog 
        open={isOpen} 
        onOpenChange={(open) => {
          // Prevent closing if countdown is active
          if (!open && (countdown === null || countdown <= 0)) {
            hideRateLimitError();
          }
        }}
      >
        <DialogContent 
          className="sm:max-w-[425px]"
          onInteractOutside={(e) => {
            // Prevent closing by clicking outside during countdown
            if (countdown !== null && countdown > 0) {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={(e) => {
            // Prevent closing with ESC during countdown
            if (countdown !== null && countdown > 0) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-full bg-destructive/10 p-2">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <DialogTitle className="text-xl">Too Many Requests</DialogTitle>
            </div>
            <DialogDescription className="text-base pt-2">
              Our system has detected an unusually high number of requests. Please slow down and try again shortly.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {retryAfter && countdown !== null && countdown > 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Please wait {countdown} second{countdown !== 1 ? 's' : ''} before trying again.</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Please wait a moment before making another request.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              onClick={hideRateLimitError}
              disabled={countdown !== null && countdown > 0}
              className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {countdown !== null && countdown > 0 ? `Wait ${countdown}s` : 'I Understand'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </RateLimitContext.Provider>
  );
}

export function useRateLimit() {
  const context = useContext(RateLimitContext);
  if (context === undefined) {
    throw new Error('useRateLimit must be used within a RateLimitProvider');
  }
  return context;
}
