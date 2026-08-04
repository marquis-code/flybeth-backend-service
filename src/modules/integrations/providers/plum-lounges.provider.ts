import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";
import {
  LoungeAdapter,
  LoungeSearchQuery,
  LoungeSearchResult,
  LoungeBookingRequest,
  LoungeBookingResult,
  LoungeOrderDetails,
  LoungeBalance,
  LoungeVoucher,
} from "../interfaces/lounge-adapter.interface";

@Injectable()
export class PlumLoungesProvider implements LoungeAdapter {
  providerName = "plum-lounges";
  private readonly logger = new Logger(PlumLoungesProvider.name);
  private readonly client: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>("PLUM_API_URL") || "https://stagingstores.xoxoday.com/chef/v1/oauth/api";
    const bearerToken = this.configService.get<string>("PLUM_BEARER_TOKEN");

    if (!bearerToken) {
      this.logger.warn("Plum Bearer Token not configured. API calls will fail.");
    }

    this.client = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${bearerToken || ""}`,
      },
    });
  }

  async searchLounges(query: LoungeSearchQuery): Promise<LoungeSearchResult> {
    try {
      this.logger.debug(`Searching Plum Lounges`);
      
      const payload = {
        query: "plumProAPI.mutation.getVouchers",
        tag: "plumProAPI",
        variables: {
          data: {
            categoryType: "lounge",
            limit: query.limit || 10,
            page: query.page || 1,
            // Include country filter if provided
            ...(query.country && {
               filters: [{ key: "country", value: query.country }]
            }),
            sort: {
              field: "name",
              order: "ASC"
            }
          }
        }
      };

      const response = await this.client.post("", payload);
      const resData = response.data?.data?.getVouchers;

      if (resData?.status !== 1) {
        throw new Error(JSON.stringify(resData || response.data));
      }

      const vouchers: LoungeVoucher[] = (resData.data || []).map((item: any) => ({
        productId: item.productId,
        name: item.name,
        description: item.description,
        imageUrl: item.imageUrl,
        orderQuantityLimit: item.orderQuantityLimit,
        termsAndConditions: item.termsAndConditionsInstructions,
        redemptionInstructions: item.redemptionInstructions,
        categories: item.categories,
        currencyCode: item.currencyCode,
        currencyName: item.currencyName,
        countryName: item.countryName,
        countryCode: item.countryCode,
        price: item.price || item.minPrice,
        minPrice: item.minPrice,
        maxPrice: item.maxPrice,
      }));

      return {
        provider: this.providerName,
        totalCount: vouchers.length, // Ideally we'd map total from response if paginated
        vouchers,
      };

    } catch (error) {
      this.logger.error(`Plum Lounges search failed: ${error.message}`);
      throw error;
    }
  }

  async bookLounge(request: LoungeBookingRequest): Promise<LoungeBookingResult> {
    try {
      this.logger.debug(`Booking Plum Lounge product: ${request.productId}`);

      const payload = {
        query: "plumProAPI.mutation.placeOrder",
        tag: "plumProAPI",
        variables: {
          data: {
            productId: request.productId,
            quantity: request.quantity,
            denomination: request.denomination,
            email: request.email,
            contact: request.contact,
            poNumber: request.poNumber,
            notifyAdminEmail: request.notifyAdminEmail || 0,
            notifyReceiverEmail: request.notifyReceiverEmail || 0,
            tag: "flybeth-lounge"
          }
        }
      };

      const response = await this.client.post("", payload);
      const resData = response.data?.data?.placeOrder;

      if (resData?.status !== 1) {
        return {
          success: false,
          errorMessage: JSON.stringify(resData || response.data)
        };
      }

      return {
        success: true,
        orderId: resData.data?.orderId,
        orderTotal: resData.data?.orderTotal,
        amountCharged: resData.data?.amountCharged,
        currencyCode: resData.data?.currencyCode,
        orderStatus: resData.data?.orderStatus,
        deliveryStatus: resData.data?.deliveryStatus,
        vouchers: resData.data?.vouchers?.map((v: any) => ({
          productId: v.productId,
          voucherCode: v.voucherCode,
          pin: v.pin,
          validity: v.validity
        }))
      };

    } catch (error) {
       this.logger.error(`Plum Lounges booking failed: ${error.message}`);
       return {
         success: false,
         errorMessage: error.message
       };
    }
  }

  async getOrderDetails(poNumber: string): Promise<LoungeOrderDetails> {
    try {
      const payload = {
        query: "plumProAPI.mutation.getOrderDetails",
        tag: "plumProAPI",
        variables: {
          data: {
            poNumber,
            sendMailToReceiver: 0
          }
        }
      };

      const response = await this.client.post("", payload);
      const resData = response.data?.data?.getOrderDetails;

      if (resData?.status !== 1) {
         throw new Error(JSON.stringify(resData || response.data));
      }

      return {
        orderId: resData.data?.orderId,
        orderTotal: resData.data?.orderTotal,
        amountCharged: resData.data?.amountCharged,
        orderStatus: resData.data?.orderStatus,
        deliveryStatus: resData.data?.deliveryStatus,
        vouchers: resData.data?.vouchers?.map((v: any) => ({
          productId: v.productId,
          voucherCode: v.voucherCode,
          pin: v.pin,
          validity: v.validity
        })) || []
      };

    } catch (error) {
       this.logger.error(`Plum Lounges order details failed: ${error.message}`);
       throw error;
    }
  }

  async getBalance(): Promise<LoungeBalance> {
    try {
      const payload = {
        query: "plumProAPI.query.getBalance",
        tag: "plumProAPI",
        variables: {
          data: {}
        }
      };

      const response = await this.client.post("", payload);
      const resData = response.data?.data?.getBalance;

      if (resData?.status !== 1) {
         throw new Error(JSON.stringify(resData || response.data));
      }

      return {
        value: resData.data?.value || 0,
        currency: resData.data?.currency || "USD"
      };
    } catch (error) {
       this.logger.error(`Plum Lounges get balance failed: ${error.message}`);
       throw error;
    }
  }
}
