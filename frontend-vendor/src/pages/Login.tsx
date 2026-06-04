import React, { useState } from "react";
import {
  Card,
  CardDescription,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom"; // Use Navigate for safe top-level conditional redirects

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); // ✅ Added missing state hook
  
  const { login, user } = useAuth();
  const isFormEmpty = email.trim() === '' || password.trim() === '';

  // ✅ Safe Redirect: If user state exists, cleanly exit and bounce to layout
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password');
      return;
    }

    setLoading(true);
    // ✅ Matches return shape from your AuthProvider block
    const result = await login(email, password); 
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm shadow-none border-none">
        
        {/* LOGO */}
        <div className="flex flex-row justify-center items-center text-center gap-3 pt-6 px-6">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              className="text-primary-foreground"
            >
              <g
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.4"
              >
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8c0 5.5-4.78 10-10 10" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </g>
            </svg>
          </div>
          <span className="text-xl font-semibold text-foreground">FlowMart</span>
        </div>

        {/* HEADER */}
        <CardHeader className="text-center pt-4">
          <CardTitle className="text-foreground text-2xl font-semibold">
            Welcome back
          </CardTitle>
          <CardDescription>Login to your account</CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            
            {/* ✅ GLOBAL SERVER ERROR NOTIFICATION BLOCK */}
            {error && (
              <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 rounded-lg text-center">
                {error}
              </div>
            )}

            {/* EMAIL */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                placeholder="martha@email.com"
                className="bg-background"
                required
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </CardContent>

          {/* FOOTER */}
          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              className="w-full bg-primary py-3.5 rounded-xl font-semibold"
            >
              Login
            </Button>

            {/* PASSWORD */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  className="bg-background pr-10"
                  required
                  onChange={e => setPassword(e.target.value)}
                />

                {/* EYE TOGGLE */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M12 5c5 0 9 4 10 7-1 3-5 7-10 7S3 15 2 12c1-3 5-7 10-7zm0 3a4 4 0 1 0 0 8a4 4 0 0 0 0-8z"
                      />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M3 3l18 18l-1.5 1.5l-3.1-3.1A11 11 0 0 1 12 21C7 21 3 17 2 12c.9-2.2 2.5-4.3 4.8-5.8L1.5 4.5L3 3zm9 4a4 4 0 0 1 4 4c0 .6-.1 1.2-.4 1.7l-5.3-5.3c.5-.2 1.1-.4 1.7-.4zm0 8a4 4 0 0 1-4-4c0-.6.1-1.2.4-1.7l5.3 5.3c-.5.2-1.1.4-1.7.4z"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {/* FORGOT PASSWORD LINK */}
              <div className="flex justify-end">
                <a href="#" className="text-sm text-primary font-medium hover:underline">
                  Forgot password?
                </a>
              </div>
            </div>
          </CardContent>

          {/* FOOTER */}
          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button 
              type="submit" 
              disabled={isFormEmpty || loading} 
              className="w-full bg-primary py-3.5 rounded-xl font-semibold flex items-center justify-center"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Signing in..." : "Login"}
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              Don’t have an account?{" "}
              <a href="/sign-up" className="text-primary font-semibold hover:underline">
                Sign up
              </a>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;