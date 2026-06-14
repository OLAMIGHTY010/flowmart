import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Loader2 } from "lucide-react";
import { UserInput } from "@/components/ui/input";

export default function EditProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial mock state
  const [firstName, setFirstName] = useState("Martha");
  const [lastName, setLastName] = useState("Johnson");
  const [email, setEmail] = useState("martha@email.com");
  const [phone, setPhone] = useState("08012345678");
  const [profileImage, setProfileImage] = useState<string>("https://images.unsplash.com/photo-1531123897727-8f129e1bf98c?w=150&h=150&fit=crop&crop=faces");
  const [loading, setLoading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(URL.createObjectURL(file));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API save
    setTimeout(() => {
      setLoading(false);
      navigate("/profile");
    }, 1000);
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:px-6 md:max-w-none md:px-0 md:py-0">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="md:hidden flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 transition hover:bg-gray-50"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-extrabold text-gray-900 md:text-2xl">Edit Profile</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar Upload */}
        <div className="flex flex-col items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <div className="relative">
            <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-sm bg-gray-100">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-400">
                  <Camera size={28} />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-green-500 text-white shadow-sm hover:bg-green-600 transition"
            >
              <Camera size={14} />
            </button>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <UserInput
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <UserInput
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <UserInput
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled
          />
          <p className="mt-1 text-xs text-gray-400">Email addresses cannot be changed.</p>

          <UserInput
            label="Phone Number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-4 text-sm font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-green-700 disabled:bg-green-400 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </form>
    </div>
  );
}
