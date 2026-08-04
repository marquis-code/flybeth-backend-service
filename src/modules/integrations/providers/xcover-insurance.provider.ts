import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";
import {
  InsuranceAdapter,
  InsuranceIssueRequest,
  InsuranceIssueResult,
  InsuranceCancelResult,
} from "../interfaces/insurance-adapter.interface";

@Injectable()
export class XCoverInsuranceProvider implements InsuranceAdapter {
  providerName = "xcover";
  private readonly logger = new Logger(XCoverInsuranceProvider.name);
  private readonly client: AxiosInstance;
  private readonly partnerCode: string;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>("XCOVER_API_URL");
    this.partnerCode = this.configService.get<string>("XCOVER_PARTNER_CODE") || "test_partner";
    const username = this.configService.get<string>("XCOVER_USERNAME");
    const password = this.configService.get<string>("XCOVER_PASSWORD");

    if (!baseURL || !username || !password) {
      this.logger.warn("XCover credentials not fully configured. API calls will fail.");
    }

    this.client = axios.create({
      baseURL,
      auth: {
        username: username || "",
        password: password || "",
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async issuePolicy(request: InsuranceIssueRequest): Promise<InsuranceIssueResult> {
    try {
      this.logger.debug(`Issuing XCover policy for transaction: ${request.partnerTransactionId}`);
      
      const payload = {
        currency: request.currency || "USD",
        customer_language: request.customerLanguage || "en-us",
        partner_transaction_id: request.partnerTransactionId,
        request: [
          {
            policy_type: request.policyType || "retail_benefits",
            policy_type_version: request.policyTypeVersion || "1",
            policy_start_date: request.policyStartDate,
            insured: request.insured.map((person) => ({
              first_name: person.firstName,
              last_name: person.lastName,
              ...(person.birthDate ? { birth_date: person.birthDate } : {}),
            })),
          },
        ],
        policyholder: {
          first_name: request.policyholder.firstName,
          last_name: request.policyholder.lastName,
          email: request.policyholder.email,
          phone: request.policyholder.phone,
          country: request.policyholder.country || "US",
          ...(request.policyholder.birthDate ? { birth_date: request.policyholder.birthDate } : {}),
          ...(request.policyholder.postcode ? { postcode: request.policyholder.postcode } : {}),
          ...(request.policyholder.region ? { region: request.policyholder.region } : {}),
        },
      };

      const response = await this.client.post(
        `/partners/${this.partnerCode}/instant_booking/`,
        payload
      );

      return {
        success: true,
        policyId: response.data.id,
        status: response.data.status,
        partnerTransactionId: request.partnerTransactionId,
        rawResponse: response.data,
      };
    } catch (error) {
      this.logger.error(
        `Failed to issue XCover policy: ${error.response?.data ? JSON.stringify(error.response.data) : error.message}`
      );
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        rawResponse: error.response?.data,
      };
    }
  }

  async cancelPolicy(policyId: string): Promise<InsuranceCancelResult> {
    try {
      this.logger.debug(`Cancelling XCover policy: ${policyId}`);
      
      const response = await this.client.post(
        `/partners/${this.partnerCode}/bookings/${policyId}/cancel`,
        {}
      );

      return {
        success: true,
        status: response.data?.status || 'cancelled',
      };
    } catch (error) {
      this.logger.error(
        `Failed to cancel XCover policy ${policyId}: ${error.response?.data ? JSON.stringify(error.response.data) : error.message}`
      );
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }
}
