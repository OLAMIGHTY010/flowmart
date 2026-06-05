import * as React from "react"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const Register = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form Submitted Successfully:", formData)
    navigate("/kyc")
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm rounded-3xl p-2 min-h-[740px] flex flex-col justify-between">
        
        {/* Header / Logo Section */}
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-2" data-slot="logo-container">
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold">
              🌿
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">FlowMart</span>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Create account</CardTitle>
          <CardDescription>Sign up to get started</CardDescription>
        </CardHeader>

        {/* Interactive Form Fields */}
        <CardContent className="flex-grow flex flex-col justify-between">
          <form onSubmit={handleSubmit} className="space-y-4 flex-grow flex flex-col justify-between gap-5">
            
            <div className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Martha Johnson"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="martha@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  placeholder="+234 800 000 0000"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-muted-foreground hover:text-foreground transition"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-muted-foreground hover:text-foreground transition"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <Button type="submit" className="w-full rounded-full font-medium">
                Create Account
              </Button>

              {/* Clean Redirection Links */}
              <div className="text-center text-xs text-muted-foreground font-medium pt-4">
                Already have an account?{" "}
                <a href="/" className="text-primary hover:underline font-semibold transition">
                  Login
                </a>
              </div>
            </div>

          </form>
        </CardContent>

      </Card>
    </div>
  )
}

export default Register