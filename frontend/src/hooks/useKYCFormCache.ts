import { useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * KYC Form Data cache using TanStack Query.
 * 
 * Stores form state in the query cache so navigating back/forward
 * between KYC pages preserves all user input without re-fetching.
 * Data is also persisted to sessionStorage for cross-session durability.
 */

// ── Profile Setup Form Cache ──
export interface ProfileSetupFormData {
  displayName: string;
  phone: string;
  stateRegion: string;
  city: string;
  bio: string;
  avatar: string;
}

const PROFILE_SETUP_KEY = ["profileSetupForm"] as const;
const PROFILE_SETUP_STORAGE_KEY = "rider_profile_setup_form";

function loadProfileSetupFromStorage(): ProfileSetupFormData {
  try {
    const stored = sessionStorage.getItem(PROFILE_SETUP_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return {
    displayName: '',
    phone: '',
    stateRegion: '',
    city: '',
    bio: '',
    avatar: '',
  };
}

export function useProfileSetupFormCache() {
  const queryClient = useQueryClient();

  const { data } = useQuery<ProfileSetupFormData>({
    queryKey: PROFILE_SETUP_KEY,
    queryFn: () => loadProfileSetupFromStorage(),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const updateForm = (updates: Partial<ProfileSetupFormData>) => {
    const current = queryClient.getQueryData<ProfileSetupFormData>(PROFILE_SETUP_KEY) || loadProfileSetupFromStorage();
    const next = { ...current, ...updates };
    queryClient.setQueryData(PROFILE_SETUP_KEY, next);
    try {
      const toStore = { ...next, avatar: '' }; // Omit base64 avatar from sessionStorage to prevent quota limits
      sessionStorage.setItem(PROFILE_SETUP_STORAGE_KEY, JSON.stringify(toStore));
    } catch (e) {
      console.warn("sessionStorage quota exceeded for profile setup", e);
    }
  };

  return {
    formData: data || loadProfileSetupFromStorage(),
    updateForm,
  };
}

// ── KYCInfo Form Cache ──
export interface KYCInfoFormData {
  bankName: string;
  accountNumber: string;
  accountName: string;
  vehicleType: string;
  makeModel: string;
  year: string;
  plateNumber: string;
  color: string;
  documents: {
    id: string;
    title: string;
    subtitle: string;
    status: 'uploaded' | 'upload';
    fileName?: string;
    filePreviewUrl?: string;
    base64?: string;
  }[];
}

const KYC_INFO_KEY = ["kycInfoForm"] as const;
const KYC_INFO_STORAGE_KEY = "rider_kyc_info_form";

function loadKYCInfoFromStorage(): KYCInfoFormData {
  const defaultState: KYCInfoFormData = {
    bankName: '',
    accountNumber: '',
    accountName: '',
    vehicleType: 'Motorcycle',
    makeModel: '',
    year: '',
    plateNumber: '',
    color: '',
    documents: [
      { id: 'insurance', title: 'Upload Vehicle Insurance', subtitle: 'Valid insurance document', status: 'upload' },
      { id: 'road_worthiness', title: 'Upload Road Worthiness Certificate', subtitle: 'Valid road worthiness cert', status: 'upload' },
      { id: 'car_image', title: 'Upload Car Image', subtitle: 'Clear photo of your vehicle showing the plate number', status: 'upload' },
    ],
  };

  try {
    const stored = sessionStorage.getItem(KYC_INFO_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.documents && Array.isArray(parsed.documents)) {
        parsed.documents = parsed.documents.map((d: any) => {
          if (d.status === 'uploaded' && !d.base64) {
            return { ...d, status: 'upload', fileName: undefined, filePreviewUrl: undefined };
          }
          return { ...d, filePreviewUrl: undefined };
        });
      } else {
        parsed.documents = defaultState.documents;
      }
      return { ...defaultState, ...parsed };
    }
  } catch { /* ignore */ }
  return defaultState;
}

export function useKYCInfoFormCache() {
  const queryClient = useQueryClient();

  const { data } = useQuery<KYCInfoFormData>({
    queryKey: KYC_INFO_KEY,
    queryFn: () => loadKYCInfoFromStorage(),
    staleTime: Infinity,       // Never auto-refetch
    gcTime: 1000 * 60 * 60,   // Keep in cache for 1 hour
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const updateForm = (updates: Partial<KYCInfoFormData>) => {
    const current = queryClient.getQueryData<KYCInfoFormData>(KYC_INFO_KEY) || loadKYCInfoFromStorage();
    const next = { ...current, ...updates };
    queryClient.setQueryData(KYC_INFO_KEY, next);
    const toStore = {
      ...next,
      documents: next.documents.map(d => ({ ...d, filePreviewUrl: undefined })),
    };
    try {
      sessionStorage.setItem(KYC_INFO_STORAGE_KEY, JSON.stringify(toStore));
    } catch (e) {
      console.warn("sessionStorage quota exceeded for kyc info", e);
    }
  };

  return {
    formData: data || loadKYCInfoFromStorage(),
    updateForm,
  };
}





// ── KYCSubmit Form Cache ──
export interface KYCSubmitFormData {
  govIdType: string;
  guarantorName: string;
  guarantorPhone: string;
  guarantorRelationship: string;
  documents: {
    id: string;
    title: string;
    subtitle: string;
    status: 'uploaded' | 'upload';
    fileName?: string;
    filePreviewUrl?: string;
    base64?: string;
  }[];
}

const KYC_SUBMIT_KEY = ["kycSubmitForm"] as const;
const KYC_SUBMIT_STORAGE_KEY = "rider_kyc_submit_form";

function loadKYCSubmitFromStorage(): KYCSubmitFormData {
  try {
    const stored = sessionStorage.getItem(KYC_SUBMIT_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // filePreviewUrl won't survive sessionStorage (blob URLs are session-scoped)
      // so mark uploaded docs as uploaded but without preview
      if (parsed.documents) {
        parsed.documents = parsed.documents.map((d: any) => {
          if (d.status === 'uploaded' && !d.base64) {
            return { ...d, status: 'upload', fileName: undefined, filePreviewUrl: undefined };
          }
          return { ...d, filePreviewUrl: undefined };
        });
      }
      return parsed;
    }
  } catch { /* ignore */ }
  return {
    govIdType: 'national_id',
    guarantorName: '',
    guarantorPhone: '',
    guarantorRelationship: '',
    documents: [
      { id: 'government_id', title: 'Government ID', subtitle: 'Upload a valid government-issued ID', status: 'upload' },
      { id: 'guarantor_id', title: 'Guarantor ID', subtitle: "Upload guarantor's government-issued ID", status: 'upload' },
      { id: 'rider_image', title: 'Rider Image/Logo', subtitle: "Clear photo of yourself for your rider profile", status: 'upload' },
    ],
  };
}

export function useKYCSubmitFormCache() {
  const queryClient = useQueryClient();

  const { data } = useQuery<KYCSubmitFormData>({
    queryKey: KYC_SUBMIT_KEY,
    queryFn: () => loadKYCSubmitFromStorage(),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const updateForm = (updates: Partial<KYCSubmitFormData>) => {
    const current = queryClient.getQueryData<KYCSubmitFormData>(KYC_SUBMIT_KEY) || loadKYCSubmitFromStorage();
    const next = { ...current, ...updates };
    queryClient.setQueryData(KYC_SUBMIT_KEY, next);
    // Save to sessionStorage (strip blob URLs which are session-only)
    const toStore = {
      ...next,
      documents: next.documents.map(d => ({ ...d, filePreviewUrl: undefined })),
    };
    try {
      sessionStorage.setItem(KYC_SUBMIT_STORAGE_KEY, JSON.stringify(toStore));
    } catch (e) {
      console.warn("sessionStorage quota exceeded for kyc submit", e);
    }
  };

  return {
    formData: data || loadKYCSubmitFromStorage(),
    updateForm,
  };
}
