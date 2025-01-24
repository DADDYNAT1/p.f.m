declare module "../backend/pumpTokens" {
    export function fetchPumpFunTokens(): Promise<
        Array<{ name: string; volume: number; created: string }>
    >;
}
