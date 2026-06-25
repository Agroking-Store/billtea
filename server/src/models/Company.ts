import mongoose, { Schema, Document } from 'mongoose';

export interface ICompanyIdentifier {
  label: string;
  value: string;
}

export interface ICompany extends Document {
  name: string;
  logo: string;
  identifiers: ICompanyIdentifier[];
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CompanyIdentifierSchema = new Schema<ICompanyIdentifier>(
  {
    label: {
      type: String,
      required: [true, 'Identifier label is required'],
      trim: true,
    },
    value: {
      type: String,
      required: [true, 'Identifier value is required'],
      trim: true,
    },
  },
  { _id: false }
);

const CompanySchema = new Schema<ICompany>(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      minlength: [2, 'Company name must be at least 2 characters'],
    },
    logo: {
      type: String,
      default: '',
    },
    identifiers: {
      type: [CompanyIdentifierSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

const Company = mongoose.model<ICompany>('Company', CompanySchema);
export default Company;
