// src/modules/integrations/providers/sabre-cars.provider.ts
import { Injectable, Logger } from "@nestjs/common";
import {
    CarAdapter,
    CarSearchQuery,
    CarSearchResult,
    CarPriceCheckResult,
} from "../interfaces/car-adapter.interface";
import { SabreHelperService } from "./sabre-helper.service";

@Injectable()
export class SabreCarsProvider implements CarAdapter {
    readonly providerName = "sabre";
    private readonly logger = new Logger(SabreCarsProvider.name);

    constructor(private sabreHelper: SabreHelperService) { }

    /**
     * Search for available vehicles using Sabre GetVehAvail V2
     */
    async searchCars(query: CarSearchQuery): Promise<CarSearchResult[]> {
        this.logger.log(
            `Searching Sabre cars: ${query.pickUpLocation} ${query.pickUpDate} ${query.pickUpTime}`,
        );

        try {
            const token = await this.sabreHelper.getAccessToken();

            const payload = {
                GetVehAvailRQ: {
                    version: "2.0.0",
                    SearchCriteria: {
                        PickUpDate: query.pickUpDate,
                        PickUpTime: query.pickUpTime,
                        ReturnDate: query.returnDate,
                        ReturnTime: query.returnTime,
                        SortBy: "Price",
                        SortOrder: "ASC",
                        RentalLocRef: {
                            PickUpLocation: {
                                LocationCode: query.pickUpLocation,
                                ExtendedLocationCode: query.pickUpLocation,
                            },
                            ReturnLocation: {
                                LocationCode: query.returnLocation || query.pickUpLocation,
                                ExtendedLocationCode: query.returnLocation || query.pickUpLocation,
                            },
                        },
                        ImageRef: {
                            Image: {
                                Type: "ORIGINAL",
                            },
                        },
                        LocPolicyRef: {
                            Include: true,
                        },
                        RatePrefs: {
                            Commission: true,
                            RateAssured: false,
                            SupplierCurrencyOnly: false,
                            ConvertedRateInfoOnly: false,
                            CurrencyCode: query.currencyCode || "USD",
                        },
                        VendorPrefs: query.vendorCode
                            ? {
                                VendorPref: {
                                    Code: query.vendorCode,
                                },
                            }
                            : undefined,
                        VehPrefs: query.vehicleType
                            ? {
                                VehPref: {
                                    VehType: [query.vehicleType],
                                },
                            }
                            : undefined,
                    },
                },
            };

            const response = await fetch(`${this.sabreHelper.baseUrl}/v2.0.0/get/vehavail`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                this.logger.error(`Sabre car search failed: ${response.status} ${errorBody}`);
                return [];
            }

            const data = await response.json();
            return this.mapSabreResults(data);
        } catch (error) {
            this.logger.error(`Sabre car search error: ${error.message}`, error.stack);
            return [];
        }
    }

