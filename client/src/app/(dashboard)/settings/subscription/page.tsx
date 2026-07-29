'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../../../lib/auth';
import { useSubscription } from '../../../../components/SubscriptionProvider';

interface Plan {
  id: string;
  name: string;
  rank: 'TRIAL' | 'BRONZE' | 'SILVER' | 'GOLD';
  description: string;
  price: number;
  billingCycle: 'MONTHLY' | 'YEARLY';
  isRecommended: boolean;
  branchLimit: number;
  staffLimit: number;
  customerLimit: number;
  productLimit: number;
  invoiceLimit: number;
  quotationLimit: number;
  whatsappMessageLimit: number;
  customQuotationThemes: boolean;
  customInvoiceThemes: boolean;
  whatsappIntegration: boolean;
}

const getPlanTheme = (rank: string) => {
  switch (rank) {
    case 'BRONZE':
      return {
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/30',
        text: 'text-orange-600 dark:text-orange-400',
        textGradient: 'bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent',
        gradient: 'from-orange-600/20 to-orange-400/20',
        shadow: 'shadow-orange-500/20',
        hover: 'hover:border-orange-500/50 hover:shadow-[0_0_20px_rgba(249,115,22,0.2)] hover:-translate-y-2',
        button: 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-1',
        badge: 'bg-gradient-to-r from-orange-600 to-orange-500 text-white',
        icon: 'text-orange-500',
        glow: 'bg-orange-500/15',
        progress: 'bg-orange-500',
      };
    case 'SILVER':
      return {
        bg: 'bg-slate-400/10',
        border: 'border-slate-400/40',
        text: 'text-slate-600 dark:text-slate-300',
        textGradient: 'bg-gradient-to-r from-slate-500 to-slate-400 bg-clip-text text-transparent',
        gradient: 'from-slate-500/20 to-slate-300/20',
        shadow: 'shadow-slate-400/20',
        hover: 'hover:border-slate-400/60 hover:shadow-[0_0_20px_rgba(148,163,184,0.2)] hover:-translate-y-2',
        button: 'bg-gradient-to-r from-slate-600 to-slate-500 text-white shadow-slate-500/25 hover:shadow-slate-500/40 hover:-translate-y-1',
        badge: 'bg-gradient-to-r from-slate-600 to-slate-500 text-white',
        icon: 'text-slate-500',
        glow: 'bg-slate-400/15',
        progress: 'bg-slate-500',
      };
    case 'GOLD':
      return {
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/50',
        text: 'text-yellow-600 dark:text-yellow-400',
        textGradient: 'bg-gradient-to-r from-yellow-500 to-yellow-300 bg-clip-text text-transparent',
        gradient: 'from-yellow-500/20 to-yellow-300/20',
        shadow: 'shadow-yellow-500/30',
        hover: 'hover:border-yellow-500 hover:shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:-translate-y-2',
        button: 'bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-extrabold shadow-yellow-500/40 hover:shadow-yellow-500/60 hover:-translate-y-1',
        badge: 'bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold',
        icon: 'text-yellow-500',
        glow: 'bg-yellow-500/20',
        progress: 'bg-yellow-500',
      };
    default:
      return {
        bg: 'bg-primary/10',
        border: 'border-primary/30',
        text: 'text-primary',
        textGradient: 'bg-gradient-to-r from-primary to-primary-fixed bg-clip-text text-transparent',
        gradient: 'from-primary/20 to-primary-fixed/20',
        shadow: 'shadow-primary/20',
        hover: 'hover:border-primary/50 hover:shadow-[0_0_20px_rgba(var(--color-primary),0.2)] hover:-translate-y-2',
        button: 'bg-primary text-on-primary shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1',
        badge: 'bg-primary text-on-primary',
        icon: 'text-primary',
        glow: 'bg-primary/15',
        progress: 'bg-primary',
      };
  }
};

