import React from "react";
import { Link } from "react-router";

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
                            <label   htmlFor="email">Email</label>
                            <input id="email" type="email" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                            <input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                            />
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default Login;