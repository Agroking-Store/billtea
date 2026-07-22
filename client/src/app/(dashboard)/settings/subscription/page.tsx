'use client';

import React, { useState, useEffect } from 'react';
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

export default function SubscriptionPage() {
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
  const usage = subData?.usage;
  const filteredPlans = plans.filter(p => p.billingCycle === billingCycle && p.rank !== 'TRIAL');

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-fixed">Subscription & Billing</h1>
            <p className="text-on-surface-variant mt-2 text-sm">Manage your plan, limits, and billing history.</p>
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
          <div className="glass-panel p-8 rounded-3xl border border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row justify-between gap-8 relative z-10">
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold tracking-widest text-primary uppercase px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                    CURRENT PLAN
                  </span>
                  <span className={`text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full border ${
                    currentSub.status === 'ACTIVE' || currentSub.status === 'TRIAL' 
                      ? 'bg-success/10 border-success/30 text-success' 
                      : 'bg-error/10 border-error/30 text-error'
                  }`}>
                    {currentSub.status}
                  </span>
                </div>
                
                <h2 className="text-4xl font-extrabold text-on-surface tracking-tight">{currentSub.plan.name}</h2>
                <p className="text-on-surface-variant max-w-lg leading-relaxed">
                  Your current subscription cycle ends on <span className="font-semibold text-on-surface">{new Date(currentSub.expiryDate).toLocaleDateString()}</span>.
                </p>
                
                <div className="flex gap-4 pt-2">
                  <button onClick={() => window.scrollTo({ top: 800, behavior: 'smooth'})} className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300">
                    Upgrade Plan
                  </button>
                  {currentSub.status !== 'CANCELLED' && (
                    <button onClick={handleCancel} className="px-5 py-2.5 bg-surface-container text-on-surface rounded-xl font-semibold border border-outline-variant/30 hover:bg-error/10 hover:text-error hover:border-error/30 transition-all duration-300">
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* Usage Stats */}
              {usage && (
                <div className="flex-1 grid grid-cols-2 gap-4">
                  {[
                    { label: 'Invoices', current: usage.invoices.used, max: usage.invoices.limit, icon: 'receipt_long' },
                    { label: 'Quotations', current: usage.quotations.used, max: usage.quotations.limit, icon: 'request_quote' },
                    { label: 'Branches', current: usage.branches.used, max: usage.branches.limit, icon: 'storefront' },
                    { label: 'Users', current: usage.staff.used, max: usage.staff.limit, icon: 'group' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 hover:border-primary/30 transition-colors">
                      <div className="flex justify-between items-center mb-2">
                        <span className="material-symbols-outlined text-on-surface-variant text-xl">{stat.icon}</span>
                        <span className="text-xs font-medium text-on-surface-variant">
                          {stat.current} / {stat.max === 0 ? '∞' : stat.max}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-on-surface mb-1">{stat.label}</p>
                      <div className="w-full bg-outline-variant/30 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${stat.max !== 0 && (stat.current / stat.max) > 0.8 ? 'bg-error' : 'bg-primary'}`} 
                          style={{ width: stat.max === 0 ? '5%' : `${Math.min(100, (stat.current / stat.max) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upgrade / Pricing Section */}
        <div className="pt-10">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold text-on-surface">Available Plans</h3>
            <p className="text-on-surface-variant mt-2 text-sm">Choose the perfect plan for your business needs.</p>
            
            {/* Billing Toggle */}
            <div className="flex w-full max-w-xs sm:max-w-md mx-auto bg-surface-container-low p-1 rounded-full border border-outline-variant/30 mt-6 relative">
              <div 
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-primary rounded-full transition-all duration-300 shadow-md shadow-primary/20"
                style={{ left: billingCycle === 'MONTHLY' ? '4px' : 'calc(50% + 0px)' }}
              ></div>
              <button 
                onClick={() => setBillingCycle('MONTHLY')}
                className={`flex-1 relative z-10 py-2.5 text-sm font-semibold rounded-full transition-colors text-center ${billingCycle === 'MONTHLY' ? 'text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setBillingCycle('YEARLY')}
                className={`flex-1 relative z-10 py-2.5 text-sm font-semibold rounded-full transition-colors flex items-center justify-center gap-1 sm:gap-2 ${billingCycle === 'YEARLY' ? 'text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                <span>Yearly</span>
                <span className="text-[9px] sm:text-[10px] bg-success/20 text-success px-1.5 sm:px-2 py-0.5 rounded-full font-bold whitespace-nowrap">SAVE 20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {filteredPlans.map((plan) => {
              const isCurrent = currentSub?.plan?.id === plan.id;
              
              return (
                <div key={plan.id} className={`relative flex flex-col glass-panel p-8 rounded-3xl border transition-all duration-500 hover:-translate-y-2 ${isCurrent ? 'border-primary/50 shadow-[0_0_30px_rgba(125,211,252,0.15)] scale-[1.02]' : plan.isRecommended ? 'border-primary/40 shadow-[0_0_20px_rgba(125,211,252,0.1)]' : 'border-outline-variant/30 hover:border-primary/30 hover:shadow-xl'}`}>
                  {isCurrent && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-on-primary text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                      CURRENT PLAN
                    </div>
                  )}
                  {!isCurrent && plan.isRecommended && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-primary to-tertiary text-on-primary text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                      RECOMMENDED
                    </div>
                  )}
                  
                  <div className="mb-8">
                    <h4 className="text-xl font-bold text-on-surface mb-2">{plan.name}</h4>
                    <p className="text-on-surface-variant text-sm h-10">{plan.description}</p>
                  </div>
                  
                  <div className="mb-8 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-on-surface">₹{plan.price.toLocaleString()}</span>
                    <span className="text-on-surface-variant text-sm font-medium">/{plan.billingCycle === 'MONTHLY' ? 'mo' : 'yr'}</span>
                  </div>
                  
                  <ul className="space-y-4 mb-8 flex-1">
                    {[
                      { text: `${plan.branchLimit === 0 ? 'Unlimited' : plan.branchLimit} Branches` },
                      { text: `${plan.staffLimit === 0 ? 'Unlimited' : plan.staffLimit} Staff Users` },
                      { text: `${plan.customerLimit === 0 ? 'Unlimited' : plan.customerLimit} Customers` },
                      { text: `${plan.productLimit === 0 ? 'Unlimited' : plan.productLimit} Products` },
                      { text: `${plan.invoiceLimit === 0 ? 'Unlimited' : plan.invoiceLimit} Invoices/mo` },
                      { text: `${plan.quotationLimit === 0 ? 'Unlimited' : plan.quotationLimit} Quotations/mo` },
                    ].map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-primary text-[18px] shrink-0">check_circle</span>
                        <span>{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button 
                    disabled={isCurrent || processingId === plan.id}
                    onClick={() => handlePurchase(plan)}
                    className={`w-full py-3 rounded-xl font-bold transition-all duration-300 flex justify-center items-center gap-2 ${
                      isCurrent 
                        ? 'bg-surface-container text-on-surface-variant cursor-not-allowed'
                        : 'bg-primary text-on-primary shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1'
                    }`}
                  >
                    {processingId === plan.id ? (
                      <div className="size-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                    ) : isCurrent ? (
                      'Current Plan'
                    ) : (
                      'Upgrade Now'
                    )}
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
