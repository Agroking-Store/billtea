export interface TaxItem {
  label: string;
  percentage: number;
}

export interface SignupFormData {
  // Step 1: Basic
  email: string;
  mobileNumber: string;
  password: string;
  confirmPassword: string;
  
  // Step 2: OTP
  emailOtp: string;
  mobileOtp: string;
  
  // Step 3: User Profile
  fullName: string;
  profilePicture: File | null;
  
  // Step 4: Company Profile
  companyName: string;
  companyLogo: File | null;
  tagline: string;
  businessIdName: string;
  businessIdNumber: string;
  
  // Step 5: Branch Settings
  branchName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  branchPhone: string;
  branchEmail: string;
  signatureText: string;
  taxes: TaxItem[];
  
  // Step 6: Bank Details
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
}

export interface StepProps {
  formData: SignupFormData;
  updateData: (fields: Partial<SignupFormData>) => void;
  errors: Partial<Record<keyof SignupFormData, string>>;
  clearError: (field: keyof SignupFormData) => void;
  onSkip?: () => void;
}
