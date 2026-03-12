/**
 * Shared types for withdrawal feature
 */

export interface WithdrawFormData {
  bankAccountId: string;
  itemName: string;
  category?: string;
  payment_method: string;
  district_id?: string;
  sub_district_id?: string;
  amount: string | number;
  description?: string;
  images?: File[];
  schedule_id?: string;
}

export interface WithdrawalValidationError {
  [key: string]: string;
}

export interface ProcessWithdrawalResult {
  success: boolean;
  transactionId?: string;
  message: string;
  data?: WithdrawFormData;
  errors?: WithdrawalValidationError;
}

export interface CalculatedFees {
  fee: number;
  netAmount: number;
}

export interface ImageDetails {
  name: string;
  size: string;
  type: string;
  lastModified: string;
}
