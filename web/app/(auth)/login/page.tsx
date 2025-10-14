"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { authAPI } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { CalendarIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { toast } from "sonner";

/**
 * Render the login page with email/password form and Google/Microsoft OAuth options.
 *
 * Includes client-side validation for email and password, submits credentials to the API,
 * invokes the AuthProvider login on success, shows success/error toasts, and redirects to "/calendar".
 * Also initiates provider OAuth flows by redirecting the browser to the provider's auth URL.
 *
 * @returns The React element for the login page.
 */
export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);

    try {
      const response = await authAPI.login({
        email: formData.email,
        password: formData.password,
      });

      // Login function from AuthProvider will store token and update state
      login(response.token, response.user);

      toast.success("Login successful!");
      router.push("/calendar");
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error instanceof Error ? error.message : "Invalid email or password";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = (provider: "google" | "microsoft") => {
    const url = provider === "google" ? authAPI.getGoogleAuthUrl() : authAPI.getMicrosoftAuthUrl();
    window.location.href = url;
  };

  return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative">
    {/* Top-left brand */}
    <Link
      href="/"
      className="absolute top-6 left-6 flex items-center space-x-2 cursor-pointer"
    >
      <CalendarIcon className="h-8 w-8 text-primary" />
      <span className="text-2xl font-bold text-foreground">Smart Calendar</span>
    </Link>

      <div className="w-full max-w-md space-y-8">
        {/* Logo/Brand */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Welcome back</h1>
          <p className="mt-2 text-muted-foreground">Sign in to your account to continue</p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>

              {/* Password */}
              <div className="space-y-2 ">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={errors.password ? "border-red-500" : ""}
                />
                {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
              </div>

              {/* Submit Button */}
              {/* Submit Button */}
              <div className="flex justify-center pt-2">
                <Button
                  type="submit"
                  className="
      w-40 cursor-pointer border-2 text-center transition-all duration-300 
      border-[rgb(var(--color-primary))] 
      text-[rgb(var(--color-primary))] 
      bg-transparent
      hover:bg-[rgb(var(--color-primary))] 
      hover:text-[rgb(var(--color-primary-foreground))] 
      dark:bg-[rgb(var(--color-primary))] 
      dark:text-[rgb(var(--color-primary-foreground))] 
      dark:hover:bg-[rgb(var(--color-card))] 
      dark:hover:text-[rgb(var(--color-foreground))]
    "
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </div>
            </form>

            {/* OAuth Buttons */}
            <div className="mt-6">
              <div className="relative flex items-center my-6">
                <div className="flex-grow border-t border-border" />
                <span className="mx-4 text-sm text-muted-foreground whitespace-nowrap">
                  Or continue with
                </span>
                <div className="flex-grow border-t border-border" />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOAuthLogin("google")}
                  disabled={isLoading}
                  className="cursor-pointer hover:text-blue-700 hover:bg-blue-50 hover:underline"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    viewBox="0 0 48 48"
                    x="0px"
                    y="0px"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fill="#FFC107"
                      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                    ></path>
                    <path
                      fill="#FF3D00"
                      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                    ></path>
                    <path
                      fill="#4CAF50"
                      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                    ></path>
                    <path
                      fill="#1976D2"
                      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                    ></path>
                  </svg>
                  Google
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOAuthLogin("microsoft")}
                  disabled={isLoading}
                  className="cursor-pointer hover:text-green-700 hover:bg-green-50 hover:underline"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#f25022" d="M1 1h10v10H1z" />
                    <path fill="#00a4ef" d="M13 1h10v10H13z" />
                    <path fill="#7fba00" d="M1 13h10v10H1z" />
                    <path fill="#ffb900" d="M13 13h10v10H13z" />
                  </svg>
                  Microsoft
                </Button>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Don&apos;t have an account? </span>
              <Link href="/signup" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}