export default function SubscriptionPage() {
  const router = useRouter();
  const { data: subData, isLoading: subLoading, refreshSubscription } = useSubscription();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await apiFetch(`/subscription-plans/public/active`);
      if (!response.ok) throw new Error('Failed to load plans');
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (err) {
      console.error('Failed to fetch plans', err);
      setError('Failed to load subscription plans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (plan: Plan) => {
    setProcessingId(plan.id);
    setError(null);
    try {
      // 1. Create Razorpay order on backend
      const orderRes = await apiFetch(`/subscriptions/purchase`, {
        method: 'POST',
        body: JSON.stringify({ planId: plan.id })
      });
      if (!orderRes.ok) {
        const errorData = await orderRes.json();
        throw new Error(errorData.message || 'Failed to create order');
      }
      const orderData = await orderRes.json();

      const { amount, currency, orderId, keyId } = orderData;

      // If it's a free plan, it gets activated directly (no Razorpay checkout needed)
      if (orderData.subscription) {
        await refreshSubscription();
        alert(`${plan.name} activated successfully!`);
        return;
      }

      // 2. Open Razorpay Checkout
      const options = {
        key: keyId, 
        amount: amount, 
        currency: currency,
        name: "BillTea",
        description: `Purchase ${plan.name}`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            // 3. Verify payment on backend
            const verifyRes = await apiFetch(`/subscriptions/verify-payment`, {
              method: 'POST',
              body: JSON.stringify({
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature
              })
            });
            if (!verifyRes.ok) {
              const errData = await verifyRes.json();
              throw new Error(errData.message || 'Payment verification failed');
            }
            
            // 4. Refresh subscription data
            await refreshSubscription();
            
            alert('Subscription activated successfully!');
          } catch (err: any) {
            console.error('Payment verification failed:', err);
            setError(err.message || 'Payment verification failed');
          }
        },
        theme: {
          color: "#0284c7"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any){
        setError(`Payment Failed: ${response.error.description}`);
      });
      rzp.open();

    } catch (err: any) {
      console.error('Purchase initiation failed:', err);
      setError(err.message || 'Failed to initiate purchase');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features.')) return;
    
    setError(null);
    try {
      const response = await apiFetch(`/subscriptions/cancel`, { method: 'POST' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel subscription');
      }
      await refreshSubscription();
      alert('Subscription cancelled successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to cancel subscription');
    }
  };

  if (loading || subLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentSub = subData?.subscription;
  const currentTheme = currentSub ? getPlanTheme(currentSub.plan.rank) : getPlanTheme('TRIAL');
  const usage = subData?.usage;
  const filteredPlans = plans.filter(p => p.billingCycle === billingCycle && p.rank !== 'TRIAL');

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="mb-10 transition-all duration-500 ease-in-out">
          <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-4 font-medium tracking-wide uppercase">
            <button onClick={() => router.back()} className="hover:bg-surface-container p-1 rounded-full transition-colors mr-1 group flex items-center justify-center cursor-pointer" aria-label="Go back">
              <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
            </button>
            <span>Settings</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-primary">Subscription & Billing</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-black text-on-surface mb-4 tracking-tight">Subscription & Billing</h1>
              <p className="text-on-surface-variant text-lg leading-relaxed">
                Manage your plan, limits, and billing history with ease.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-xl flex items-start gap-3">
            <span className="material-symbols-outlined shrink-0 mt-0.5">error</span>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Current Plan Card */}
        {currentSub && (
          <div className={`glass-panel p-8 md:p-10 rounded-[2.5rem] border ${currentTheme.border} relative overflow-hidden transition-all duration-700 hover:shadow-2xl`}>
            <div className={`absolute top-0 right-0 w-96 h-96 ${currentTheme.glow} rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none transition-all duration-1000`}></div>
            <div className={`absolute bottom-0 left-0 w-64 h-64 ${currentTheme.glow} rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none transition-all duration-1000 opacity-50`}></div>
            
            <div className="flex flex-col lg:flex-row justify-between gap-10 relative z-10">
              <div className="space-y-6 flex-1">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full shadow-sm ${currentTheme.badge}`}>
                    CURRENT PLAN
                  </span>
                  <span className={`text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full border shadow-sm backdrop-blur-sm ${
                    currentSub.status === 'ACTIVE' || currentSub.status === 'TRIAL' 
                      ? 'bg-success/10 border-success/30 text-success shadow-success/10' 
                      : 'bg-error/10 border-error/30 text-error shadow-error/10'
                  }`}>
                    {currentSub.status}
                  </span>
                </div>
                
                <div>
                  <h2 className={`text-4xl md:text-5xl font-black tracking-tight ${currentTheme.textGradient} pb-1`}>{currentSub.plan.name}</h2>
                  <p className="text-on-surface-variant max-w-lg leading-relaxed mt-4 text-base md:text-lg">
                    Your current subscription cycle ends on <span className={`font-semibold ${currentTheme.text}`}>{new Date(currentSub.expiryDate).toLocaleDateString()}</span>.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                  <button onClick={() => window.scrollTo({ top: 800, behavior: 'smooth'})} className={`px-8 py-3 rounded-xl font-bold transition-all duration-300 w-full sm:w-auto text-center ${currentTheme.button}`}>
                    Upgrade Plan
                  </button>
                  {currentSub.status !== 'CANCELLED' && (
                    <button onClick={handleCancel} className="px-6 py-3 bg-surface-container/50 backdrop-blur-md text-on-surface rounded-xl font-bold border border-outline-variant/30 hover:bg-error/10 hover:text-error hover:border-error/40 hover:shadow-[0_0_15px_rgba(239,68,68,0.15)] transition-all duration-300 w-full sm:w-auto text-center">
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* Usage Stats */}
              {usage && (
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Invoices', current: usage.invoices.used, max: usage.invoices.limit, icon: 'receipt_long' },
                    { label: 'Quotations', current: usage.quotations.used, max: usage.quotations.limit, icon: 'request_quote' },
                    { label: 'Branches', current: usage.branches.used, max: usage.branches.limit, icon: 'storefront' },
                    { label: 'Users', current: usage.staff.used, max: usage.staff.limit, icon: 'group' },
                  ].map((stat, i) => {
                    const progress = stat.max === 0 ? 5 : Math.min(100, (stat.current / stat.max) * 100);
                    const isNearLimit = stat.max !== 0 && (stat.current / stat.max) > 0.8;
                    
                    return (
                    <div key={i} className={`bg-surface-container-low/50 backdrop-blur-sm p-5 rounded-2xl border border-outline-variant/20 transition-all duration-500 hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 group`}>
                      <div className="flex justify-between items-center mb-3">
                        <div className={`p-2 rounded-xl bg-surface-container group-hover:${currentTheme.bg} transition-colors duration-500`}>
                          <span className={`material-symbols-outlined text-on-surface-variant group-hover:${currentTheme.text} transition-colors duration-500`}>{stat.icon}</span>
                        </div>
                        <span className="text-sm font-bold text-on-surface-variant bg-surface-container px-2 py-1 rounded-lg">
                          {stat.current} / {stat.max === 0 ? '∞' : stat.max}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-on-surface mb-2">{stat.label}</p>
                      <div className="w-full bg-outline-variant/20 rounded-full h-2 overflow-hidden shadow-inner">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${isNearLimit ? 'bg-error' : currentTheme.progress}`} 
                          style={{ width: `${progress}%` }}
                        >
                          <div className="absolute top-0 left-0 bottom-0 w-full bg-white/20"></div>
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upgrade / Pricing Section */}
        <div className="pt-8 md:pt-12 transition-all duration-500 ease-in-out">
          <div className="text-center mb-10 md:mb-12">
            <h3 className="text-2xl md:text-3xl font-extrabold text-on-surface inline-block relative">
              Available Plans
              <div className="absolute -bottom-2 left-1/4 right-1/4 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full opacity-50"></div>
            </h3>
            <p className="text-on-surface-variant mt-4 text-sm md:text-base max-w-xl mx-auto px-4">Select the plan that fits your business needs and start growing with us.</p>
            
            {/* Billing Toggle */}
            <div className="flex w-full max-w-xs sm:max-w-md mx-auto bg-surface-container-low/80 backdrop-blur-md p-1.5 rounded-full border border-outline-variant/30 mt-6 md:mt-8 relative shadow-inner">
              <div 
                className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-primary rounded-full transition-all duration-500 ease-in-out shadow-lg shadow-primary/30"
                style={{ left: billingCycle === 'MONTHLY' ? '6px' : 'calc(50% + 0px)' }}
              ></div>
              <button 
                onClick={() => setBillingCycle('MONTHLY')}
                className={`flex-1 relative z-10 py-2.5 sm:py-3 text-xs sm:text-sm font-bold rounded-full transition-colors text-center ${billingCycle === 'MONTHLY' ? 'text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Monthly Billing
              </button>
              <button 
                onClick={() => setBillingCycle('YEARLY')}
                className={`flex-1 relative z-10 py-2.5 sm:py-3 text-xs sm:text-sm font-bold rounded-full transition-colors flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 ${billingCycle === 'YEARLY' ? 'text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                <span>Yearly Billing</span>
                <span className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-extrabold whitespace-nowrap transition-colors ${billingCycle === 'YEARLY' ? 'bg-white/20 text-white' : 'bg-success/20 text-success'}`}>SAVE 20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {filteredPlans.map((plan, index) => {
              const isCurrent = currentSub?.plan?.id === plan.id;
              const theme = getPlanTheme(plan.rank);
              
              return (
                <div 
                  key={plan.id} 
                  className={`relative flex flex-col glass-panel p-6 md:p-8 rounded-[2rem] border transition-all duration-500 bg-surface-container-lowest/50 backdrop-blur-xl
                    ${isCurrent ? `border-primary/50 shadow-[0_0_30px_rgba(var(--color-primary),0.15)] scale-[1.02]` 
                    : plan.isRecommended ? `${theme.border} shadow-[0_0_30px_rgba(0,0,0,0.05)] scale-100 lg:scale-105 z-10` 
                    : `border-outline-variant/30 ${theme.hover} shadow-sm`}
                  `}
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 ${theme.glow} rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none`}></div>
                  
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-xs font-bold px-6 py-1.5 rounded-full shadow-lg border border-primary-fixed/50 z-20 whitespace-nowrap">
                      YOUR CURRENT PLAN
                    </div>
                  )}
                  {!isCurrent && plan.isRecommended && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${theme.badge} text-xs font-bold px-6 py-1.5 rounded-full shadow-lg z-20 whitespace-nowrap animate-pulse`}>
                      HIGHLY RECOMMENDED
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <h4 className={`text-2xl font-black mb-2 ${theme.textGradient}`}>{plan.name}</h4>
                    <p className="text-on-surface-variant text-sm h-auto lg:h-12 leading-relaxed">{plan.description}</p>
                  </div>
                  
                  <div className="mb-8 flex items-baseline gap-1 relative">
                    <span className="text-4xl lg:text-5xl font-extrabold text-on-surface tracking-tight">₹{plan.price.toLocaleString()}</span>
                    <span className="text-on-surface-variant text-sm lg:text-base font-semibold">/{plan.billingCycle === 'MONTHLY' ? 'mo' : 'yr'}</span>
                  </div>
                  
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-outline-variant/50 to-transparent mb-8"></div>
                  
                  <ul className="space-y-4 mb-10 flex-1">
                    {[
                      { text: `${plan.branchLimit === 0 ? 'Unlimited' : plan.branchLimit} Branches`, included: true },
                      { text: `${plan.staffLimit === 0 ? 'Unlimited' : plan.staffLimit} Staff Users`, included: true },
                      { text: `${plan.customerLimit === 0 ? 'Unlimited' : plan.customerLimit} Customers`, included: true },
                      { text: `${plan.productLimit === 0 ? 'Unlimited' : plan.productLimit} Products`, included: true },
                      { text: `${plan.invoiceLimit === 0 ? 'Unlimited' : plan.invoiceLimit} Invoices/mo`, included: true },
                      { text: `${plan.quotationLimit === 0 ? 'Unlimited' : plan.quotationLimit} Quotations/mo`, included: true },
                      { text: 'Custom Invoice Themes', included: plan.customInvoiceThemes },
                      { text: 'Custom Quotation Themes', included: plan.customQuotationThemes },
                      { text: 'WhatsApp Integration', included: plan.whatsappIntegration },
                    ].map((feature, i) => (
                      <li key={i} className={`flex items-start gap-3 text-sm transition-all duration-300 group ${feature.included ? 'text-on-surface' : 'text-on-surface-variant/50'}`}>
                        <span className={`material-symbols-outlined text-[20px] shrink-0 transition-transform duration-300 group-hover:scale-110 ${feature.included ? theme.icon : 'text-on-surface-variant/30'}`}>
                          {feature.included ? 'check_circle' : 'cancel'}
                        </span>
                        <span className="font-medium">{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button 
                    disabled={isCurrent || processingId === plan.id}
                    onClick={() => handlePurchase(plan)}
                    className={`w-full py-4 rounded-xl font-bold transition-all duration-300 flex justify-center items-center gap-2 relative overflow-hidden group ${
                      isCurrent 
                        ? 'bg-surface-container text-on-surface-variant cursor-not-allowed border border-outline-variant/30'
                        : theme.button
                    }`}
                  >
                    {!isCurrent && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>}
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {processingId === plan.id ? (
                        <>
                          <div className="size-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </>
                      ) : isCurrent ? (
                        'Current Plan'
                      ) : (
                        'Upgrade Now'
                      )}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

