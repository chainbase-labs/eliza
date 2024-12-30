import { z } from "zod";

export interface RetrieveTokenBalanceReq {
    address: `0x${string}`;
    chain_id?: string;
    contract_address?: `0x${string}`;
}

export const RetrieveTokenBalanceReqSchema = z.object({
    address: z.string(),
    chain_id: z.string().optional(),
    contract_address: z.string().optional(),
});

export const isRetrieveTokenBalanceReq = (
    obj: any
): obj is RetrieveTokenBalanceReq => {
    return RetrieveTokenBalanceReqSchema.safeParse(obj).success;
};

export interface TokenWithBalance {
    balance: string;
    symbol: string;
    name: string;
    contract_address: string;
    decimals: number;
}