'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiFetch, API_BASE } from '@/lib/auth';
import { useBranch } from '@/components/BranchProvider';
import CustomerModal from '@/components/CustomerModal';
import imageCompression from 'browser-image-compression';

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

export default function EditQuotationPage() {
  const router = useRouter();
  const params = useParams();
  const quotationId = params.id as string;
  const { selectedBranchId, branches } = useBranch();

  // Loading State for fetching existing quotation
  const [isLoading, setIsLoading] = useState(true);
  const [quotationNumber, setQuotationNumber] = useState('');

  // 1. Core State
  const [formData, setFormData] = useState({
    customerId: '',
    quotationDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    shippingSameAsBilling: true,
    discountConfiguration: { mode: 'FIXED', type: 'PERCENTAGE', value: 0 },
    taxConfiguration: { mode: 'FIXED', customTaxActive: false, label: '', value: 0 },
    notes: '',
    followUpDate: '',
    termsAndConditions: '1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged if payment is delayed.',
  });

  // Customer State
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState<any>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

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
  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);

  const [branchTaxConfig, setBranchTaxConfig] = useState({ label: 'GST', tax: 0 });
  const [branchTaxes, setBranchTaxes] = useState<any[]>([]);



  // Preview & Processing State
  const [calculatedTotals, setCalculatedTotals] = useState({ subtotal: 0, discountAmount: 0, taxAmount: 0, grandTotal: 0 });
  const [calculatedItems, setCalculatedItems] = useState<any[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);

  // Track if initial data has been loaded (to avoid overwriting with branch defaults)
  const initialLoadDone = useRef(false);

  // Fetch existing quotation data on mount
  useEffect(() => {
    if (quotationId) {
      fetchQuotation();
    }
  }, [quotationId]);

  const fetchQuotation = async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch(`/quotations/${quotationId}`);
      if (!res.ok) throw new Error('Failed to fetch quotation');
      const data = await res.json();

      // Set quotation number for display
      setQuotationNumber(data.quotationNumber);

      // Map API response back to form state
      setFormData({
        customerId: data.customer?.id || '',
        quotationDate: data.quotationDate ? new Date(data.quotationDate).toISOString().split('T')[0] : '',
        expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString().split('T')[0] : '',
        shippingSameAsBilling: data.shippingSameAsBilling ?? true,
        discountConfiguration: {
          mode: data.discountConfiguration?.mode || 'FIXED',
          type: data.discountConfiguration?.type || 'PERCENTAGE',
          value: data.discountConfiguration?.value || 0,
        },
        taxConfiguration: {
          mode: data.taxConfiguration?.mode || 'FIXED',
          customTaxActive: data.taxConfiguration?.customTaxActive || false,
          label: data.taxConfiguration?.label || '',
          value: data.taxConfiguration?.value || 0,
        },
        notes: data.notes || '',
        followUpDate: data.followUpDate ? data.followUpDate.split('T')[0] : '',
        termsAndConditions: typeof data.termsAndConditions === 'object'
          ? (data.termsAndConditions?.text || data.termsAndConditions?.editedSnapshot || data.termsAndConditions?.defaultSnapshot || '')
          : (data.termsAndConditions || ''),
      });

      // Set customer
      if (data.customer) {
        setCustomerSearch(data.customer.customerName || '');
        setSelectedCustomerDetails(data.customer);
      }

      // Set addresses
      if (data.billingAddress) {
        setBillingAddress({
          address: data.billingAddress.address || '',
          city: data.billingAddress.city || '',
          state: data.billingAddress.state || '',
          pincode: data.billingAddress.pincode || '',
        });
      }
      if (data.shippingAddress && !data.shippingSameAsBilling) {
        setShippingAddress({
          address: data.shippingAddress.address || '',
          city: data.shippingAddress.city || '',
          state: data.shippingAddress.state || '',
          pincode: data.shippingAddress.pincode || '',
        });
      }

      // Set items
      if (data.items && data.items.length > 0) {
        const mappedItems = data.items.map((item: any) => ({
          id: item.id || Math.random().toString(),
          productId: item.productId || '',
          name: item.productSnapshot?.name || '',
          description: item.description || '',
          price: item.price || 0,
          originalPrice: item.productSnapshot?.price || item.price || 0,
          originalDescription: item.productSnapshot?.description || item.description || '',
          quantity: item.quantity || 1,
          discount: item.discount || { type: 'PERCENTAGE', value: 0 },
          tax: item.tax || 0,
          image: item.image || item.productSnapshot?.image || '',
          sku: item.productSnapshot?.skuNumber || '',
          hsnCode: item.productSnapshot?.hsnNumber || '',
        }));
        setItems(mappedItems);

        // Initialize product search rows with existing names
        const searchRows: any = {};
        mappedItems.forEach((item: any) => {
          searchRows[item.id] = { query: item.name, results: [], show: false };
        });
        setProductSearchRows(searchRows);
      }

      // Set existing attachments
      if (data.attachments && data.attachments.length > 0) {
        setExistingAttachments(data.attachments);
      }

      // Set calculated totals from existing data
      if (data.totals) {
        setCalculatedTotals({
          subtotal: data.totals.subtotal || 0,
          discountAmount: data.totals.discountAmount || 0,
          taxAmount: data.totals.taxAmount || 0,
          grandTotal: data.totals.grandTotal || 0,
        });
      }

      initialLoadDone.current = true;
    } catch (err: any) {
      setError(err.message || 'Failed to load quotation');
    } finally {
      setIsLoading(false);
    }
  };

  // Setup branch defaults
  useEffect(() => {
    if (selectedBranchId) {
      const branch: any = branches.find(b => b.id === selectedBranchId);
      if (branch?.taxes && Array.isArray(branch.taxes) && branch.taxes.length > 0) {
        setBranchTaxes(branch.taxes);
        setBranchTaxConfig({ label: branch.taxes[0].label, tax: branch.taxes[0].percentage ?? branch.taxes[0].value ?? 0 });
      } else if (branch?.taxLabel) {
        setBranchTaxes([{ label: branch.taxLabel, percentage: branch.tax || 0 }]);
        setBranchTaxConfig({ label: branch.taxLabel, tax: branch.tax || 0 });
      } else {
        setBranchTaxes([]);
        setBranchTaxConfig({ label: 'GST', tax: 0 });
      }
    }
  }, [selectedBranchId, branches]);

  useEffect(() => {
    if (!initialLoadDone.current) return; // Don't override with branch defaults during initial load
    if (selectedBranchId && branchTaxConfig.tax > 0) {
      setFormData(prev => ({
        ...prev,
        taxConfiguration: { ...prev.taxConfiguration, label: branchTaxConfig.label, value: branchTaxConfig.tax }
      }));
    }
  }, [branchTaxConfig]);

  // Preview API Trigger
  useEffect(() => {
    if (!selectedBranchId || !initialLoadDone.current) return;
    const handler = setTimeout(() => { fetchPreview(); }, 500);
    return () => clearTimeout(handler);
  }, [formData, items, selectedBranchId, branchTaxConfig]);

  const fetchPreview = async () => {
    try {
      setIsCalculating(true);

      let effectiveTaxConfig = {
        mode: formData.taxConfiguration.mode,
        label: formData.taxConfiguration.customTaxActive ? formData.taxConfiguration.label : branchTaxConfig.label,
        value: formData.taxConfiguration.customTaxActive ? formData.taxConfiguration.value : branchTaxConfig.tax
      };

      const payload = {
        branchId: selectedBranchId,
        customerId: formData.customerId || 'preview-customer-id',
        quotationDate: new Date(formData.quotationDate).toISOString(),
        billingAddress: billingAddress,
        shippingAddress: formData.shippingSameAsBilling ? billingAddress : shippingAddress,
        shippingSameAsBilling: formData.shippingSameAsBilling,
        discountConfiguration: formData.discountConfiguration,
        taxConfiguration: effectiveTaxConfig,
        items: items.map(i => ({
          productId: i.productId || undefined, price: i.price, description: i.description || '', quantity: i.quantity, discount: i.discount, tax: i.tax
        }))
      };

      const res = await apiFetch('/quotations/preview', {
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
          const res = await apiFetch(`/quotations/customers/search?q=${customerSearch}&branchId=${selectedBranchId}`);
          if (res.ok) setCustomerResults(await res.json());
        };
        fetchCust();
      }, 300);
      return () => clearTimeout(delayFn);
    }
  }, [customerSearch, selectedBranchId]);

  const handleCustomerSelect = (customer: any) => {
    setFormData({ ...formData, customerId: customer.id });
    setCustomerSearch(customer.customerName);
    setSelectedCustomerDetails(customer);
    setBillingAddress({ address: customer.address || '', city: '', state: '', pincode: '' });
    setShowCustomerDropdown(false);
  };

  const handleCustomerCreated = (newCustomer: any) => {
    handleCustomerSelect(newCustomer);
  };

  // Product Lookup
  const handleProductSearch = async (query: string, rowId: string) => {
    setProductSearchRows(prev => ({ ...prev, [rowId]: { ...prev[rowId], query, show: true } }));
    const res = await apiFetch(`/quotations/products/search?q=${query}&branchId=${selectedBranchId}`);
    if (res.ok) {
      const results = await res.json();
      setProductSearchRows(prev => ({ ...prev, [rowId]: { ...prev[rowId], results } }));
    }
  };

  const handleProductSelect = (product: any, rowId: string) => {
    setItems(items.map(i => i.id === rowId ? {
      ...i, productId: product.id, name: product.name, description: product.description, price: product.price,
      originalPrice: product.price, originalDescription: product.description, image: product.image || '',
      sku: product.skuNumber || product.sku || '', hsnCode: product.hsnNumber || product.hsnCode || ''
    } : i));
    setProductSearchRows(prev => ({ ...prev, [rowId]: { ...prev[rowId], show: false, query: product.name } }));
  };

  const updateItem = (id: string, field: string, value: any) => setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  const addItem = () => setItems([...items, { id: Math.random().toString(), productId: '', name: '', description: '', price: 0, originalPrice: 0, originalDescription: '', quantity: 1, discount: { type: 'PERCENTAGE', value: 0 }, tax: 0, image: '', sku: '', hsnCode: '' }]);
  const removeItem = (id: string) => { if (items.length > 1) setItems(items.filter(i => i.id !== id)); };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    setError(''); // clear previous errors
    const allowedTypes = ['application/pdf'];
    const MAX_SIZE_MB = 5;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of Array.from(e.target.files)) {
      const isHeic = file.name.toLowerCase().endsWith('.heic');
      if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/') && !isHeic) {
        errors.push(`${file.name}: Invalid format. (PDF or Images only)`);
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        errors.push(`${file.name}: Exceeds ${MAX_SIZE_MB}MB.`);
        continue;
      }

      try {
        if (file.type.startsWith('image/') || isHeic) {
          let fileToCompress = file;
          
          if (isHeic) {
            const heic2any = (await import('heic2any')).default;
            const convertedBlob = await heic2any({
              blob: file,
              toType: 'image/jpeg',
              quality: 0.8
            });
            const blobArray = Array.isArray(convertedBlob) ? convertedBlob : [convertedBlob];
            fileToCompress = new File(blobArray, file.name.replace(/\.heic$/i, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
          }

          const compressed = await imageCompression(fileToCompress, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true
          });
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
      setAttachments([validFiles[0]]);
    }

    e.target.value = ''; // reset input
  };

  const handleSave = async () => {
    if (!formData.customerId || items.length === 0) {
      setError('Please select a customer and add at least one item.');
      return;
    }
    try {
      setIsSaving(true); setError('');

      const payload = {
        branchId: selectedBranchId,
        customerId: formData.customerId,
        quotationDate: new Date(formData.quotationDate).toISOString(),
        expiryDate: new Date(formData.expiryDate).toISOString(),
        billingAddress,
        shippingAddress: formData.shippingSameAsBilling ? billingAddress : shippingAddress,
        shippingSameAsBilling: formData.shippingSameAsBilling,
        discountConfiguration: formData.discountConfiguration,
        taxConfiguration: formData.taxConfiguration,
        notes: formData.notes,
        followUpDate: formData.followUpDate ? new Date(formData.followUpDate).toISOString() : undefined,
        termsAndConditions: { text: formData.termsAndConditions },
        items: items.map(i => ({ productId: i.productId || undefined, price: i.price, description: i.description, quantity: i.quantity, discount: i.discount, tax: i.tax }))
      };

      const res = await apiFetch(`/quotations/${quotationId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update quotation');

      // Upload any new attachments
      for (const file of attachments) {
        const formData = new FormData();
        formData.append('file', file);
        await apiFetch(`/quotations/${quotationId}/attachments`, { method: 'POST', body: formData, headers: {} });
      }

      router.push('/quotations');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 md:p-8 z-0 relative overflow-x-hidden selection:bg-primary/30">
        <div className="flex flex-col items-center justify-center py-32">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
          <p className="mt-6 text-on-surface-variant font-medium tracking-wide">Loading quotation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 z-0 relative overflow-x-hidden selection:bg-primary/30 w-full max-w-full min-w-0">
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

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-12 pb-16 w-full max-w-full min-w-0">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="max-w-2xl">
            <button onClick={() => router.back()} className="text-on-surface-variant hover:text-primary flex items-center gap-1 text-sm font-semibold transition-colors mb-4">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back to List
            </button>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-4 shadow-[0_0_15px_rgba(125,211,252,0.15)]">
              <span className="material-symbols-outlined text-[14px]">edit_document</span>
              Edit Quotation
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight font-display mb-4">
              <span className="bg-gradient-to-br from-primary via-secondary to-tertiary bg-clip-text text-transparent">
                Update Details
              </span>
            </h1>
            <div className="flex flex-col gap-2">
              <p className="text-on-surface-variant text-lg leading-relaxed">
                Modify the quotation details below and save your changes.
              </p>
              {quotationNumber && (
                <span className="text-sm font-bold text-primary inline-flex items-center gap-1.5 bg-primary/5 px-2 py-1 rounded w-max border border-primary/10">
                  <span className="material-symbols-outlined text-[14px]">tag</span> {quotationNumber}
                </span>
              )}
            </div>
          </div>
          <button onClick={handleSave} disabled={isSaving || !selectedBranchId} className="group relative h-14 px-8 rounded-2xl bg-primary text-on-primary font-bold flex items-center justify-center gap-3 overflow-hidden shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto">
            <div className="absolute inset-0 w-full h-full bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
            {isSaving ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined">save</span>}
            <span>Update Quotation</span>
          </button>
        </header>

        {error && (
          <div ref={errorRef} className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 shadow-sm">
            <span className="material-symbols-outlined text-red-600 mt-0.5">error</span>
            <div className="text-sm text-red-700 font-medium whitespace-pre-line leading-relaxed">{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 relative z-10 animate-fade-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="col-span-2 space-y-6">

            {/* Customer & Address Section */}
            <div className="glass-panel rounded-3xl p-6 md:p-8 shadow-sm border border-outline-variant/30 overflow-visible relative">
              <h2 className="text-lg font-bold text-on-surface mb-4 border-b border-primary/10 pb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person</span> Customer Information
              </h2>

              <div className="mb-6 relative">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Search Customer *</label>
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
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
                  <button type="button" onClick={() => setIsCustomerModalOpen(true)} className="w-11 h-11 shrink-0 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-all shadow-md" title="Add New Customer">
                    <span className="material-symbols-outlined text-[20px]">add</span>
                  </button>
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
                  <div className="col-span-2">
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
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Shipping Address</label>
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
                  <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3">Discount Method</h3>
                  <div className="flex bg-surface-container/50 p-1 rounded-xl mb-6 w-full border border-outline-variant/20">
                    <button type="button" onClick={() => setFormData({ ...formData, discountConfiguration: { ...formData.discountConfiguration, mode: 'FIXED' } })} className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${formData.discountConfiguration.mode === 'FIXED' ? 'bg-surface shadow-sm text-primary border border-outline-variant/10' : 'text-on-surface-variant hover:text-on-surface'}`}>
                      Fixed for all
                    </button>
                    <button type="button" onClick={() => setFormData({ ...formData, discountConfiguration: { ...formData.discountConfiguration, mode: 'PER_PRODUCT' } })} className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${formData.discountConfiguration.mode === 'PER_PRODUCT' ? 'bg-surface shadow-sm text-primary border border-outline-variant/10' : 'text-on-surface-variant hover:text-on-surface'}`}>
                      Per Product
                    </button>
                  </div>

                  <div className="h-[50px]">
                    {formData.discountConfiguration.mode === 'FIXED' && (
                      <div className="flex">
                        <input type="number" value={formData.discountConfiguration.value} onChange={(e) => setFormData({ ...formData, discountConfiguration: { ...formData.discountConfiguration, value: parseFloat(e.target.value) || 0 } })} className="glass-input px-4 py-2.5 rounded-l-lg w-full text-sm font-semibold border-r-0 focus:ring-0 focus:border-primary/50" placeholder="Amount" />
                        <select value={formData.discountConfiguration.type} onChange={(e: any) => setFormData({ ...formData, discountConfiguration: { ...formData.discountConfiguration, type: e.target.value } })} className="glass-input px-3 py-2.5 rounded-r-lg text-sm font-bold bg-surface-container cursor-pointer focus:ring-0 focus:border-primary/50">
                          <option value="PERCENTAGE">%</option>
                          <option value="AMOUNT">₹</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tax Rules */}
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3">Tax Method</h3>
                  <div className="flex bg-surface-container/50 p-1 rounded-xl mb-6 w-full border border-outline-variant/20">
                    <button type="button" onClick={() => setFormData({ ...formData, taxConfiguration: { ...formData.taxConfiguration, mode: 'FIXED', customTaxActive: false } })} className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${formData.taxConfiguration.mode === 'FIXED' && !formData.taxConfiguration.customTaxActive ? 'bg-surface shadow-sm text-primary border border-outline-variant/10' : 'text-on-surface-variant hover:text-on-surface'}`}>
                      Default
                    </button>
                    <button type="button" onClick={() => setFormData({ ...formData, taxConfiguration: { ...formData.taxConfiguration, mode: 'FIXED', customTaxActive: true } })} className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${formData.taxConfiguration.mode === 'FIXED' && formData.taxConfiguration.customTaxActive ? 'bg-surface shadow-sm text-primary border border-outline-variant/10' : 'text-on-surface-variant hover:text-on-surface'}`}>
                      Custom
                    </button>
                    <button type="button" onClick={() => setFormData({ ...formData, taxConfiguration: { ...formData.taxConfiguration, mode: 'PER_PRODUCT' } })} className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${formData.taxConfiguration.mode === 'PER_PRODUCT' ? 'bg-surface shadow-sm text-primary border border-outline-variant/10' : 'text-on-surface-variant hover:text-on-surface'}`}>
                      Per Item
                    </button>
                  </div>

                  <div className="h-[50px]">
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
                          <div className="relative">
                            <select 
                              className="glass-input px-4 py-2.5 rounded-lg w-full text-sm font-semibold cursor-pointer focus:ring-0 focus:border-primary/50 appearance-none bg-surface-container/30 border-outline-variant/30 text-on-surface"
                              value={branchTaxConfig.label}
                              onChange={(e) => {
                                const selectedTax = branchTaxes.find(t => t.label === e.target.value);
                                if (selectedTax) {
                                  setBranchTaxConfig({ label: selectedTax.label, tax: selectedTax.percentage ?? selectedTax.value ?? 0 });
                                }
                              }}
                            >
                              {branchTaxes.length > 0 ? (
                                branchTaxes.map((tax, idx) => (
                                  <option key={idx} value={tax.label} className="text-on-surface bg-surface">{tax.label} ({tax.percentage ?? tax.value ?? 0}%)</option>
                                ))
                              ) : (
                                <option value="GST" className="text-on-surface bg-surface">GST (0%)</option>
                              )}
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-lg">expand_more</span>
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
                <span className="material-symbols-outlined text-primary">inventory_2</span> Quotation Items
              </h2>
              <div className="p-6 pt-2 flex flex-col gap-4">
                {items.map((item, index) => {
                  const calcItem = calculatedItems[index];
                  return (
                    <div key={item.id} className="relative group bg-surface-container/20 border border-outline-variant/10 rounded-xl p-4 md:p-5 hover:bg-surface-container/40 transition-colors shadow-sm">
                      {/* Delete Button */}
                      <button onClick={() => removeItem(item.id)} className="absolute top-2 right-2 text-error hover:bg-error/10 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10" title="Remove Item">
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
                                        <div className="text-primary/70 flex items-center justify-center w-8 h-8 shrink-0 bg-surface-container/50 rounded-md overflow-hidden border border-outline-variant/20">
                                          {p.image ? (
                                            <img src={getImageUrl(p.image)} alt={p.name} className="w-full h-full object-cover" />
                                          ) : (
                                            <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                                          )}
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                          <span className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">{p.name}</span>
                                          {(p.skuNumber || p.sku) && (
                                            <span className="text-[11px] text-on-surface-variant">
                                              SKU: {p.skuNumber || p.sku}
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
                            <div className={`col-span-12 ${(formData.discountConfiguration.mode === 'PER_PRODUCT' && formData.taxConfiguration.mode === 'PER_PRODUCT') ? 'md:col-span-4' :
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
                                <div className="flex items-center gap-1">
                                  <input type="number" value={item.discount?.value || 0} onChange={(e) => updateItem(item.id, 'discount', { ...item.discount, value: parseFloat(e.target.value) || 0 })} className="glass-input px-3 py-2 rounded-lg text-sm w-full font-semibold" />
                                  <select value={item.discount?.type || 'PERCENTAGE'} onChange={(e) => updateItem(item.id, 'discount', { ...item.discount, type: e.target.value })} className="glass-input p-2 rounded-lg text-xs font-bold bg-surface-container cursor-pointer">
                                    <option value="PERCENTAGE">%</option>
                                    <option value="AMOUNT">₹</option>
                                  </select>
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
                                ₹ {calcItem?.total?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
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

            {/* Terms and Conditions */}
            <div className="glass-panel rounded-3xl p-6 md:p-8 shadow-sm border border-outline-variant/30">
              <h2 className="text-lg font-bold text-on-surface mb-4 border-b border-primary/10 pb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">description</span> Terms & Conditions
              </h2>
              <textarea value={formData.termsAndConditions} onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })} className="glass-input w-full p-4 rounded-xl text-sm text-on-surface font-medium leading-relaxed" rows={4} placeholder="Enter quotation-specific terms here..."></textarea>
              <p className="text-xs text-on-surface-variant/70 mt-3 flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">info</span> Press Enter for a new line. Each line will be shown as a separate point in the PDF.</p>
            </div>

          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Summary */}
            <div className="glass-panel rounded-3xl p-6 md:p-8 shadow-sm border border-outline-variant/30">
              <h3 className="text-sm font-bold text-on-surface mb-4 uppercase tracking-wide">Quotation Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center text-on-surface-variant">
                  <span>Subtotal</span>
                  <span className="font-semibold text-on-surface">₹ {calculatedTotals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-on-surface-variant">
                  <span>Total Discount</span>
                  <span className="font-semibold text-error">- ₹ {calculatedTotals.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-on-surface-variant">
                  <span>Total Tax</span>
                  <span className="font-semibold text-on-surface">₹ {calculatedTotals.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="pt-4 mt-2 border-t border-primary/10 flex justify-between items-center">
                  <span className="font-bold text-on-surface text-base">Grand Total</span>
                  <div className="flex items-center gap-2">
                    {isCalculating && <span className="material-symbols-outlined animate-spin text-primary text-[16px]">refresh</span>}
                    <span className="font-bold text-primary text-xl tracking-tight">₹ {calculatedTotals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="glass-panel rounded-3xl p-6 md:p-8 shadow-sm border border-outline-variant/30">
              <h3 className="text-sm font-bold text-on-surface mb-4 uppercase tracking-wide">Timeline</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Quotation Date</label>
                  <input type="date" value={formData.quotationDate} onChange={(e) => setFormData({ ...formData, quotationDate: e.target.value })} className="glass-input px-4 py-2.5 rounded-lg text-sm text-on-surface w-full font-semibold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Expiry Date (+2 Months)</label>
                  <input type="date" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} className="glass-input px-4 py-2.5 rounded-lg text-sm text-error w-full font-semibold" />
                </div>
              </div>
            </div>

            {/* Existing Attachments */}
            {existingAttachments.length > 0 && (
              <div className="glass-panel rounded-3xl p-6 md:p-8 shadow-sm border border-outline-variant/30">
                <h3 className="text-sm font-bold text-on-surface mb-4 uppercase tracking-wide">Existing Attachments</h3>
                <div className="space-y-2">
                  {existingAttachments.map((att: any) => (
                    <div key={att.id} className="flex justify-between items-center p-3 rounded-lg bg-surface-container/50 border border-outline-variant/10">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[18px]">attach_file</span>
                        <span className="text-xs text-on-surface font-semibold truncate max-w-[180px]">{att.fileName}</span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant">{(att.fileSize / 1024).toFixed(1)} KB</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments Dropzone */}
            <div className="glass-panel rounded-3xl p-6 md:p-8 shadow-sm border border-outline-variant/30">
              <h3 className="text-sm font-bold text-on-surface mb-4 uppercase tracking-wide">Add Attachments</h3>
              {attachments.length === 0 && (
                <div className="border-2 border-dashed border-primary/30 rounded-xl p-6 text-center hover:bg-primary/5 transition-colors relative group cursor-pointer">
                  <input type="file" accept=".pdf,image/*,.heic,.HEIC" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <span className="material-symbols-outlined text-primary text-[32px] mb-2 group-hover:scale-110 transition-transform">cloud_upload</span>
                  <p className="text-sm font-bold text-on-surface">Click or drag a file to attach</p>
                  <p className="text-xs text-on-surface-variant mt-1">PDF or Images (Max 5MB)</p>
                </div>
              )}

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

            {/* Notes & Reminder */}
            <div className="glass-panel rounded-3xl p-6 md:p-8 shadow-sm border border-outline-variant/30">
              <h3 className="text-sm font-bold text-on-surface mb-4 uppercase tracking-wide">Notes & Reminder</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Notes</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="glass-input w-full p-3 rounded-lg text-sm text-on-surface" placeholder="Internal notes..." rows={2}></textarea>
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Follow Up Date</label>
                  <input type="date" value={formData.followUpDate} onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })} className="glass-input px-4 py-2.5 rounded-lg text-sm text-on-surface w-full font-semibold" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Decoration */}
        <footer className="relative z-10 w-full opacity-40 text-center flex items-center justify-center gap-4 mt-12 mb-4">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-on-surface-variant to-transparent"></div>
          <p className="text-xs font-bold tracking-[0.2em] text-on-surface-variant uppercase">
            BillTea • Edit Quotation
          </p>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-on-surface-variant to-transparent"></div>
        </footer>
      </div>
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        branchId={selectedBranchId || ''}
        onSaveSuccess={handleCustomerCreated}
      />
    </div>
  );
}
