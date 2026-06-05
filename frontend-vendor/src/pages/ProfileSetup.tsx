import * as React from "react";
import { useState, useRef } from "react";
import { User, Phone, MapPin, Building2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function Profile({ onNext }: { onNext: () => void }) {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    displayName: "Chukwuemeka Vendor",
    businessPhone: "+234 803 456 7890",
    stateRegion: "Lagos",
    city: "Ikeja",
    bio: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Profile Data Saved:", formData, profileImage);
    onNext(); // Moves to Step 3: KYC
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm rounded-3xl overflow-hidden min-h-[740px] flex flex-col justify-between shadow-none border-none sm:border sm:shadow-sm bg-background">
        
        {/* STEPPER HEADER BLOCK */}
        <div className="bg-[#155331] text-white pt-8 pb-6 px-6 rounded-b-[2rem]">
          {/* Stepper Progress bar */}
          <div className="flex items-center justify-between max-w-xs mx-auto text-xs font-medium">
            {/* Step 1: Account (Completed) */}
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className="w-6 h-6 rounded-full bg-[#22c55e] text-white flex items-center justify-center text-[10px]">
                ✓
              </div>
              <span className="text-[#22c55e] text-[11px]">Account</span>
            </div>
            <div className="h-[2px] bg-[#22c55e] flex-grow -mt-4 mx-1"></div>

            {/* Step 2: Profile (Active) */}
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className="w-6 h-6 rounded-full bg-white text-[#155331] flex items-center justify-center font-bold text-[11px]">
                2
              </div>
              <span className="text-white text-[11px] font-semibold">Profile</span>
            </div>
            <div className="h-[2px] bg-muted/30 flex-grow -mt-4 mx-1"></div>

            {/* Step 3: KYC */}
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className="w-6 h-6 rounded-full bg-[#1e293b]/40 text-muted-foreground flex items-center justify-center text-[11px] border border-white/20">
                3
              </div>
              <span className="text-white/60 text-[11px]">KYC</span>
            </div>
            <div className="h-[2px] bg-muted/30 flex-grow -mt-4 mx-1"></div>

            {/* Step 4: Store */}
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className="w-6 h-6 rounded-full bg-[#1e293b]/40 text-muted-foreground flex items-center justify-center text-[11px] border border-white/20">
                4
              </div>
              <span className="text-white/60 text-[11px]">Store</span>
            </div>
          </div>
        </div>

        {/* PROFILE CONTENT SECTION */}
        <CardContent className="pt-6 flex-grow flex flex-col justify-between gap-4">
          <div>
            <div className="mb-5">
              <h1 className="text-2xl font-bold text-foreground">Your Profile</h1>
              <p className="text-sm text-muted-foreground">Tell us a bit about yourself</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* AVATAR UPLOAD COMPONENT */}
              <div className="flex flex-col items-center justify-center mb-4">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-20 h-20 bg-muted rounded-full cursor-pointer group border-2 border-background shadow-inner flex items-center justify-center overflow-hidden"
                >
                  {profileImage ? (
                    <img src={profileImage} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-muted-foreground" />
                  )}
                  {/* Camera overlay asset icon */}
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#22c55e] rounded-full border-2 border-background flex items-center justify-center">
                    <Camera className="w-3 h-3 text-white" />
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                  accept="image/*" 
                  className="hidden" 
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-muted-foreground mt-2 hover:text-foreground transition"
                >
                  Tap to upload profile photo
                </button>
              </div>

              {/* DISPLAY NAME */}
              <div className="space-y-1.5">
                <Label htmlFor="displayName">Display Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="displayName"
                    name="displayName"
                    type="text"
                    value={formData.displayName}
                    onChange={handleChange}
                    className="pl-10 bg-muted/40 border-muted"
                    required
                  />
                </div>
              </div>

              {/* BUSINESS PHONE */}
              <div className="space-y-1.5">
                <Label htmlFor="businessPhone">Business Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="businessPhone"
                    name="businessPhone"
                    type="tel"
                    value={formData.businessPhone}
                    onChange={handleChange}
                    className="pl-10 bg-muted/40 border-muted"
                    required
                  />
                </div>
              </div>

              {/* STATE / REGION */}
              <div className="space-y-1.5">
                <Label htmlFor="stateRegion">State / Region</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="stateRegion"
                    name="stateRegion"
                    type="text"
                    value={formData.stateRegion}
                    onChange={handleChange}
                    className="pl-10 bg-muted/40 border-muted"
                    required
                  />
                </div>
              </div>

              {/* CITY */}
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleChange}
                    className="pl-10 bg-muted/40 border-muted"
                    required
                  />
                </div>
              </div>

              {/* BIO TEXTAREA */}
              <div className="space-y-1.5">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  name="bio"
                  placeholder="Short description about your business..."
                  value={formData.bio}
                  onChange={handleChange}
                  rows={2}
                  className="w-full rounded-lg border border-muted bg-muted/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>

              {/* SUBMIT BUTTON */}
              <Button type="submit" className="w-full bg-[#10a34c] hover:bg-[#0e8f42] py-3.5 rounded-full font-semibold text-white mt-4">
                Save & Continue
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}