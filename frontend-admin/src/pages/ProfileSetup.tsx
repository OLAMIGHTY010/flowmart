import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { UserInput } from '@/components/ui/input';
import { VendorButton } from '@/components/ui/button';
import { Loader2, UserCircle } from 'lucide-react';
import { apiClient } from '@/services/api';

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    gender: user?.gender || '',
    church: '',
    zonal: '',
    department: '',
    professionalCertification: '',
    grade: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiClient.put('/users/profile', formData);
      await refreshUser();
      
      if (user?.forcePasswordChange) {
        navigate('/force-password-change');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-[#14532d] p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')]"></div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30">
            <UserCircle size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Complete Your Profile</h1>
          <p className="text-sm text-green-100 mt-2 font-medium">Please provide your staff details to continue.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8">
          {error && (
            <div className="mb-6 bg-red-50 text-red-600 text-xs px-4 py-3 rounded-xl font-semibold text-center border border-red-100 w-full">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <UserInput 
              label="Full Name" 
              name="fullName" 
              value={formData.fullName} 
              onChange={handleChange} 
              disabled 
              className="bg-slate-50 cursor-not-allowed"
            />
            
            <UserInput 
              label="Phone Number" 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange} 
              required
              placeholder="e.g. 08012345678"
            />

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Gender</label>
              <select 
                name="gender" 
                value={formData.gender} 
                onChange={handleChange}
                required
                className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#0ca948]/20 focus:border-[#0ca948] outline-none transition-all text-sm"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <UserInput 
              label="Church" 
              name="church" 
              value={formData.church} 
              onChange={handleChange} 
              required
              placeholder="e.g. RCCG Main Parish"
            />

            <UserInput 
              label="Zonal" 
              name="zonal" 
              value={formData.zonal} 
              onChange={handleChange} 
              required
              placeholder="e.g. Zone 4"
            />

            <UserInput 
              label="Department" 
              name="department" 
              value={formData.department} 
              onChange={handleChange} 
              required
              placeholder="e.g. Finance"
            />

            <UserInput 
              label="Professional Certification" 
              name="professionalCertification" 
              value={formData.professionalCertification} 
              onChange={handleChange} 
              placeholder="e.g. ICAN, ACCA (Optional)"
            />

            <UserInput 
              label="Grade" 
              name="grade" 
              value={formData.grade} 
              onChange={handleChange} 
              placeholder="e.g. Level 2 (Optional)"
            />
          </div>

          <VendorButton type="submit" disabled={loading} className="w-full bg-[#0ca948] hover:bg-[#0a8c3c]">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save & Continue"}
          </VendorButton>
        </form>

      </div>
    </div>
  );
}
