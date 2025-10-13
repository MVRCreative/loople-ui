"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Home, User } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { toast } from "sonner";

function ConfirmEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        if (!token || !type) {
          setStatus('error');
          setMessage('Invalid link');
          return;
        }

        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          // type can be 'signup' | 'recovery'
          type: type === 'recovery' ? 'recovery' : 'signup'
        });

        if (error) {
          console.error('Email confirmation error:', error);
          setStatus('error');
          setMessage(error.message || 'Failed to confirm email');
          toast.error('Email confirmation failed');
        } else {
          setStatus('success');
          if (type === 'recovery') {
            setMessage('Link verified. You can now reset your password.');
            toast.success('Recovery verified');
          } else {
            setMessage('Email confirmed successfully! You can now sign in.');
            toast.success('Email confirmed successfully!');
          }
        }
      } catch (error) {
        console.error('Email confirmation error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred');
        toast.error('Email confirmation failed');
      }
    };

    handleEmailConfirmation();
  }, [searchParams]);

  const handleContinue = () => {
    if (status === 'success') {
      router.push('/auth/login');
    } else {
      router.push('/auth/signup');
    }
  };

  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center p-4">
      <div className="mb-6 text-center text-3xl font-semibold">Loople</div>
      <Card className="w-full max-w-sm border-0 shadow-none">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'loading' && <Loader size="lg" className="text-blue-500" />}
            {status === 'success' && <CheckCircle className="h-12 w-12 text-green-500" />}
            {status === 'error' && <XCircle className="h-12 w-12 text-red-500" />}
          </div>
          <CardTitle>
            {status === 'loading' && 'Confirming your email...'}
            {status === 'success' && 'Email Confirmed!'}
            {status === 'error' && 'Confirmation Failed'}
          </CardTitle>
          <CardDescription>
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleContinue}
            className="w-full"
            disabled={status === 'loading'}
          >
            {status === 'success' ? 'Continue to Sign In' : 'Try Again'}
          </Button>
          
          {/* Navigation buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              asChild
            >
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              asChild
            >
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ConfirmEmailPage;