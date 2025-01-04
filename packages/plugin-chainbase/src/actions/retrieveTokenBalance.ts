import {
    Action,
    IAgentRuntime,
    Memory,
    State,
    HandlerCallback,
    elizaLogger,
    ModelClass,
    composeContext,
    generateObject,
} from "@elizaos/core";
import { getTokenBalances, formatTokenBalance } from "../utils/chainbase";
import { retrieveTokenBalanceTemplate } from "../templates";
import {
    RetrieveTokenBalanceReqSchema,
    isRetrieveTokenBalanceReq,
} from "../types";

export const retrieveTokenBalance: Action = {
    name: "RETRIEVE_TOKEN_BALANCE",
    similes: [
        "RETRIEVE_ALL_TOKENS",
        "FETCH_ERC20_TOKENS",
        "RETRIEVE_ERC20_TOKENS_BALANCE",
        "RETRIEVE_TOKEN_BALANCE_LIST",
    ],
    description:
        "Retrieve all token balances for all ERC20 tokens for a specified address.",

    validate: async (runtime: IAgentRuntime, message: Memory) => {
        elizaLogger.log("Validating runtime for RETRIEVE_TOKEN_BALANCE...");
        return !!(
            runtime.character.settings.secrets?.CHAINBASE_API_KEY ||
            process.env.CHAINBASE_API_KEY
        );
    },

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        options?: { [key: string]: unknown },
        callback?: HandlerCallback
    ) => {
        try {
            elizaLogger.log("Composing state for message:", message);
            if (!state) {
                state = (await runtime.composeState(message)) as State;
            } else {
                state = await runtime.updateRecentMessageState(state);
            }

            const context = composeContext({
                state,
                template: retrieveTokenBalanceTemplate,
            });

            const queryParams = await generateObject({
                runtime,
                context,
                modelClass: ModelClass.LARGE,
                schema: RetrieveTokenBalanceReqSchema,
            });

            if (!isRetrieveTokenBalanceReq(queryParams.object)) {
                callback(
                    {
                        text: "Invalid query params. Please check the inputs.",
                    },
                    []
                );
                return;
            }

            const { contract_address, address, chain_id } = queryParams.object;

            elizaLogger.log("Querying token balances:", {
                chain_id,
                address,
                contract_address,
            });
            const tokens = await getTokenBalances({
                chain_id: Number(chain_id),
                address,
                contract_address,
            });

            if (tokens.length > 0) {
                callback({
                    text: tokens.map(formatTokenBalance).join("\n"),
                });
            } else {
                callback({
                    text: `Sorry, we can't find any token balances for ${address}`,
                });
            }
        } catch (error) {
            elizaLogger.error("Error in retrieveTokenBalance:", error);
            callback({
                text: `Error retrieving token balances: ${error instanceof Error ? error.message : "Unknown error"}`,
            });
        }
    },

    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Retrieve all token balances of address 0x7719fD6A5a951746c8c26E3DFd143f6b96Db6412",
                    action: "RETRIEVE_TOKEN_BALANCE",
                },
            },
            {
                user: "assistant",
                content: {
                    text: "Sure! there're 20.25 USDT in address 0x7719fD6A5a951746c8c26E3DFd143f6b96Db6412",
                },
            },
        ],
    ],
};
