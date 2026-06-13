import React, { useRef, useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Loader2, Camera, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { VendorButton } from "@/components/ui/button";
import { VendorInput } from "@/components/ui/input";
import logo from "@/assets/flowmart-logo.png";
import SideBanner from "@/components/SideBanner";

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, user } = useAuth();
  const from = (location.state as any)?.from || "/";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Male");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (user) {
    return <Navigate to={from} replace />;
  }

  const isFormEmpty =
    !firstName.trim() ||
    !lastName.trim() ||
    !phoneNumber.trim() ||
    !email.trim() ||
    !password.trim();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(URL.createObjectURL(file));
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (isFormEmpty) {
      setError("Please fill out all required fields");
      return;
    }

    setLoading(true);

    const name = `${firstName.trim()} ${lastName.trim()}`.trim();

    const result = await register({
      fullName: name,
      phoneNumber,
      email,
      password,
      dateOfBirth:dob,
      gender,
      profileImage,
      role:"vendor",
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error || "Failed to create account. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col lg:flex-row">
      <SideBanner />

      {/* Main Register Panel */}
      <div className="flex-grow flex flex-col p-6 lg:p-12 relative w-full">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition absolute top-6 left-6 lg:top-12 lg:left-12 cursor-pointer z-10"
        >
          <ArrowLeft size={16} /> Back to Home
        </button>
        <div className="flex-grow flex items-center justify-center w-full">
        <div className="w-full max-w-lg flex flex-col gap-6">
          {/* Logo / Title */}
          <div className="text-center lg:text-left mt-8 lg:mt-0">
            <div className="flex items-center gap-2 h-16 lg:h-20 mb-3 justify- w-fit-content ">
              <img src={logo} alt="FlowMart Logo" className="h-40 lg:h-60 object-contain" />
            </div>
            <h2 className="text-3xl font-bold font-headings text-foreground leading-tight">
              Create Account
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Join FlowMart and start shopping today
            </p>
          </div>

          <form onSubmit={handleRegister} className="flex flex-col gap-5">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-xl font-medium text-center">
                {error}
              </div>
            )}

            <div className="bg-surface p-6 rounded-2xl border border-border/70 shadow-xs flex flex-col gap-4">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-primary bg-muted transition hover:border-primary/80"
                >
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <Camera size={22} className="text-primary" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  Upload Photo
                </button>
              </div>

              {/* Name row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <VendorInput
                  label="First Name"
                  name="firstName"
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
                <VendorInput
                  label="Last Name"
                  name="lastName"
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>

              {/* Email */}
              <VendorInput
                label="Email Address"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              {/* Phone */}
              <VendorInput
                label="Phone Number"
                name="phoneNumber"
                type="tel"
                placeholder="08012345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />

              {/* Password with toggle */}
              <div className="relative w-full">
                <VendorInput
                  label="Password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-[44px] text-muted-foreground hover:text-foreground transition cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Gender + DOB row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-[10px] w-full">
                  <label className="text-sm font-medium text-foreground">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="flex items-center w-full border border-gray-300 rounded-md px-3 py-[14px] bg-background text-sm text-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <VendorInput
                  label="Date of Birth"
                  name="dob"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </div>
            </div>

            <VendorButton type="submit" disabled={isFormEmpty || loading} className="mt-2">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />}
              {loading ? "Creating account..." : "Create Account"}
            </VendorButton>

            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-primary font-bold hover:underline cursor-pointer bg-transparent border-none outline-none font-body"
              >
                Sign In
              </button>
            </p>
          </form>
        </div>
        </div>
      </div>
    </div>
  );
}