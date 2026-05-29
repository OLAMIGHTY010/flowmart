import React from "react";
import { Link } from "react-router";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Login = () => {
    return (
        <div className="w-screen h-screen flex justify-center items-center">
            <Card className="w-full max-w-md shawdow-lg">
                <CardHeader className="text-center">
                    <img
                        src="./logo.png"
                        className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl"
                    />
                </CardHeader>
                <CardContent>
                    <form>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                            />
                        </div>
                        <Button type="submit" className="w-full" >
                            {/* {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} */}
                            Sign in
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default Login;