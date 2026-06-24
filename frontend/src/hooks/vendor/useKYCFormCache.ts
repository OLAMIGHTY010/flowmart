import { useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * KYC Form Data cache using TanStack Query.
 * 
 * Stores form state in the query cache so navigating back/forward
 * between KYC pages preserves all user input without re-fetching.
 * Data is also persisted to localStorage for cross-session durability.
 */

// ── Profile Setup Form Cache ──
export interface ProfileSetupFormData {
  displayName: string;
  businessName: string;
  businessPhone: string;
  stateRegion: string;
  city: string;
  bio: string;
  avatar: string;
  dob?: string;
  gender?: string;
}

const PROFILE_SETUP_KEY = ["profileSetupForm"] as const;
const PROFILE_SETUP_STORAGE_KEY = "vendor_profile_setup_form";

function loadProfileSetupFromStorage(): ProfileSetupFormData {
  try {
    const stored = localStorage.getItem(PROFILE_SETUP_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return {
    displayName: '',
    businessName: '',
    businessPhone: '',
    stateRegion: '',
    city: '',
    bio: '',
    avatar: '',
    dob: '',
    gender: '',
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
    localStorage.setItem(PROFILE_SETUP_STORAGE_KEY, JSON.stringify(next));
  };

  return {
    formData: data || loadProfileSetupFromStorage(),
    updateForm,
  };
}

// ── KYCInfo Form Cache ──
export interface KYCInfoFormData {
  vendorType: 'individual' | 'business';
  tin: string;
  businessName: string;
  cacNo: string;
  campCertificateId: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

const KYC_INFO_KEY = ["kycInfoForm"] as const;
const KYC_INFO_STORAGE_KEY = "vendor_kyc_info_form";

function loadKYCInfoFromStorage(): KYCInfoFormData {
  try {
    const stored = localStorage.getItem(KYC_INFO_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return {
    vendorType: 'individual',
    tin: '',
    businessName: '',
    cacNo: '',
    campCertificateId: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
  };
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
    localStorage.setItem(KYC_INFO_STORAGE_KEY, JSON.stringify(next));
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
const KYC_SUBMIT_STORAGE_KEY = "vendor_kyc_submit_form";

function loadKYCSubmitFromStorage(): KYCSubmitFormData {
  const defaultState: KYCSubmitFormData = {
    govIdType: 'national_id',
    guarantorName: '',
    guarantorPhone: '',
    guarantorRelationship: '',
    documents: [
      { id: 'government_id', title: 'Government ID', subtitle: 'Upload a valid government-issued ID', status: 'upload' },
      { id: 'camp_certificate', title: 'Camp Certificate', subtitle: 'Upload your camp certificate document', status: 'upload' },
      { id: 'guarantor_id', title: 'Guarantor ID', subtitle: "Upload guarantor's government-issued ID", status: 'upload' },
      { id: 'bank_reference', title: 'Bank Reference / Statement', subtitle: "Upload stamped bank reference letter or statement", status: 'upload' },
      { id: 'cac_document', title: 'CAC Registration Document', subtitle: "Upload CAC 1.1 or Status Report", status: 'upload' },
    ],
  };

  try {
    const stored = localStorage.getItem(KYC_SUBMIT_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // filePreviewUrl won't survive localStorage (blob URLs are session-scoped)
      if (parsed.documents && Array.isArray(parsed.documents)) {
        const storedDocsMap = new Map<string, any>(parsed.documents.map((d: any) => [d.id, d]));
        
        parsed.documents = defaultState.documents.map(defaultDoc => {
          const storedDoc = storedDocsMap.get(defaultDoc.id);
          if (storedDoc) {
            return {
              ...storedDoc,
              filePreviewUrl: undefined,
            };
          }
          return defaultDoc;
        });
      } else {
        parsed.documents = defaultState.documents;
      }
      return { ...defaultState, ...parsed, documents: parsed.documents };
    }
  } catch { /* ignore */ }
  return defaultState;
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
    // Save to localStorage (strip blob URLs which are session-only)
    const toStore = {
      ...next,
      documents: next.documents.map(d => ({ ...d, filePreviewUrl: undefined, base64: undefined })),
    };
    try {
      localStorage.setItem(KYC_SUBMIT_STORAGE_KEY, JSON.stringify(toStore));
    } catch (e) {
      console.warn("localStorage quota exceeded for kyc submit", e);
    }
  };

  return {
    formData: data || loadKYCSubmitFromStorage(),
    updateForm,
  };
}
