import { Injectable, Logger } from "@nestjs/common";
import {
  InsuranceAdapter,
  InsuranceIssueRequest,
  InsuranceIssueResult,
  InsuranceCancelResult,
} from "./interfaces/insurance-adapter.interface";
import { XCoverInsuranceProvider } from "./providers/xcover-insurance.provider";

@Injectable()
export class InsuranceIntegrationService {
  private adapters: Map<string, InsuranceAdapter> = new Map();
  private readonly logger = new Logger(InsuranceIntegrationService.name);

  constructor(
    private xcoverInsuranceProvider: XCoverInsuranceProvider,
  ) {
    this.registerAdapter(xcoverInsuranceProvider);
  }

  registerAdapter(adapter: InsuranceAdapter) {
    this.adapters.set(adapter.providerName, adapter);
    this.logger.log(`Registered insurance adapter: ${adapter.providerName}`);
  }

  async issuePolicy(providerName: string, request: InsuranceIssueRequest): Promise<InsuranceIssueResult> {
    const adapter = this.adapters.get(providerName);
    if (!adapter) {
      this.logger.error(`Insurance adapter ${providerName} not found`);
      return { success: false, error: `Insurance adapter ${providerName} not found` };
    }

    try {
      return await adapter.issuePolicy(request);
    } catch (error) {
      this.logger.error(`Error issuing policy with ${providerName}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async cancelPolicy(providerName: string, policyId: string): Promise<InsuranceCancelResult> {
    const adapter = this.adapters.get(providerName);
    if (!adapter) {
      this.logger.error(`Insurance adapter ${providerName} not found`);
      return { success: false, error: `Insurance adapter ${providerName} not found` };
    }

    try {
      return await adapter.cancelPolicy(policyId);
    } catch (error) {
      this.logger.error(`Error cancelling policy with ${providerName}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
