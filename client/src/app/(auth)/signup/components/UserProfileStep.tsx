import React from 'react';
import { StepProps } from './types';
import { AlertMessage } from '../../../../components/AlertMessage';

export function UserProfileStep({ formData, updateData, errors, clearError }: StepProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    clearError('profilePicture');
    updateData({ profilePicture: file });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1">Full Name</label>
        <div className="flex items-center input-container rounded-full overflow-hidden input-glow px-4 py-1.5">
          <span className="material-symbols-outlined text-on-surface-variant mr-3 text-xl select-none">person</span>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => { clearError('fullName'); updateData({ fullName: e.target.value }); }}
            placeholder="John Doe"
            className="w-full bg-transparent border-none text-on-surface placeholder-on-surface-variant/40 focus:ring-0 focus:outline-none py-2 text-sm"
          />
        </div>
        <AlertMessage message={errors.fullName} />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1">Profile Picture</label>
        <div className="flex items-center input-container rounded-3xl overflow-hidden input-glow px-4 py-4 border-dashed border-2">
          <span className="material-symbols-outlined text-on-surface-variant mr-3 text-3xl select-none">account_circle</span>
          <div className="w-full">
            <input
              type="file"
              accept="image/*,.heic"
              onChange={handleFileChange}
              className="w-full text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer"
            />
            {formData.profilePicture && (
              <p className="text-xs text-emerald-600 mt-2 font-medium">Selected: {formData.profilePicture.name}</p>
            )}
          </div>
        </div>
        <AlertMessage message={errors.profilePicture} />
      </div>
    </div>
  );
}
