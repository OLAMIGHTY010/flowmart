import React, { useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import {
  ArrowLeft,
  Camera,
  Calendar,
  Mail,
  Phone,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { VendorButton } from "@/components/ui/button";
import { UserInput } from "@/components/ui/input";
import SideBanner from "@/components/SideBanner";

export default function Register() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, user } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Male");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dateInputRef = useRef<HTMLInputElement>(null);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const isFormEmpty =
    !firstName.trim() ||
    !lastName.trim() ||
    !phoneNumber.trim() ||
    !email.trim() ||
    !dob.trim();

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (file) {
      setProfileImage(URL.createObjectURL(file));
    }
  };

  const handleRegister = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");

    if (isFormEmpty) {
      setError(
        "Please fill out all required personal information fields"
      );
      return;
    }

    setLoading(true);

    const result = await register({
      firstName,
      lastName,
      phoneNumber,
      email,
      dob,
      gender,
      profileImage,
    });

    setLoading(false);

    if (!result.success) {
      setError(
        result.error ||
        "Failed to create account. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 lg:flex">
      <SideBanner />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-4 py-6 md:px-6 lg:px-8">
          {/* Header */}
          <div className="relative mb-4 flex items-center">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-primary transition hover:opacity-80"
            >
              <ArrowLeft size={22} />
            </button>

            <h1 className="absolute left-1/2 -translate-x-1/2 text-xl font-bold">
              Create Account
            </h1>
          </div>

          {/* Progress */}
          <div className="mb-3 flex items-center gap-1.5">
            <div className="h-1.5 w-6 rounded-full bg-primary" />
            <div className="h-1.5 w-1.5 rounded-full bg-muted" />
            <div className="h-1.5 w-1.5 rounded-full bg-muted" />

            <span className="ml-1 text-xs font-semibold text-primary">
              Personal Info
            </span>
          </div>

          <p className="mb-6 text-sm text-muted-foreground">
            Let's get you started as a FlowMart rider
          </p>

          <form
            onSubmit={handleRegister}
            className="rounded-2xl border bg-card p-5 shadow-sm"
          >
            <div className="space-y-5">
              {error && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Avatar */}
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
                  className="group relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-primary bg-muted"
                >
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Camera size={24} className="text-primary" />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 text-xs font-semibold text-primary hover:underline"
                >
                  Upload Photo
                </button>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <UserInput
                  label="First Name"
                  name="firstName"
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />

                {/* Last Name */}
                <UserInput
                  label="Last Name"
                  name="lastName"
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />

                {/* Phone Number */}
                <UserInput
                  ref={dateInputRef}
                  label="Date of Birth"
                  type="date"
                  rightIcon={
                    <Calendar
                      size={18}
                      onClick={() => dateInputRef.current?.showPicker()}
                    />
                  }
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />

                {/* Email */}
                <UserInput
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail size={18} />}
                  required
                />
          
                {/* Gender */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Gender
                  </label>

                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="h-12
        w-full
        rounded-lg
        border
        border-gray-300
        bg-background
        px-3
        text-sm
        text-foreground
        focus:border-primary
        focus:outline-none
        focus:ring-2
        focus:ring-primary/20
      "
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Date of Birth */}
                <UserInput
                  label="Date of Birth"
                  name="dob"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                />
              </div>

              <VendorButton
                type="submit"
                disabled={loading || isFormEmpty}
                className="w-full"
              >
                {loading ? "Processing..." : "Continue"}
              </VendorButton>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="font-semibold text-primary hover:underline"
                >
                  Sign In
                </button>
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}