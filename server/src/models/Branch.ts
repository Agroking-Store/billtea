import mongoose, { Schema, Document } from 'mongoose';

export type SignatureType = 'text' | 'image';

export interface IBranch extends Document {
  companyId: mongoose.Types.ObjectId;
  name: string;
  isMainBranch: boolean;
  // Location
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  // Banking
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  // Signature
  signatureType: SignatureType;
  signatureValue: string;
  // Meta
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BranchSchema = new Schema<IBranch>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Branch name is required'],
      trim: true,
      minlength: [2, 'Branch name must be at least 2 characters'],
    },
    isMainBranch: {
      type: Boolean,
      default: false,
    },
    // Location fields
    address: {
      type: String,
      default: '',
      trim: true,
    },
    city: {
      type: String,
      default: '',
      trim: true,
    },
    state: {
      type: String,
      default: '',
      trim: true,
    },
    pincode: {
      type: String,
      default: '',
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      default: '',
      lowercase: true,
      trim: true,
    },
    // Banking fields
    bankName: {
      type: String,
      default: '',
      trim: true,
    },
    accountNumber: {
      type: String,
      default: '',
      trim: true,
    },
    ifscCode: {
      type: String,
      default: '',
      trim: true,
    },
    upiId: {
      type: String,
      default: '',
      trim: true,
    },
    // Signature fields
    signatureType: {
      type: String,
      enum: ['text', 'image'],
      default: 'text',
    },
    signatureValue: {
      type: String,
      default: '',
    },
    // Meta
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Unique branch name per company
BranchSchema.index({ companyId: 1, name: 1 }, { unique: true });

// Prevent deletion of main branch
BranchSchema.pre('deleteOne', { document: true, query: false }, async function () {
  if (this.isMainBranch) {
    throw new Error('Main branch cannot be deleted');
  }
});

const Branch = mongoose.model<IBranch>('Branch', BranchSchema);
export default Branch;
