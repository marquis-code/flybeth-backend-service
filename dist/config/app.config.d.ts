declare const _default: (() => {
    nodeEnv: string;
    port: number;
    apiPrefix: string;
    throttle: {
        ttl: number;
        limit: number;
    };
    amadeus: {
        clientId: string;
        clientSecret: string;
        baseUrl: string;
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    nodeEnv: string;
    port: number;
    apiPrefix: string;
    throttle: {
        ttl: number;
        limit: number;
    };
    amadeus: {
        clientId: string;
        clientSecret: string;
        baseUrl: string;
    };
}>;
export default _default;
