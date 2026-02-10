import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'react-toastify';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    if (isLoading) return;
    
    setIsLoading(true);
    toast.dismiss();

    const response = await authApi.forgotPassword({
      email: data.email,
    });

    if (response.error) {
      toast.error(response.error);
      setIsLoading(false);
      return;
    }

    setSubmittedEmail(data.email);
    setEmailSent(true);
    toast.success('Password reset email sent! Please check your inbox.');
    setIsLoading(false);
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link to="/" className="inline-block">
              <h1 className="font-serif text-3xl font-bold text-foreground flex items-center justify-center gap-2">
                Meowwdium
                <img src="/paws.png" alt="Meowwdium" className="w-8 h-8 inline-block align-middle" />
              </h1>
            </Link>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">Check Your Email</h2>
              <p className="text-muted-foreground">
                We've sent a password reset link to
              </p>
              <p className="font-medium text-foreground">{submittedEmail}</p>
            </div>

            <div className="space-y-4 text-sm text-muted-foreground">
              <p>Please check your email and click on the link to reset your password.</p>
              
              <div className="bg-muted p-4 rounded-md space-y-2">
                <p className="font-medium text-foreground">Didn't receive the email?</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Check your spam or junk folder</li>
                  <li>Make sure you entered the correct email</li>
                  <li>Wait a few minutes for the email to arrive</li>
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setEmailSent(false);
                  form.reset();
                }}
              >
                Try Another Email
              </Button>
              
              <Button variant="ghost" className="w-full" asChild>
                <Link to="/login">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-block">
            <h1 className="font-serif text-3xl font-bold text-foreground flex items-center justify-center gap-2">
              Meowwdium
              <img src="/paws.png" alt="Meowwdium" className="w-8 h-8 inline-block align-middle" />
            </h1>
          </Link>
          <h2 className="mt-6 text-2xl font-semibold text-foreground">Forgot Password?</h2>
          <p className="mt-2 text-muted-foreground">
            No worries! Enter your email and we'll send you reset instructions
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        </Form>

        <div className="text-center space-y-2">
          <Button variant="ghost" className="text-sm" asChild>
            <Link to="/login">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Link>
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
