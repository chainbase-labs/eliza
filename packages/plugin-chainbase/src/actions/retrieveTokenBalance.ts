import {
    Action,
    IAgentRuntime,
    Memory,
    State,
    HandlerCallback,
    elizaLogger,
    composeContext,
    generateObject,
    ModelClass,
} from "@elizaos/core";
import {
    isRetrieveTokenBalanceReq,
    RetrieveTokenBalanceReqSchema,
    TokenWithBalance,
} from "../types";
import { retrieveTokenBalanceTemplate } from "../templates";
import { CHAINBASE_API_URL_ENDPOINT } from "../constants";
import { formatTokenBalance } from "../utils";

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

        elizaLogger.log("query api:", {
            chain_id,
            address,
            ...(contract_address ? { contract_address } : {}),
        });

        const apiKey =
            runtime.getSetting("CHAINBASE_API_KEY") ??
            process.env.CHAINBASE_API_KEY;

        const response = await fetch(
            `${CHAINBASE_API_URL_ENDPOINT}/v1/account/tokens?chain_id=1&&address=${address}&&limit=100`,
            {
                method: "GET",
                headers: {
                    "x-api-key": apiKey,
                },
            }
        );

        const { data } = (await response.json()) as {
            data?: TokenWithBalance[];
        };

        if (data?.length > 0) {
            callback({
                text: data
                    .filter(
                        (token) =>
                            !(
                                token.name.length === 0 &&
                                token.symbol.length === 0
                            )
                    )
                    .map(formatTokenBalance)
                    .join("\n"),
            });
        } else {
            callback({
                text: `Sorry, we can't find the token balances for ${address}`,
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