    /**
     * Validate a rate using Sabre Vehicle Price Check V1
     */
    async priceCheck(rateKey: string, details?: any): Promise<CarPriceCheckResult> {
        this.logger.log(`Performing Sabre price check for rateKey: ${rateKey.substring(0, 20)}...`);

        try {
            const token = await this.sabreHelper.getAccessToken();

            const payload = {
                VehPriceCheckRQ: {
                    version: "1.0.0",
                    VehRateInfoRef: {
                        RateKey: rateKey,
                    },
                },
            };

            const response = await fetch(`${this.sabreHelper.baseUrl}/v1.0.0/veh/pricecheck`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                this.logger.error(`Sabre price check failed: ${response.status} ${errorBody}`);
                throw new Error(`Sabre price check failed: ${response.status}`);
            }

            const data = await response.json();
            return this.mapPriceCheckResponse(data);
        } catch (error) {
            this.logger.error(`Sabre price check error: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Map Sabre response to internal format
     */
    private mapSabreResults(data: any): CarSearchResult[] {
        const vehAvailInfos = data?.GetVehAvailRS?.VehAvailInfos?.VehAvailInfo;
        if (!vehAvailInfos || !Array.isArray(vehAvailInfos)) {
            return [];
        }

        const locPolicies = data?.GetVehAvailRS?.VehLocPolicyInfos?.VehLocPolicyinfo || [];
        const locMap = new Map();
        locPolicies.forEach((p: any) => locMap.set(p.PolicyRef, p));

        return vehAvailInfos.map((info: any) => {
            const rate = info.VehRentalRate?.[0] || {};
            const vehicle = rate.Vehicle || {};
            const charges = rate.VehicleCharges?.VehicleCharge || [];
            const totalCharge = charges.find((c: any) => c.ChargeType === "ApproximateTotalPrice") || {};
            const baseCharge = charges.find((c: any) => c.ChargeType === "BaseRateTotal") || {};

            const pickUpLoc = locMap.get(info.PickUpLocation?.PolicyRef) || info.PickUpLocation;
            const returnLoc = locMap.get(info.ReturnLocation?.PolicyRef) || info.ReturnLocation;

            return {
                provider: "sabre",
                vendor: {
                    code: info.Vendor?.Code,
                    name: info.Vendor?.Name,
                },
                vehicle: {
                    type: vehicle.VehType,
                    name: vehicle.VehType, // Sabre usually gives type code like ECAR
                    passengers: vehicle.SeatBeltsAndBagsInfo?.SeatBelts?.Quantity || 5,
                    bagsLarge: vehicle.SeatBeltsAndBagsInfo?.BagsInfo?.Bags?.find((b: any) => b.Size === "Large")?.Quantity || 0,
                    bagsSmall: vehicle.SeatBeltsAndBagsInfo?.BagsInfo?.Bags?.find((b: any) => b.Size === "Small")?.Quantity || 0,
                    images: vehicle.Images?.Image?.map((img: any) => img.Url).filter(Boolean) || [],
                },
                bookingInfo: {
                    rateKey: rate.RateKey,
                    rateCode: rate.RateCode,
                    availabilityStatus: rate.AvailabilityStatus,
                },
                location: {
                    pickUp: {
                        locationCode: info.PickUpLocation?.LocationCode,
                        extendedLocationCode: info.PickUpLocation?.ExtendedLocationCode,
                        name: pickUpLoc?.LocationName,
                        address: this.mapAddress(pickUpLoc?.LocationInfo?.Address),
                    },
                    return: {
                        locationCode: info.ReturnLocation?.LocationCode,
                        extendedLocationCode: info.ReturnLocation?.ExtendedLocationCode,
                        name: returnLoc?.LocationName,
                        address: this.mapAddress(returnLoc?.LocationInfo?.Address),
                    },
                },
                price: {
                    amount: parseFloat(totalCharge.Amount || "0"),
                    currency: totalCharge.CurrencyCode || "USD",
                    baseAmount: parseFloat(baseCharge.Amount || "0"),
                    totalAmount: parseFloat(totalCharge.Amount || "0"),
                    approximateTotal: parseFloat(totalCharge.Amount || "0"),
                },
            };
        });
    }

    private mapPriceCheckResponse(data: any): CarPriceCheckResult {
        const info = data?.VehPriceCheckRS?.PriceCheckInfo;
        const searchResult = this.mapSabreResults({
            GetVehAvailRS: {
                VehAvailInfos: info?.VehRateInfo?.VehAvailInfos,
                VehLocPolicyInfos: data?.VehPriceCheckRS?.VehLocPolicyInfos,
            },
        })[0];

        return {
            bookingKey: info?.BookingKey,
            priceChanged: info?.PriceChange,
            priceDifference: parseFloat(info?.PriceDifference || "0"),
            currency: info?.CurrencyCode || "USD",
            updatedResult: searchResult,
        };
    }

    private mapAddress(addr: any) {
        if (!addr) return undefined;
        return {
            line1: addr.AddressLine1,
            city: addr.CityName?.value || addr.CityName,
            state: addr.StateProv?.StateCode,
            postalCode: addr.PostalCode,
            country: addr.CountryName?.Code || addr.CountryName,
        };
    }
}
