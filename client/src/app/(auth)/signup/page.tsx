'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertMessage } from '../../../components/AlertMessage';
import { SignupFormData, TaxItem } from './components/types';
import { BasicDetailsStep } from './components/BasicDetailsStep';
import { OtpVerificationStep } from './components/OtpVerificationStep';
import { UserProfileStep } from './components/UserProfileStep';
import { CompanyProfileStep } from './components/CompanyProfileStep';
import { BranchSettingsStep } from './components/BranchSettingsStep';
import { BankDetailsStep } from './components/BankDetailsStep';
import { API_BASE as API_BASE_URL, saveAuthData } from '../../../lib/auth';

const DashboardSkeleton = () => (
  <div className="fixed inset-0 z-0 flex bg-background/50 overflow-hidden opacity-30 pointer-events-none select-none">
    {/* Sidebar */}
    <div className="w-[260px] h-full border-r border-outline-variant/20 bg-surface/40 flex-col hidden md:flex">
      <div className="h-20 border-b border-outline-variant/10"></div>
      <div className="p-4 space-y-4 flex-1">
        {[1,2,3,4,5,6].map(i => <div key={i} className="h-10 rounded-lg bg-surface-container/50"></div>)}
      </div>
    </div>
    {/* Main Content */}
    <div className="flex-1 flex flex-col">
      <div className="h-20 border-b border-outline-variant/20 bg-surface/40"></div>
      <div className="p-8 space-y-6 flex-1">
        <div className="h-32 rounded-2xl bg-surface-container/30"></div>
        <div className="flex gap-6">
          <div className="flex-1 h-64 rounded-2xl bg-surface-container/30"></div>
          <div className="flex-1 h-64 rounded-2xl bg-surface-container/30"></div>
        </div>
      </div>
    </div>
  </div>
);

