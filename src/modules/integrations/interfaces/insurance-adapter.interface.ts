// src/modules/integrations/interfaces/insurance-adapter.interface.ts

export interface InsuranceIssueRequest {
  partnerTransactionId: string;
  policyStartDate: string; // YYYY-MM-DD
  policyType?: string;
  policyTypeVersion?: string;
  currency: string;
  customerLanguage?: string;
  insured: {
    firstName: string;
    lastName: string;
    birthDate?: string;
  }[];
  policyholder: {
    firstName: string;
    lastName: string;
    birthDate?: string;
    country: string;
    email: string;
    phone: string;
    postcode?: string;
    region?: string;
  };
}

export interface InsuranceIssueResult {
  success: boolean;
  policyId?: string;
  status?: string;
  partnerTransactionId?: string;
  rawResponse?: any;
  error?: string;
}

export interface InsuranceCancelResult {
  success: boolean;
  status?: string;
  error?: string;
}

export interface InsuranceAdapter {
  providerName: string;
  
  /**
   * Issue a new insurance policy
   */
  issuePolicy(request: InsuranceIssueRequest): Promise<InsuranceIssueResult>;
  
  /**
   * Cancel an existing insurance policy
   */
  cancelPolicy(policyId: string): Promise<InsuranceCancelResult>;
}
