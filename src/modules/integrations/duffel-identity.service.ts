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
  async ensureIdentity(userId: string, providedData?: any): Promise<{ customerId: string; clientKey?: string }> {
    this.logger.log(`Ensuring Duffel identity for user ${userId} with provided data: ${JSON.stringify(providedData)}`);
    
    // 1. Get user from DB
    const user = await this.usersService.findById(userId);
    let customerId = user.duffelCustomerId;

    // 2. If no customer ID, create one in Duffel
    if (!customerId) {
        this.logger.log(`No Duffel customer ID found for user ${userId}, creating one using ${providedData ? 'provided payload' : 'DB defaults'}...`);
        
        const customer = await this.duffelProvider.createCustomer({
            email: providedData?.email || user.email,
            firstName: providedData?.given_name || user.firstName,
            lastName: providedData?.family_name || user.lastName,
            phone: providedData?.phone_number || user.phone || "+2340000000000",
        });

        if (!customer) {
            throw new Error("Failed to create Duffel customer");
        }

        customerId = customer.id;
        await this.usersService.saveDuffelCustomerId(userId, customerId);
        this.logger.log(`Successfully created Duffel customer ${customerId} for user ${userId}`);
    }

    // 3. Create a client key (ephemeral for frontend session)
    const clientKeyResponse = await this.duffelProvider.createClientKey(customerId);

    return {
        customerId,
        clientKey: clientKeyResponse?.client_key,
    };
  }
}
