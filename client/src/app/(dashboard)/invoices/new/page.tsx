'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch, API_BASE } from '@/lib/auth';

const getImageUrl = (url?: string) => {
  if (!url || url === 'null' || url === 'undefined') return '';
  if (url.startsWith('/uploads')) {
    const baseUrl = API_BASE.replace('/api/v1', '');
    return `${baseUrl}${url}`;
  }
  if (url.startsWith('uploads/')) {
    const baseUrl = API_BASE.replace('/api/v1', '');
    return `${baseUrl}/${url}`;
  }
  return url;
};
import { useBranch } from '@/components/BranchProvider';

export default function CreateInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const copyFromQuotationId = searchParams.get('copyFromQuotation');
  const { selectedBranchId, branches } = useBranch();

  // 1. Core State
  const [formData, setFormData] = useState({
    customerId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default +2 months
    shippingSameAsBilling: true,
    discountConfiguration: { mode: 'FIXED', type: 'PERCENTAGE', value: 0 },
    taxConfiguration: { mode: 'FIXED', customTaxActive: false, label: '', value: 0 },
    paymentConfiguration: { addPayment: false, amount: 0, method: 'CASH', date: new Date().toISOString().split('T')[0], note: '' },
    notes: '',
    termsAndConditions: '1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged if payment is delayed.',
    linkedQuotationId: '',
  });

  // Quotation Conversion State
  const [quotationSearch, setQuotationSearch] = useState('');
  const [quotationResults, setQuotationResults] = useState<any[]>([]);
  const [showQuotationDropdown, setShowQuotationDropdown] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);

  // Customer State
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState<any>(null);

  // Address State
  const [billingAddress, setBillingAddress] = useState({ address: '', city: '', state: '', pincode: '' });
  const [shippingAddress, setShippingAddress] = useState({ address: '', city: '', state: '', pincode: '' });

  // Items State
  const [items, setItems] = useState([
    { id: Math.random().toString(), productId: '', name: '', description: '', price: 0, originalPrice: 0, originalDescription: '', quantity: 1, discount: { type: 'PERCENTAGE', value: 0 }, tax: 0, image: '', sku: '', hsnCode: '' }
  ]);
  const [productSearchRows, setProductSearchRows] = useState<{ [key: string]: { query: string, results: any[], show: boolean } }>({});

  // Attachments State
  const [attachments, setAttachments] = useState<File[]>([]);
  const [paymentAttachment, setPaymentAttachment] = useState<File | null>(null);

  // Branch Settings
  const [branchTaxConfig, setBranchTaxConfig] = useState({ label: 'GST', tax: 0 });

  // Preview & Processing State
  const [calculatedTotals, setCalculatedTotals] = useState({ subtotal: 0, discountAmount: 0, taxAmount: 0, grandTotal: 0 });
  const [calculatedItems, setCalculatedItems] = useState<any[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const toggleDropdown = (name: string) => {
    setActiveDropdown(prev => prev === name ? null : name);
  };
  
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);

  // Setup branch defaults
  useEffect(() => {
    if (selectedBranchId) {
      const branch: any = branches.find(b => b.id === selectedBranchId);
      if (branch?.taxLabel) setBranchTaxConfig({ label: branch.taxLabel, tax: branch.tax || 0 });
    }
  }, [selectedBranchId, branches]);

  // Fetch default invoice settings for terms
  useEffect(() => {
    if (!selectedBranchId || copyFromQuotationId) return;
    
    const fetchDefaultSettings = async () => {
      try {
        const res = await apiFetch(`/document-settings/${selectedBranchId}?type=INVOICE`);
        const data = await res.json();
        if (data && data.settings && data.settings.terms) {
          setFormData(prev => ({
            ...prev,
            termsAndConditions: data.settings.terms
          }));
        }
      } catch (e) {
        // Ignore errors
      }
    };
    fetchDefaultSettings();
  }, [selectedBranchId, copyFromQuotationId]);

  useEffect(() => {
    if (selectedBranchId && branchTaxConfig.tax > 0) {
      setFormData(prev => ({
        ...prev,
        taxConfiguration: { ...prev.taxConfiguration, label: branchTaxConfig.label, value: branchTaxConfig.tax }
      }));
    }
  }, [branchTaxConfig]);

  // Preview API Trigger
  useEffect(() => {
    if (!selectedBranchId) return;
    const handler = setTimeout(() => { fetchPreview(); }, 500);
    return () => clearTimeout(handler);
  }, [formData, items, selectedBranchId, branchTaxConfig]);

  const fetchPreview = async () => {
    try {
      setIsCalculating(true);

      // Calculate effective tax value if global is used
      let effectiveTaxConfig = { 
        mode: formData.taxConfiguration.mode,
        label: formData.taxConfiguration.customTaxActive ? formData.taxConfiguration.label : branchTaxConfig.label,
        value: formData.taxConfiguration.customTaxActive ? formData.taxConfiguration.value : branchTaxConfig.tax
      };

      const payload = {
        branchId: selectedBranchId,
        customerId: formData.customerId || 'preview-customer-id',
        invoiceDate: new Date(formData.invoiceDate).toISOString(),
        billingAddress: billingAddress,
        shippingAddress: formData.shippingSameAsBilling ? billingAddress : shippingAddress,
        shippingSameAsBilling: formData.shippingSameAsBilling,
        discountConfiguration: formData.discountConfiguration,
        taxConfiguration: effectiveTaxConfig,
        items: items.map(i => ({
          productId: i.productId || undefined, price: i.price, description: i.description || '', quantity: i.quantity, discount: i.discount, tax: i.tax
        }))
      };

      const res = await apiFetch('/invoices/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setCalculatedTotals(data.summary);
        setCalculatedItems(data.items);
      }
    } catch (err) {
      console.error('Preview Calculation failed', err);
    } finally {
      setIsCalculating(false);
    }
  };

  // Customer Lookup
  useEffect(() => {
    if (!selectedCustomerDetails || customerSearch !== selectedCustomerDetails.customerName) {
      const delayFn = setTimeout(() => {
        const fetchCust = async () => {
          const res = await apiFetch(`/invoices/customers/search?q=${customerSearch}&branchId=${selectedBranchId}`);
          if (res.ok) setCustomerResults(await res.json());
        };
        fetchCust();
      }, 300);
      return () => clearTimeout(delayFn);
    }
  }, [customerSearch, selectedBranchId]);

  // Quotation Lookup
  useEffect(() => {
    if (!selectedQuotation || quotationSearch !== selectedQuotation.quotationNumber) {
      const delayFn = setTimeout(() => {
        const fetchQuot = async () => {
          const res = await apiFetch(`/quotations?branchId=${selectedBranchId}&withoutInvoice=true`);
          if (res.ok) {
            const all = await res.json();
            const filtered = all.filter((q: any) => q.quotationNumber.toLowerCase().includes(quotationSearch.toLowerCase()) || q.customer.customerName.toLowerCase().includes(quotationSearch.toLowerCase()));
            setQuotationResults(filtered);
          }
        };
        fetchQuot();
      }, 300);
      return () => clearTimeout(delayFn);
    }
  }, [quotationSearch, selectedBranchId]);

  useEffect(() => {
    if (copyFromQuotationId && selectedBranchId) {
      handleQuotationSelect({ id: copyFromQuotationId, quotationNumber: 'Loading...' });
    }
  }, [copyFromQuotationId, selectedBranchId]);

  const handleQuotationSelect = async (quotationSummary: any) => {
    try {
      setShowQuotationDropdown(false);
      setQuotationSearch(quotationSummary.quotationNumber);
      setSelectedQuotation(quotationSummary);
      
      // Fetch full quotation details
      const res = await apiFetch(`/quotations/${quotationSummary.id}`);
      if (res.ok) {
        const fullQuotation = await res.json();
        console.log("Full quotation fetched:", fullQuotation);
        
        // Auto-populate invoice state
        setQuotationSearch(fullQuotation.quotationNumber);
        setSelectedQuotation(fullQuotation);
        setCustomerSearch(fullQuotation.customer.customerName);
        setFormData(prev => ({
          ...prev,
          customerId: fullQuotation.customer.id,
          shippingSameAsBilling: fullQuotation.shippingSameAsBilling,
          discountConfiguration: (fullQuotation.discountConfiguration && Object.keys(fullQuotation.discountConfiguration).length > 0) ? fullQuotation.discountConfiguration : prev.discountConfiguration,
          taxConfiguration: (fullQuotation.taxConfiguration && Object.keys(fullQuotation.taxConfiguration).length > 0) ? fullQuotation.taxConfiguration : prev.taxConfiguration,
          notes: fullQuotation.notes || '',
          termsAndConditions: fullQuotation.termsAndConditions?.text || (typeof fullQuotation.termsAndConditions === 'string' ? fullQuotation.termsAndConditions : ''),
          linkedQuotationId: fullQuotation.id,
        }));
        
        setSelectedCustomerDetails(fullQuotation.customer);
        setBillingAddress(fullQuotation.billingAddress?.address ? fullQuotation.billingAddress : { address: fullQuotation.customer?.address || '', city: '', state: '', pincode: '' });
        setShippingAddress(fullQuotation.shippingAddress?.address ? fullQuotation.shippingAddress : { address: '', city: '', state: '', pincode: '' });
        
        if (fullQuotation.items && fullQuotation.items.length > 0) {
          const newProductSearchRows: any = {};
          const mappedItems = fullQuotation.items.map((i: any) => {
            const id = Math.random().toString();
            const itemName = i.productSnapshot?.name || i.productSnapshot?.productName || i.description || '';
            newProductSearchRows[id] = { query: itemName, results: [], show: false };
            return {
              id,
              productId: i.productId || '',
              name: itemName,
              description: i.description || '',
              price: i.price ?? 0,
              originalPrice: i.price ?? 0,
              originalDescription: i.description || '',
              quantity: i.quantity || 1,
              discount: (i.discount && Object.keys(i.discount).length > 0) ? i.discount : { type: 'PERCENTAGE', value: 0 },
              tax: i.tax ?? 0,
              image: i.image || i.productSnapshot?.image || i.productSnapshot?.productImage || '',
              sku: i.productSnapshot?.skuNumber || '',
              hsnCode: i.productSnapshot?.hsnNumber || '',
            };
          });
          setItems(mappedItems);
          setProductSearchRows(prev => ({ ...prev, ...newProductSearchRows }));
        }
      } else {
        alert("Failed to fetch quotation details from server.");
      }
    } catch (e: any) {
      console.error("Error in handleQuotationSelect:", e);
      alert("Error selecting quotation: " + e.message);
    }
  };

  const handleCustomerSelect = (customer: any) => {
    setFormData({ ...formData, customerId: customer.id });
    setCustomerSearch(customer.customerName);
    setSelectedCustomerDetails(customer);
    setBillingAddress({ address: customer.address || '', city: '', state: '', pincode: '' });
    setShowCustomerDropdown(false);
  };

  // Product Lookup
  const handleProductSearch = async (query: string, rowId: string) => {
    setProductSearchRows(prev => ({ ...prev, [rowId]: { ...prev[rowId], query, show: true } }));
    const res = await apiFetch(`/invoices/products/search?q=${query}&branchId=${selectedBranchId}`);
    if (res.ok) {
      const results = await res.json();
      setProductSearchRows(prev => ({ ...prev, [rowId]: { ...prev[rowId], results } }));
    }
  };

  const handleProductSelect = (product: any, rowId: string) => {
    setItems(items.map(i => i.id === rowId ? {
      ...i, productId: product.id, name: product.name, description: product.description, price: product.price,
      originalPrice: product.price, originalDescription: product.description, image: product.image || '',
      sku: product.sku || '', hsnCode: product.hsnCode || ''
    } : i));
    setProductSearchRows(prev => ({ ...prev, [rowId]: { ...prev[rowId], show: false, query: product.name } }));
  };

  const updateItem = (id: string, field: string, value: any) => setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  const addItem = () => setItems([...items, { id: Math.random().toString(), productId: '', name: '', description: '', price: 0, originalPrice: 0, originalDescription: '', quantity: 1, discount: { type: 'PERCENTAGE', value: 0 }, tax: 0, image: '', sku: '', hsnCode: '' }]);
  const removeItem = (id: string) => { if (items.length > 1) setItems(items.filter(i => i.id !== id)); };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1080;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          }, 'image/jpeg', 0.7);
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    setError(''); // clear previous errors
    const allowedTypes = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    const MAX_SIZE_MB = 5;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
    
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of Array.from(e.target.files)) {
      const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
      if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/') && !isHeic) {
        errors.push(`${file.name}: Invalid format. (PDF, Excel, Word, PPT or Images only)`);
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        errors.push(`${file.name}: Exceeds ${MAX_SIZE_MB}MB.`);
        continue;
      }
      
      try {
        if (file.type.startsWith('image/') || isHeic) {
          const compressed = await compressImage(file);
          validFiles.push(compressed);
        } else {
          validFiles.push(file);
        }
      } catch (err) {
        errors.push(`${file.name}: Compression failed.`);
      }
    }

    if (errors.length > 0) {
      setError(`Attachment errors:\n• ${errors.join('\n• ')}`);
    }
    
    if (validFiles.length > 0) {
      setAttachments(prev => [...prev, ...validFiles]);
    }
    
    e.target.value = ''; // reset input
  };

  const handleSave = async () => {
    if (!formData.customerId || items.length === 0) {
      setError('Please select a customer and add at least one item.');
      return;
    }
    if (formData.paymentConfiguration.addPayment) {
      const paymentAmount = Number(Number(formData.paymentConfiguration.amount).toFixed(2));
      const grandTotal = Number(Number(calculatedTotals?.grandTotal || 0).toFixed(2));
      if (paymentAmount <= 0) {
        setError('Payment amount must be greater than 0.');
        return;
      }
      if (paymentAmount > grandTotal) {
        setError('Payment amount cannot exceed the grand total.');
        return;
      }
    }

    try {
      setIsSaving(true); setError('');

      // Resolve tax config same as preview
      const effectiveTaxConfig = {
        mode: formData.taxConfiguration.mode,
        label: formData.taxConfiguration.customTaxActive ? formData.taxConfiguration.label : branchTaxConfig.label,
        value: formData.taxConfiguration.customTaxActive ? formData.taxConfiguration.value : branchTaxConfig.tax
      };

      const payload = {
        branchId: selectedBranchId,
        customerId: formData.customerId,
        invoiceDate: new Date(formData.invoiceDate).toISOString(),
        dueDate: new Date(formData.dueDate).toISOString(),
        billingAddress,
        shippingAddress: formData.shippingSameAsBilling ? billingAddress : shippingAddress,
        shippingSameAsBilling: formData.shippingSameAsBilling,
        discountConfiguration: formData.discountConfiguration,
        taxConfiguration: effectiveTaxConfig,
        paymentConfiguration: formData.paymentConfiguration,
        linkedQuotationId: formData.linkedQuotationId || undefined,
        notes: formData.notes,
        termsAndConditions: { text: formData.termsAndConditions },
        items: items.map(i => ({ productId: i.productId || undefined, price: i.price, description: i.description, quantity: i.quantity, discount: i.discount, tax: i.tax }))
      };

      const res = await apiFetch('/invoices', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save invoice');

      // Upload Attachments
      for (const file of attachments) {
        const fileFormData = new FormData();
        fileFormData.append('file', file);
        await apiFetch(`/invoices/${data.id}/attachments`, { method: 'POST', body: fileFormData, headers: {} }); // empty headers allows fetch to set multipart boundary
      }

      // Upload Payment Attachment
      if (paymentAttachment && formData.paymentConfiguration.addPayment && data.payments && data.payments.length > 0) {
        const paymentFormData = new FormData();
        paymentFormData.append('file', paymentAttachment);
        await apiFetch(`/invoices/${data.id}/payments/${data.payments[0].id}/attachment`, { method: 'POST', body: paymentFormData, headers: {} });
      }

      router.push('/invoices');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {activeDropdown && (
        <div 
          className="fixed inset-0 z-40 cursor-default" 
          onClick={() => setActiveDropdown(null)} 
        />
      )}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 z-0 relative overflow-x-hidden selection:bg-primary/30">
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-slide-up {
          opacity: 0;
          animation: fadeSlideUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
      `}} />

      {/* Premium Background */}
      <div className="fixed inset-0 z-0 bg-surface pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-tertiary/10 blur-[120px]"></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-secondary/5 blur-[100px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-12 pb-16">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="max-w-2xl">
            <button onClick={() => router.back()} className="text-on-surface-variant hover:text-primary flex items-center gap-1 text-sm font-semibold transition-colors mb-4">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back to List
            </button>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-4 shadow-[0_0_15px_rgba(125,211,252,0.15)]">
              <span className="material-symbols-outlined text-[14px]">post_add</span>
              New Invoice
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight font-display mb-4">
              <span className="bg-gradient-to-br from-primary via-secondary to-tertiary bg-clip-text text-transparent">
                Create Invoice
              </span>
            </h1>
            <p className="text-on-surface-variant text-lg leading-relaxed">
              Fill in the details below to create a new invoice for your customer.
            </p>
          </div>
          <button onClick={handleSave} disabled={isSaving || !selectedBranchId} className="group relative h-14 px-8 rounded-2xl bg-primary text-on-primary font-bold flex items-center gap-3 overflow-hidden shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto justify-center">
            <div className="absolute inset-0 w-full h-full bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
            {isSaving ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined">save</span>}
            <span>Save Invoice</span>
          </button>
        </header>

        {error && (
          <div ref={errorRef} className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 shadow-sm">
            <span className="material-symbols-outlined text-red-600 mt-0.5">error</span>
            <div className="text-sm text-red-700 font-medium whitespace-pre-line leading-relaxed">{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 relative z-10 animate-fade-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="xl:col-span-2 space-y-6">
          
          {/* Convert from Quotation Section */}
          <div className="glass-panel rounded-3xl p-6 md:p-8 shadow-sm border border-outline-variant/30 bg-primary/5 overflow-visible relative">
            <h2 className="text-lg font-bold text-on-surface mb-4 border-b border-primary/10 pb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">receipt_long</span> Convert from Quotation
            </h2>
            <div className="relative z-50">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Search Quotation Number or Customer</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[20px]">search</span>
                <input
                  type="text"
                  value={quotationSearch}
                  onChange={(e) => setQuotationSearch(e.target.value)}
                  onFocus={() => setShowQuotationDropdown(true)}
                  onBlur={() => setTimeout(() => setShowQuotationDropdown(false), 200)}
                  placeholder="Start typing quotation number..."
                  className="glass-input pl-10 pr-4 py-2.5 rounded-lg text-sm w-full font-semibold focus:border-primary/50 transition-all placeholder:font-normal"
                />
              </div>

              {/* Quotation Dropdown */}
              {showQuotationDropdown && quotationResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-surface/95 backdrop-blur-xl shadow-2xl rounded-xl border border-outline-variant/30 z-[100] max-h-60 overflow-y-auto overflow-x-hidden p-1">
                  {quotationResults.map((q) => (
                    <div key={q.id} onMouseDown={(e) => { e.preventDefault(); handleQuotationSelect(q); }} className="px-3 py-2.5 hover:bg-primary/5 rounded-lg cursor-pointer transition-all duration-200 group flex justify-between items-center border-b border-outline-variant/10 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="text-primary/70 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">{q.quotationNumber}</span>
                          <span className="text-[11px] text-on-surface-variant">
                            {q.customer.customerName}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded">₹{(q.totals?.grandTotal ?? 0).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Customer & Address Section */}
          <div className="glass-panel rounded-3xl p-6 md:p-8 shadow-sm border border-outline-variant/30 overflow-visible relative">
            <h2 className="text-lg font-bold text-on-surface mb-4 border-b border-primary/10 pb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">person</span> Customer Information
            </h2>

            <div className="mb-6 relative">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Search Customer *</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50">search</span>
                <input 
                  type="text" 
                  value={customerSearch} 
                  onChange={(e) => { setCustomerSearch(e.target.value); if (e.target.value === '') setSelectedCustomerDetails(null); }} 
                  onFocus={() => setShowCustomerDropdown(true)}
                  onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                  className="glass-input pl-10 pr-4 py-2.5 rounded-lg text-sm text-on-surface w-full focus:ring-primary/50 font-semibold" 
                  placeholder="Type to search..." 
                />
                {showCustomerDropdown && customerResults.length > 0 && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-surface/95 backdrop-blur-xl shadow-2xl rounded-xl border border-outline-variant/30 z-[100] max-h-60 overflow-y-auto overflow-x-hidden flex flex-col p-1">
                    {customerResults.map(c => (
                      <div key={c.id} onMouseDown={(e) => { e.preventDefault(); handleCustomerSelect(c); }} className="px-3 py-2.5 hover:bg-primary/5 rounded-lg cursor-pointer transition-all duration-200 group flex items-center gap-3 border-b border-outline-variant/10 last:border-0">
                        <div className="text-primary/70 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[20px]">person</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">{c.customerName}</span>
                          <span className="text-[11px] text-on-surface-variant">
                            {[c.companyName, c.email, c.mobileNumber].filter(Boolean).join(' • ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {selectedCustomerDetails && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 rounded-lg bg-surface-container/30 border border-outline-variant/20">
                <div>
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant">Email</span>
                  <div className="text-sm text-on-surface font-semibold">{selectedCustomerDetails.email || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant">Phone</span>
                  <div className="text-sm text-on-surface font-semibold">{selectedCustomerDetails.mobileNumber || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant">Company Name</span>
                  <div className="text-sm text-on-surface font-semibold">{selectedCustomerDetails.companyName || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant">{selectedCustomerDetails.businessLabel || 'Business Label'}</span>
                  <div className="text-sm text-on-surface font-semibold">{selectedCustomerDetails.businessLabelValue || 'N/A'}</div>
                </div>
                <div className="col-span-full">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant">Billing Address (Read Only)</span>
                  <div className="text-sm text-on-surface">{billingAddress.address || 'N/A'}</div>
                </div>
              </div>
            )}

            <div className="border-t border-primary/10 pt-4">
              <label className="flex items-center gap-2 cursor-pointer mb-4">
                <input type="checkbox" checked={formData.shippingSameAsBilling} onChange={(e) => setFormData({ ...formData, shippingSameAsBilling: e.target.checked })} className="rounded text-primary focus:ring-primary/50 bg-surface-container" />
                <span className="text-sm font-semibold text-on-surface">Shipping address is same as billing address</span>
              </label>

              {!formData.shippingSameAsBilling && (
                <div className="p-4 rounded-lg bg-surface-container/30 border border-outline-variant/20 space-y-3">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Manual Shipping Address</label>
                  <textarea value={shippingAddress.address} onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })} className="glass-input w-full p-3 rounded-lg text-sm text-on-surface" placeholder="Enter complete shipping address..." rows={3}></textarea>
                </div>
              )}
            </div>
          </div>

          {/* Master Configurations */}
          <div className="glass-panel rounded-3xl p-6 md:p-8 shadow-sm border border-outline-variant/30">
            <h2 className="text-lg font-bold text-on-surface mb-4 border-b border-primary/10 pb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">settings</span> Discount & Tax Rules
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
              {/* Discount Rules */}
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4">Discount Method</h3>
                <div className="flex gap-6 mb-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="discMode" checked={formData.discountConfiguration.mode === 'FIXED'} onChange={() => setFormData({ ...formData, discountConfiguration: { ...formData.discountConfiguration, mode: 'FIXED' } })} className="text-primary w-4 h-4" />
                    <span className="text-sm font-semibold text-on-surface">Fixed for all</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="discMode" checked={formData.discountConfiguration.mode === 'PER_PRODUCT'} onChange={() => setFormData({ ...formData, discountConfiguration: { ...formData.discountConfiguration, mode: 'PER_PRODUCT' } })} className="text-primary w-4 h-4" />
                    <span className="text-sm font-semibold text-on-surface">Per Product</span>
                  </label>
                </div>
                
                <div className="h-[70px]">
                  {formData.discountConfiguration.mode === 'FIXED' && (
                    <div className="flex relative">
                      <input type="number" value={formData.discountConfiguration.value} onChange={(e) => setFormData({ ...formData, discountConfiguration: { ...formData.discountConfiguration, value: parseFloat(e.target.value) || 0 } })} className="glass-input px-4 py-2.5 rounded-l-lg w-full text-sm font-semibold border-r-0 focus:ring-0 focus:border-primary/50" placeholder="Amount" />
                      <div className="relative shrink-0" style={{ zIndex: activeDropdown === 'discountType' ? 100 : 10 }}>
                        <button
                          type="button"
                          className="glass-input px-3 py-2.5 rounded-r-lg text-sm font-bold bg-surface-container/30 cursor-pointer focus:ring-0 focus:border-primary/50 flex items-center justify-between gap-1 min-w-[65px] h-[46px] text-left"
                          onClick={() => toggleDropdown('discountType')}
                        >
                          <span>{formData.discountConfiguration.type === 'PERCENTAGE' ? '%' : '₹'}</span>
                          <span className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${activeDropdown === 'discountType' ? 'rotate-180' : ''}`}>expand_more</span>
                        </button>
                        
                        {activeDropdown === 'discountType' && (
                          <div className="absolute right-0 top-full mt-1 z-[110] bg-surface-container-highest rounded-lg border border-primary/10 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150 min-w-[65px]">
                            <div 
                              onClick={() => { setFormData({ ...formData, discountConfiguration: { ...formData.discountConfiguration, type: 'PERCENTAGE' } }); setActiveDropdown(null); }} 
                              className={`px-3 py-2 text-sm cursor-pointer transition-colors text-center ${formData.discountConfiguration.type === 'PERCENTAGE' ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
                            >
                              %
                            </div>
                            <div 
                              onClick={() => { setFormData({ ...formData, discountConfiguration: { ...formData.discountConfiguration, type: 'AMOUNT' } }); setActiveDropdown(null); }} 
                              className={`px-3 py-2 text-sm cursor-pointer transition-colors text-center ${formData.discountConfiguration.type === 'AMOUNT' ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
                            >
                              ₹
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tax Rules */}
              <div className="flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Tax Method</h3>
                  {formData.taxConfiguration.mode === 'FIXED' && (
                    <label className="flex items-center gap-1.5 cursor-pointer self-start sm:self-auto">
                      <input type="checkbox" checked={formData.taxConfiguration.customTaxActive} onChange={(e) => setFormData({ ...formData, taxConfiguration: { ...formData.taxConfiguration, customTaxActive: e.target.checked } })} className="rounded text-primary w-3.5 h-3.5" />
                      <span className="text-[11px] font-bold text-on-surface-variant uppercase">Custom</span>
                    </label>
                  )}
                </div>
                <div className="flex gap-6 mb-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="taxMode" checked={formData.taxConfiguration.mode === 'FIXED'} onChange={() => setFormData({ ...formData, taxConfiguration: { ...formData.taxConfiguration, mode: 'FIXED' } })} className="text-primary w-4 h-4" />
                    <span className="text-sm font-semibold text-on-surface">Fixed for all</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="taxMode" checked={formData.taxConfiguration.mode === 'PER_PRODUCT'} onChange={() => setFormData({ ...formData, taxConfiguration: { ...formData.taxConfiguration, mode: 'PER_PRODUCT' } })} className="text-primary w-4 h-4" />
                    <span className="text-sm font-semibold text-on-surface">Per Product</span>
                  </label>
                </div>
                
                <div className="h-[70px]">
                  {formData.taxConfiguration.mode === 'FIXED' && (
                    <div className="flex flex-col gap-2 relative">
                      {formData.taxConfiguration.customTaxActive ? (
                        <div className="flex items-center gap-2">
                          <input type="text" placeholder="Custom Tax Name" value={formData.taxConfiguration.label} onChange={(e) => setFormData({ ...formData, taxConfiguration: { ...formData.taxConfiguration, label: e.target.value } })} className="glass-input px-4 py-2.5 rounded-lg w-full text-sm font-semibold focus:ring-0 focus:border-primary/50" />
                          <div className="relative w-32">
                            <input type="number" placeholder="0" value={formData.taxConfiguration.value} onChange={(e) => setFormData({ ...formData, taxConfiguration: { ...formData.taxConfiguration, value: parseFloat(e.target.value) || 0 } })} className="glass-input pl-4 pr-8 py-2.5 rounded-lg w-full text-sm font-semibold focus:ring-0 focus:border-primary/50 text-right" />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-on-surface-variant">%</span>
                          </div>
                        </div>
                      ) : (
                        <div className="glass-input px-4 py-2.5 rounded-lg w-full text-sm font-semibold bg-surface-container/30 text-on-surface flex items-center justify-between">
                          <span>{branchTaxConfig.label} ({branchTaxConfig.tax}%)</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="glass-panel rounded-3xl shadow-sm border border-outline-variant/30 overflow-hidden relative overflow-visible">
            <h2 className="text-lg font-bold text-on-surface m-6 mb-2 border-b border-primary/10 pb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">inventory_2</span> Invoice Items
            </h2>
            <div className="p-6 pt-2 flex flex-col gap-4">
              {items.map((item, index) => {
                const calcItem = calculatedItems[index];
                return (
                  <div key={item.id} className="relative group bg-surface-container/20 border border-outline-variant/10 rounded-xl p-4 md:p-5 hover:bg-surface-container/40 transition-colors shadow-sm">
                    {/* Delete Button */}
                    <button onClick={() => removeItem(item.id)} className="absolute top-2 right-2 text-error hover:bg-error/10 p-2 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all z-10" title="Remove Item">
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>

                    <div className="flex flex-col md:flex-row gap-5">
                      {/* Left: Image Box */}
                      <div className="relative group/img w-20 h-20 md:w-24 md:h-24 rounded-lg border border-outline-variant/30 bg-surface-container overflow-hidden shrink-0 shadow-sm mx-auto md:mx-0 mt-2">
                        {/* Placeholder (Always in background) */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 z-0">
                          <span className="material-symbols-outlined text-primary/40 text-3xl mb-1">inventory_2</span>
                          <span className="text-[9px] font-bold text-primary/50 uppercase tracking-widest">No Image</span>
                        </div>
                        
                        {/* Image (Renders on top if available) */}
                        {item.image && item.image !== 'null' && item.image !== 'undefined' && (
                          <img src={getImageUrl(item.image)} alt="Product" className="absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-300" onError={(e) => { e.currentTarget.style.opacity = '0'; }} />
                        )}

                        <label className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-sm z-20">
                          <span className="material-symbols-outlined text-white text-[24px]">upload</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => updateItem(item.id, 'image', reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }} />
                        </label>
                      </div>

                      {/* Right: Grid of Inputs */}
                      <div className="flex-1 flex flex-col gap-4">
                        {/* Row 1: Search, Qty, Price */}
                        <div className="grid grid-cols-12 gap-3 md:gap-4 items-start">
                          <div className="col-span-12 md:col-span-6 relative">
                            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Product Search</label>
                            <input 
                              type="text" 
                              value={productSearchRows[item.id]?.query ?? item.name} 
                              onChange={(e) => handleProductSearch(e.target.value, item.id)} 
                              onFocus={() => handleProductSearch(productSearchRows[item.id]?.query ?? item.name, item.id)}
                              onBlur={() => setTimeout(() => setProductSearchRows(prev => ({ ...prev, [item.id]: { ...prev[item.id], show: false } })), 200)}
                              className="glass-input px-3 py-2 rounded-lg text-sm w-full font-bold text-primary" 
                              placeholder="Type to search..." 
                            />
                            {productSearchRows[item.id]?.show && (productSearchRows[item.id]?.results?.length || 0) > 0 && (
                              <div className="absolute top-full left-0 w-full mt-2 bg-surface/95 backdrop-blur-xl shadow-2xl rounded-xl border border-outline-variant/30 z-[100] max-h-60 overflow-y-auto overflow-x-hidden p-1">
                                {productSearchRows[item.id].results.map(p => (
                                  <div key={p.id} onMouseDown={(e) => { e.preventDefault(); handleProductSelect(p, item.id); }} className="px-3 py-2.5 hover:bg-primary/5 rounded-lg cursor-pointer transition-all duration-200 group flex justify-between items-center border-b border-outline-variant/10 last:border-0">
                                    <div className="flex items-center gap-3">
                                      <div className="text-primary/70 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                                      </div>
                                      <div className="flex flex-col gap-0.5">
                                        <span className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">{p.name}</span>
                                        {(p.sku || p.hsnCode) && (
                                          <span className="text-[11px] text-on-surface-variant">
                                            {[p.sku && `SKU: ${p.sku}`, p.hsnCode && `HSN: ${p.hsnCode}`].filter(Boolean).join(' • ')}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded">₹{p.price}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {(item.sku || item.hsnCode) && (
                              <div className="flex gap-2 mt-2">
                                {item.sku && <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container/80 border border-outline-variant/20 px-2 py-0.5 rounded uppercase tracking-widest shadow-sm">SKU: {item.sku}</span>}
                                {item.hsnCode && <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container/80 border border-outline-variant/20 px-2 py-0.5 rounded uppercase tracking-widest shadow-sm">HSN: {item.hsnCode}</span>}
                              </div>
                            )}
                          </div>
                          <div className="col-span-4 md:col-span-2">
                            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Qty</label>
                            <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)} className="glass-input px-3 py-2 rounded-lg text-sm w-full text-center font-semibold" />
                          </div>
                          <div className="col-span-8 md:col-span-4">
                            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Unit Price (₹)</label>
                            <input type="number" step="0.01" value={item.price} onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)} className="glass-input px-3 py-2 rounded-lg text-sm w-full text-right font-bold text-on-surface" />
                            {item.productId && item.price !== item.originalPrice && (
                              <div className="text-[10px] text-on-surface-variant/50 italic mt-1 text-right line-through">₹{item.originalPrice}</div>
                            )}
                          </div>
                        </div>

                        {/* Row 2: Description, Discount, Tax, Total */}
                        <div className="grid grid-cols-12 gap-3 md:gap-4 items-end">
                          <div className={`col-span-12 ${
                            (formData.discountConfiguration.mode === 'PER_PRODUCT' && formData.taxConfiguration.mode === 'PER_PRODUCT') ? 'md:col-span-4' :
                            (formData.discountConfiguration.mode === 'PER_PRODUCT' ? 'md:col-span-6' :
                            (formData.taxConfiguration.mode === 'PER_PRODUCT' ? 'md:col-span-7' : 'md:col-span-9'))
                          }`}>
                            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Description</label>
                            <input type="text" value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} className="glass-input px-3 py-2 rounded-lg text-sm w-full text-on-surface" placeholder="Line item details..." />
                            {item.productId && item.description !== item.originalDescription && (
                              <div className="text-[10px] text-on-surface-variant/50 italic mt-1 truncate max-w-full">Orig: {item.originalDescription}</div>
                            )}
                          </div>

                          {formData.discountConfiguration.mode === 'PER_PRODUCT' && (
                            <div className="col-span-6 md:col-span-3">
                              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Discount</label>
                              <div className="flex items-center gap-1 relative">
                                <input type="number" value={item.discount?.value || 0} onChange={(e) => updateItem(item.id, 'discount', { ...item.discount, value: parseFloat(e.target.value) || 0 })} className="glass-input px-3 py-2 rounded-lg text-sm w-full font-semibold" />
                                <div className="relative shrink-0" style={{ zIndex: activeDropdown === `itemDiscountType-${item.id}` ? 100 : 10 }}>
                                  <button
                                    type="button"
                                    className="glass-input p-2 rounded-lg text-xs font-bold bg-surface-container/30 cursor-pointer flex items-center justify-between gap-1 min-w-[50px]"
                                    onClick={() => toggleDropdown(`itemDiscountType-${item.id}`)}
                                  >
                                    <span>{item.discount?.type === 'PERCENTAGE' ? '%' : '₹'}</span>
                                    <span className={`material-symbols-outlined text-[14px] transition-transform duration-200 ${activeDropdown === `itemDiscountType-${item.id}` ? 'rotate-180' : ''}`}>expand_more</span>
                                  </button>
                                  
                                  {activeDropdown === `itemDiscountType-${item.id}` && (
                                    <div className="absolute right-0 top-full mt-1 z-[110] bg-surface-container-highest rounded-lg border border-primary/10 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150 min-w-[50px]">
                                      <div 
                                        onClick={() => { updateItem(item.id, 'discount', { ...item.discount, type: 'PERCENTAGE' }); setActiveDropdown(null); }} 
                                        className={`px-3 py-2 text-xs cursor-pointer transition-colors text-center ${item.discount?.type === 'PERCENTAGE' ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
                                      >
                                        %
                                      </div>
                                      <div 
                                        onClick={() => { updateItem(item.id, 'discount', { ...item.discount, type: 'AMOUNT' }); setActiveDropdown(null); }} 
                                        className={`px-3 py-2 text-xs cursor-pointer transition-colors text-center ${item.discount?.type === 'AMOUNT' ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
                                      >
                                        ₹
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {formData.taxConfiguration.mode === 'PER_PRODUCT' && (
                            <div className="col-span-6 md:col-span-2">
                              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Tax %</label>
                              <div className="relative">
                                <input type="number" step="0.1" value={item.tax} onChange={(e) => updateItem(item.id, 'tax', parseFloat(e.target.value) || 0)} className="glass-input pl-3 pr-7 py-2 rounded-lg text-sm w-full text-center font-semibold" placeholder="0" />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant">%</span>
                              </div>
                            </div>
                          )}

                          <div className="col-span-12 md:col-span-3 text-right mt-4 md:mt-0 flex flex-col justify-end">
                            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block mb-1">Item Total (Preview)</span>
                            <div className="text-xl font-bold text-primary relative inline-block self-end">
                              {isCalculating && <span className="absolute -left-4 top-1/2 -translate-y-1/2 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span></span>}
                              ₹ {(calcItem?.total ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <button onClick={addItem} className="mt-2 text-sm font-bold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 border-dashed py-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
                <span className="material-symbols-outlined text-[20px]">add_circle</span> Add Another Item
              </button>
            </div>
          </div>

          {/* Payments Section */}
          <div className="glass-panel rounded-3xl p-6 md:p-8 shadow-sm border border-outline-variant/30">
            <h2 className="text-lg font-bold text-on-surface mb-4 border-b border-primary/10 pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">payments</span> Payments
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-semibold text-on-surface self-start sm:self-auto">
                <input 
                  type="checkbox" 
                  checked={formData.paymentConfiguration.addPayment} 
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    paymentConfiguration: { ...prev.paymentConfiguration, addPayment: e.target.checked } 
                  }))}
                  className="w-4 h-4 text-primary rounded border-outline-variant focus:ring-primary" 
                />
                Add payment during invoice creation
              </label>
            </h2>
            
            {formData.paymentConfiguration.addPayment && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Payment Amount</label>
                  <input 
                    type="number" 
                    min="0"
                    max={Number(calculatedTotals.grandTotal.toFixed(2))}
                    value={formData.paymentConfiguration.amount} 
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      paymentConfiguration: { ...prev.paymentConfiguration, amount: parseFloat(e.target.value) || 0 } 
                    }))} 
                    className="glass-input px-4 py-2.5 rounded-lg text-sm text-on-surface w-full font-semibold" 
                  />
                  <p className="text-[10px] text-on-surface-variant mt-1">Max: ₹{calculatedTotals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Payment Method</label>
                  <div className="relative w-full" style={{ zIndex: activeDropdown === 'paymentMethod' ? 100 : 10 }}>
                    <button
                      type="button"
                      className="glass-input px-4 py-2.5 rounded-lg text-sm text-on-surface w-full font-semibold text-left flex items-center justify-between cursor-pointer"
                      onClick={() => toggleDropdown('paymentMethod')}
                    >
                      <span>
                        {formData.paymentConfiguration.method === 'CASH' ? 'Cash' :
                         formData.paymentConfiguration.method === 'UPI' ? 'UPI' :
                         formData.paymentConfiguration.method === 'BANK_TRANSFER' ? 'Bank Transfer' :
                         formData.paymentConfiguration.method === 'CHEQUE' ? 'Cheque' : 'Select Method'}
                      </span>
                      <span className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${activeDropdown === 'paymentMethod' ? 'rotate-180' : ''}`}>expand_more</span>
                    </button>
                    
                    {activeDropdown === 'paymentMethod' && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-[110] bg-surface-container-highest rounded-lg border border-primary/10 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150">
                        {[
                          { value: 'CASH', label: 'Cash' },
                          { value: 'UPI', label: 'UPI' },
                          { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
                          { value: 'CHEQUE', label: 'Cheque' }
                        ].map(method => (
                          <div 
                            key={method.value}
                            onClick={() => { 
                              setFormData(prev => ({ 
                                ...prev, 
                                paymentConfiguration: { ...prev.paymentConfiguration, method: method.value as any } 
                              }));
                              setActiveDropdown(null); 
                            }} 
                            className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${formData.paymentConfiguration.method === method.value ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface hover:bg-primary/10'}`}
                          >
                            {method.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Payment Date</label>
                  <input 
                    type="date" 
                    value={formData.paymentConfiguration.date} 
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      paymentConfiguration: { ...prev.paymentConfiguration, date: e.target.value } 
                    }))} 
                    className="glass-input px-4 py-2.5 rounded-lg text-sm text-on-surface w-full font-semibold" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Payment Note</label>
                  <input 
                    type="text" 
                    placeholder="Transaction ID / Ref Number"
                    value={formData.paymentConfiguration.note} 
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      paymentConfiguration: { ...prev.paymentConfiguration, note: e.target.value } 
                    }))} 
                    className="glass-input px-4 py-2.5 rounded-lg text-sm text-on-surface w-full font-semibold" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Attachment (Optional)</label>
                  {paymentAttachment ? (
                    <div className="relative glass-input px-4 py-2 rounded-lg text-sm text-on-surface w-full font-semibold flex items-center justify-between overflow-hidden group h-[42px] bg-primary/5 border border-primary/20">
                      <span className="truncate max-w-[80%] text-primary flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        {paymentAttachment.name}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          setPaymentAttachment(null);
                        }}
                        className="material-symbols-outlined text-error/70 hover:text-error transition-colors text-[20px] cursor-pointer"
                        title="Remove attachment"
                      >
                        close
                      </button>
                    </div>
                  ) : (
                    <div className="relative glass-input px-4 py-2 rounded-lg text-sm text-on-surface w-full font-semibold flex items-center justify-between overflow-hidden group cursor-pointer h-[42px]">
                      <span className="truncate max-w-[80%] text-on-surface-variant group-hover:text-primary transition-colors">
                        Select PDF or Image...
                      </span>
                      <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-[20px]">
                        attach_file
                      </span>
                      <input 
                        type="file" 
                        accept=".pdf,image/jpeg,image/png,image/gif,image/webp,.heic,.heif"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                          const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
                          if (!allowedTypes.includes(file.type) && !isHeic && !file.type.startsWith('image/')) {
                            setError('Payment attachment must be a PDF or an Image.');
                            e.target.value = '';
                            return;
                          }
                          
                          if (file.size > 5 * 1024 * 1024) {
                            setError('Payment attachment must be less than 5MB.');
                            e.target.value = '';
                            return;
                          }

                          setError('');
                          if (isHeic || file.type.startsWith('image/')) {
                            try {
                              const compressed = await compressImage(file);
                              setPaymentAttachment(compressed);
                            } catch (err) {
                              setPaymentAttachment(file); // fallback
                            }
                          } else {
                            setPaymentAttachment(file);
                          }
                        }} 
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Terms and Conditions */}
          <div className="glass-panel rounded-3xl p-6 md:p-8 shadow-sm border border-outline-variant/30">
            <h2 className="text-lg font-bold text-on-surface mb-4 border-b border-primary/10 pb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">description</span> Terms & Conditions
            </h2>
            <textarea value={formData.termsAndConditions} onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })} className="glass-input w-full p-4 rounded-xl text-sm text-on-surface font-medium leading-relaxed" rows={4} placeholder="Enter invoice-specific terms here..."></textarea>
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Summary */}
          <div className="glass-panel rounded-3xl p-6 md:p-8 shadow-sm border border-outline-variant/30">
            <h3 className="text-sm font-bold text-on-surface mb-4 uppercase tracking-wide">Invoice Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center text-on-surface-variant">
                <span>Subtotal</span>
                <span className="font-semibold text-on-surface">₹ {calculatedTotals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-on-surface-variant">
                <span>Total Discount</span>
                <span className="font-semibold text-error">- ₹ {calculatedTotals.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-on-surface-variant">
                <span>Total Tax</span>
                <span className="font-semibold text-on-surface">₹ {calculatedTotals.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="pt-4 mt-2 border-t border-primary/10 flex justify-between items-center">
                <span className="font-bold text-on-surface text-base">Grand Total</span>
                <div className="flex items-center gap-2">
                  {isCalculating && <span className="material-symbols-outlined animate-spin text-primary text-[16px]">refresh</span>}
                  <span className="font-bold text-primary text-xl tracking-tight">₹ {calculatedTotals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="glass-panel rounded-3xl p-6 md:p-8 shadow-sm border border-outline-variant/30">
            <h3 className="text-sm font-bold text-on-surface mb-4 uppercase tracking-wide">Timeline</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Invoice Date</label>
                <input type="date" value={formData.invoiceDate} onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })} className="glass-input px-4 py-2.5 rounded-lg text-sm text-on-surface w-full font-semibold" />
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Due Date</label>
                <input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className="glass-input px-4 py-2.5 rounded-lg text-sm text-error w-full font-semibold" />
              </div>
            </div>
          </div>

          {/* Attachments Dropzone */}
          <div className="glass-panel rounded-3xl p-6 md:p-8 shadow-sm border border-outline-variant/30">
            <h3 className="text-sm font-bold text-on-surface mb-4 uppercase tracking-wide">Attachments</h3>
            <div className="border-2 border-dashed border-primary/30 rounded-xl p-6 text-center hover:bg-primary/5 transition-colors relative group cursor-pointer">
              <input type="file" multiple accept=".pdf,.xlsx,.docx,.png,.jpg,.jpeg,.ppt,.pptx,.heic,.heif" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <span className="material-symbols-outlined text-primary text-[32px] mb-2 group-hover:scale-110 transition-transform">cloud_upload</span>
              <p className="text-sm font-bold text-on-surface">Click or drag files to attach</p>
              <p className="text-xs text-on-surface-variant mt-1">PDF, Excel, Word, PPT, Images</p>
            </div>

            {attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                {attachments.map((file, i) => (
                  <div key={i} className="flex justify-between items-center p-2 rounded-md bg-surface-container/50 border border-outline-variant/10">
                    <span className="text-xs text-on-surface font-semibold truncate max-w-[200px]">{file.name}</span>
                    <button onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))} className="text-on-surface-variant hover:text-error">
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Decoration */}
      <footer className="relative z-10 w-full opacity-40 text-center flex items-center justify-center gap-4 mt-12 mb-4">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-on-surface-variant to-transparent"></div>
        <p className="text-xs font-bold tracking-[0.2em] text-on-surface-variant uppercase">
          BillTea • New Invoice
        </p>
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-on-surface-variant to-transparent"></div>
      </footer>
      </div>
    </div>
    </>
  );
}
