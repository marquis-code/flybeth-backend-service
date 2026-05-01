// src/modules/integrations/duffel-identity.service.ts
import { Injectable, Logger, Inject, forwardRef } from "@nestjs/common";
import { DuffelProvider } from "./providers/duffel.provider";
import { UsersService } from "../users/users.service";

@Injectable()
export class DuffelIdentityService {
  private readonly logger = new Logger(DuffelIdentityService.name);

  constructor(
    private duffelProvider: DuffelProvider,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {}

  /**
   * Ensure a user has a Duffel identity and returns a client key for frontend interaction
   */
  async ensureIdentity(userId?: string, providedData?: any): Promise<{ customerId: string; clientKey?: string }> {
    this.logger.log(`Ensuring Duffel identity for ${userId ? `user ${userId}` : 'guest'} with provided data: ${JSON.stringify(providedData)}`);
    
    let customerId: string | null = null;

    // 1. Get user from DB if userId exists
    if (userId) {
      const user = await this.usersService.findById(userId);
      customerId = user.duffelCustomerId;
    }

    // 2. If no customer ID (guest or user without ID), create one in Duffel
    if (!customerId) {
        this.logger.log(`No Duffel customer ID found, creating one using ${providedData ? 'provided payload' : 'defaults'}...`);
        
        const customer = await this.duffelProvider.createCustomer({
            email: providedData?.email || "guest@flybeth.com",
            firstName: providedData?.given_name || "Guest",
            lastName: providedData?.family_name || "User",
            phone: providedData?.phone_number || "+2340000000000",
        });

        if (!customer) {
            throw new Error("Failed to create Duffel customer");
        }

        customerId = customer.id;
        
        // Save only if it's a registered user
        if (userId) {
          await this.usersService.saveDuffelCustomerId(userId, customerId!);
        }
        
        this.logger.log(`Successfully created Duffel customer ${customerId} for ${userId ? `user ${userId}` : 'guest'}`);
    }

    if (!customerId) {
        throw new Error("Duffel customer identity not established");
    }

    // 3. Create a client key (ephemeral for frontend session)
    const clientKeyResponse = await this.duffelProvider.createClientKey(customerId);

    return {
        customerId,
        clientKey: clientKeyResponse?.client_key,
    };
  }
}
