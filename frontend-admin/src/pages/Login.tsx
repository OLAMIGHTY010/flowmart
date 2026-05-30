import React from "react";
import { Link } from "react-router";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Login = () => {
  return (
    <div className="w-screen h-screen flex justify-center items-center bg-muted/20">
      <Card className="w-full max-w-md shadow-lg">
        
        {/* Header */}
        <CardHeader className="text-center space-y-2">
          <img
            src="./logo.png"
            alt="logo"
            className="mx-auto h-16 w-16 rounded-xl"
          />
          <h1 className="text-xl font-semibold">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your account
          </p>
        </CardHeader>

        {/* Body */}
        <CardContent className="space-y-4">

          {/* Google Login */}
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center gap-2"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="h-5 w-5"
            />
            Continue with Google
          </Button>

          <div className="flex items-center gap-2">
            <div className="h-px bg-border flex-1" />
            <span className="text-xs text-muted-foreground">
              or continue with email
            </span>
            <div className="h-px bg-border flex-1" />
          </div>

          {/* Form */}
          <form className="space-y-4">

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <Input
                id="password"
                type="password"
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" className="w-full" variant="secondary" >
              Sign in
            </Button>

          </form>

          {/* Sign up link */}
          <p className="text-center text-sm text-muted-foreground">
            Don’t have an account?{" "}
            <Link
              to="/vendor/signup"
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </Link>
          </p>

        </CardContent>
      </Card>
    </div>
  );
};

export default Login;