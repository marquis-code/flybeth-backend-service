// src/modules/integrations/constants/nigeria-origins.constant.ts

/**
 * IATA codes of Nigerian airports.
 *
 * Amadeus content is contracted for Nigerian-origin traffic only; every other
 * market is served by Duffel (see FlightsIntegrationService.resolveProviderNames).
 * Kept as a static set so provider routing stays synchronous and cannot fail on
 * a database or network hiccup during a search.
 */
export const NIGERIAN_AIRPORT_CODES: ReadonlySet<string> = new Set([
  // Primary international gateways
  "LOS", // Lagos — Murtala Muhammed
  "ABV", // Abuja — Nnamdi Azikiwe
  "PHC", // Port Harcourt — Omagwa
  "KAN", // Kano — Mallam Aminu Kano
  "ENU", // Enugu — Akanu Ibiam
  "ABB", // Asaba International
  "CBQ", // Calabar — Margaret Ekpo
  "QUO", // Uyo — Akwa Ibom International
  // Domestic / secondary airports
  "BNI", // Benin City
  "KAD", // Kaduna International
  "SKO", // Sokoto — Sadiq Abubakar III
  "MIU", // Maiduguri
  "YOL", // Yola
  "JOS", // Jos — Yakubu Gowon
  "ILR", // Ilorin
  "AKR", // Akure
  "IBA", // Ibadan — Alakia
  "QRW", // Warri — Osubi
  "MDI", // Makurdi
  "MXJ", // Minna
  "BCU", // Bauchi
  "GMO", // Gombe — Lawanti
  "ZAR", // Zaria
  "DKA", // Katsina
  "PHG", // Port Harcourt City
]);

/**
 * True when the given IATA code is a Nigerian airport.
 * Unknown codes are treated as non-Nigerian so we never call Amadeus blind.
 */
export function isNigerianOrigin(code?: string | null): boolean {
  if (!code) return false;
  return NIGERIAN_AIRPORT_CODES.has(code.trim().toUpperCase());
}