export default function SignupPage() {
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<SignupFormData>({
    email: '', mobileNumber: '', password: '', confirmPassword: '',
    emailOtp: '', mobileOtp: '',
    fullName: '', profilePicture: null,
    companyName: '', companyLogo: null, tagline: '', businessIdName: '', businessIdNumber: '',
    branchName: '', address: '', city: '', state: '', pincode: '', branchPhone: '', branchEmail: '', signatureText: '', taxes: [],
    bankName: '', accountName: '', accountNumber: '', ifscCode: '', upiId: ''
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof SignupFormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const updateData = (fields: Partial<SignupFormData>) => {
    setFormData(prev => ({ ...prev, ...fields }));
  };

  const clearError = (field: keyof SignupFormData) => {
    setErrors(prev => ({ ...prev, [field]: undefined }));
    setGlobalError('');
  };

  const validateStep1 = async () => {
    const newErrors: any = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Valid email is required.';
    if (!/^\d{10}$/.test(formData.mobileNumber)) newErrors.mobileNumber = 'Valid 10-digit mobile is required.';
    if (formData.password.length < 6) newErrors.password = 'Min 6 characters required.';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/check-duplicate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, phoneNumber: formData.mobileNumber })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.message && data.message.includes('phone number')) {
          setErrors({ mobileNumber: data.message });
        } else if (data.message && data.message.includes('email')) {
          setErrors({ email: data.message });
        } else {
          setGlobalError(data.message || 'Validation failed');
        }
        setLoading(false);
        return false;
      }
      
      await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, phoneNumber: formData.mobileNumber })
      });
      
      setLoading(false);
      return true;
    } catch (err) {
      setGlobalError('Network error checking duplicates.');
      setLoading(false);
      return false;
    }
  };

  const validateStep2 = async () => {
    if (!formData.emailOtp) {
      setGlobalError('Please enter the 6-digit email OTP');
      return false;
    }
    
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, emailOtp: formData.emailOtp })
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        setGlobalError(data.message || 'Invalid OTP');
        return false;
      }
      return true;
    } catch (err) {
      setGlobalError('Network error verifying OTP.');
      setLoading(false);
      return false;
    }
  };

  const handleNext = async () => {
    setGlobalError('');
    if (step === 1) {
      const isValid = await validateStep1();
      if (isValid) setStep(2);
    } else if (step === 2) {
      const isValid = await validateStep2();
      if (isValid) setStep(3);
    } else if (step === 3) {
      if (!formData.fullName) { setErrors({ fullName: 'Name is required' }); return; }
      setStep(4);
    } else if (step === 4) {
      if (!formData.companyName) { setErrors({ companyName: 'Company Name is required' }); return; }
      setStep(5);
    } else if (step === 5) {
      if (!formData.branchName) { setErrors({ branchName: 'Branch Name is required' }); return; }
      setStep(6);
    }
  };

  const handleSkip = () => {
    setGlobalError('');
    if (step === 4) {
      updateData({ companyName: formData.companyName || 'My Company' });
      setStep(5);
    } else if (step === 5) {
      updateData({ branchName: formData.branchName || 'Main Branch' });
      setStep(6);
    } else if (step === 6) {
      handleFinalSubmit(); // Submit registration
    }
  };

  const handleFinalSubmit = async () => {
    try {
      setLoading(true);
      setGlobalError('');
      
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'profilePicture' || key === 'companyLogo') {
          if (value instanceof File) payload.append(key, value);
        } else if (key === 'taxes') {
          payload.append(key, JSON.stringify(value));
        } else {
          payload.append(key, String(value));
        }
      });

      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        body: payload,
      });

      const data = await res.json();
      if (!res.ok) {
        setGlobalError(data.message || 'Registration failed');
        setLoading(false);
        return;
      }

      saveAuthData(data.accessToken, data.refreshToken, data.user);

      setSuccessMsg('Registration complete! Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/home');
      }, 1500);
    } catch (err) {
      setGlobalError('Network error during registration.');
      setLoading(false);
    }
  };

  const renderStep = () => {
    const props = { formData, updateData, errors, clearError };
    switch (step) {
      case 1: return <BasicDetailsStep {...props} />;
      case 2: return <OtpVerificationStep {...props} />;
      case 3: return <UserProfileStep {...props} />;
      case 4: return <CompanyProfileStep {...props} />;
      case 5: return <BranchSettingsStep {...props} />;
      case 6: return <BankDetailsStep {...props} />;
      default: return null;
    }
  };

  const titles = [
    'Create Account', 'Verify OTP', 'User Profile', 'Company Profile', 'Branch Settings', 'Bank Details'
  ];
  const descriptions = [
    'Basic login details', 'Verify your contact info', 'Personal information', 'Your business details', 'Configure your main branch', 'For receiving payments'
  ];

  const isDashboardLayout = step > 2;

  const renderProgressBar = () => {
    const totalSteps = 4;
    const currentSetupStep = step - 2; 
    
    return (
      <div className="w-full mb-8 relative">
        {/* Background connector line */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-surface-container -translate-y-1/2 rounded-full z-0"></div>
        
        {/* Active connector line */}
        <div 
          className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full z-0 transition-all duration-700 ease-out"
          style={{ width: `${((currentSetupStep - 1) / (totalSteps - 1)) * 100}%` }}
        ></div>

        <div className="relative z-10 flex justify-between items-center w-full px-1">
          {[1, 2, 3, 4].map(s => {
            const isCompleted = s < currentSetupStep;
            const isCurrent = s === currentSetupStep;
            
            return (
              <div 
                key={s} 
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 shadow-sm
                  ${isCompleted ? 'bg-primary text-on-primary ring-4 ring-primary/20 scale-105' : ''}
                  ${isCurrent ? 'bg-surface border-2 border-primary text-primary ring-4 ring-primary/10 scale-110 shadow-md' : ''}
                  ${!isCompleted && !isCurrent ? 'bg-surface-container border border-outline-variant/30 text-on-surface-variant' : ''}
                `}
              >
                {isCompleted ? <span className="material-symbols-outlined text-[16px]">check</span> : s}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const dashboardContent = (
    <div className="w-full max-w-5xl animate-in zoom-in-95 fade-in duration-700 ease-out">
      <div className="glass-panel-elevated rounded-[2.5rem] relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.2)] bg-surface/90 backdrop-blur-3xl border border-primary/20 flex flex-col md:flex-row h-[750px] max-h-[90vh]">
        
        {/* Left Branding Panel (Hidden on mobile) */}
        <div className="hidden md:flex md:w-5/12 bg-primary/5 border-r border-primary/10 flex-col justify-between p-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-tertiary/10"></div>
          
          <div className="relative z-10 flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
               <span className="material-symbols-outlined text-primary text-xl">account_balance_wallet</span>
             </div>
             <div>
                <h1 className="text-3xl font-display font-black tracking-tight text-on-surface leading-none">BillTea</h1>
                <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mt-1">Business Suite</p>
             </div>
          </div>

          <div className="relative z-10 my-auto w-full animate-in slide-in-from-bottom-8 fade-in duration-700 fill-mode-both" key={`branding-${step}`}>
            <div className="bg-surface/60 backdrop-blur-md border border-outline-variant/20 rounded-3xl p-8 shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-6 border border-primary/20 shadow-inner">
                <span className="material-symbols-outlined text-primary text-3xl">
                  {step === 3 && 'person'}
                  {step === 4 && 'storefront'}
                  {step === 5 && 'apartment'}
                  {step === 6 && 'account_balance'}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-on-surface mb-3 tracking-tight font-display">
                {step === 3 && 'Complete Your Profile'}
                {step === 4 && 'Your Company Details'}
                {step === 5 && 'Setup Main Branch'}
                {step === 6 && 'Bank Information'}
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {step === 3 && 'Let\'s start by getting to know you. Add your name and a profile picture to personalize your account.'}
                {step === 4 && 'Tell us about your business. This information will be prominently displayed on your invoices and quotations.'}
                {step === 5 && 'Configure your primary branch location. You can seamlessly add more branches later from the dashboard.'}
                {step === 6 && 'Add your bank details so clients know where to send payments. This is strictly used for your invoices.'}
              </p>
            </div>
          </div>
          
          <div className="relative z-10 flex items-center gap-2 text-on-surface-variant text-xs font-semibold">
             <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
             <span>Secure Setup Mode</span>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="flex-1 p-8 sm:p-12 flex flex-col justify-center relative h-full min-h-0">
          <div className="w-full max-w-md mx-auto h-full flex flex-col max-h-full min-h-0">
            {renderProgressBar()}

            <div className="flex justify-between items-end mb-8">
              <div className="text-left">
                <h2 className="font-headline text-3xl font-bold text-on-surface mb-1 tracking-tight">{titles[step - 1]}</h2>
                <p className="text-on-surface-variant text-sm font-medium">{descriptions[step - 1]}</p>
              </div>
            </div>

            <AlertMessage message={globalError} type="error" className="mb-4 shrink-0" />
            <AlertMessage message={successMsg} type="success" className="mb-4 shrink-0" />

            <div className="mb-6 flex-1 overflow-y-auto pr-2 min-h-0" style={{ scrollbarWidth: 'thin' }}>
              <div className="animate-in slide-in-from-right-8 fade-in duration-500 fill-mode-both pb-4" key={`form-${step}`}>
                {renderStep()}
              </div>
            </div>

            <div className="flex gap-3 mt-auto pt-4">
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                disabled={loading}
                className="py-3 px-5 rounded-full font-semibold flex items-center justify-center cursor-pointer border border-primary/30 transition-all duration-300 hover:bg-primary/5 text-primary shrink-0"
              >
                Back
              </button>

              {step >= 4 && step <= 6 && !successMsg && (
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-full font-semibold flex items-center justify-center space-x-2 cursor-pointer border border-on-surface-variant/20 transition-all duration-300 hover:bg-on-surface-variant/10 text-on-surface-variant"
                >
                  Skip
                </button>
              )}
              
              {step < 6 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={loading}
                  className="flex-[2] btn-primary py-3 px-4 rounded-full font-semibold flex items-center justify-center space-x-2 cursor-pointer transition-all duration-300"
                >
                  <span>{loading ? 'Processing...' : 'Continue'}</span>
                  {!loading && <span className="material-symbols-outlined text-xl">arrow_forward</span>}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={loading || !!successMsg}
                  className="flex-[2] btn-primary py-3 px-4 rounded-full font-semibold flex items-center justify-center space-x-2 cursor-pointer transition-all duration-300 shadow-[0_0_20px_rgba(125,211,252,0.3)] hover:shadow-lg"
                >
                  <span>{loading ? 'Creating...' : 'Complete Setup'}</span>
                  {!loading && <span className="material-symbols-outlined text-xl">check_circle</span>}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const standardContent = (
    <div className="w-full max-w-md animate-fade-in transition-all duration-500">
      <div className="glass-panel-elevated rounded-3xl p-8 sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-70"></div>
        
        <div className="flex justify-between items-end mb-6 border-b border-primary/10 pb-4">
          <div className="text-left">
            <h2 className="font-headline text-2xl font-bold text-on-surface mb-1 tracking-tight">{titles[step - 1]}</h2>
            <p className="text-on-surface-variant text-sm">{descriptions[step - 1]}</p>
          </div>
          <div className="text-sm font-semibold text-primary/60 bg-primary/10 px-3 py-1 rounded-full shrink-0">
            Step {step}/6
          </div>
        </div>

        <AlertMessage message={globalError} type="error" className="mb-4" />
        <AlertMessage message={successMsg} type="success" className="mb-4" />

        <div className="mb-6">
          <div className="animate-in slide-in-from-right-4 fade-in duration-500 fill-mode-both" key={`standard-form-${step}`}>
            {renderStep()}
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          {step > 1 && !successMsg && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-full font-semibold flex items-center justify-center space-x-2 cursor-pointer border border-primary/30 transition-all duration-300 hover:bg-primary/5 text-primary"
            >
              Back
            </button>
          )}
          
          <button
            type="button"
            onClick={handleNext}
            disabled={loading}
            className="flex-[2] btn-primary py-3 px-4 rounded-full font-semibold flex items-center justify-center space-x-2 cursor-pointer transition-all duration-300"
          >
            <span>{loading ? 'Processing...' : 'Next'}</span>
            {!loading && <span className="material-symbols-outlined text-xl">arrow_forward</span>}
          </button>
        </div>

        {step === 1 && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
            >
              Already have an account? <span className="font-bold">Login</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (isDashboardLayout) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-background/40 backdrop-blur-xl transition-all duration-700 animate-in fade-in">
        <DashboardSkeleton />
        <div className="relative z-10 w-full flex justify-center">
          {dashboardContent}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-7/12 lg:absolute lg:left-0 lg:top-0 lg:bottom-0 flex items-center justify-center p-6 sm:p-12 z-20 transition-all duration-500">
      {standardContent}
    </div>
  );
}
