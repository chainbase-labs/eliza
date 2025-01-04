import {
    Action,
    IAgentRuntime,
    Memory,
    State,
    HandlerCallback,
    elizaLogger,
} from "@elizaos/core";
import { generateSQL, executeQuery } from "../utils/chainbase";

export const queryBlockChainData: Action = {
    name: "QUERY_BLOCKCHAIN_DATA",
    similes: ["ANALYZE_BLOCKCHAIN", "GET_CHAIN_DATA"],
    description: "Query blockchain data using natural language",
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
            // Generate SQL from natural language
            const sql = await generateSQL(message.content.text);

            // Execute query on Chainbase
            const result = await executeQuery(sql);

            // Format the results in a more readable way
            let formattedResponse = `📊 Query Results\n\n`;
            formattedResponse += `🔍 SQL Query:\n${sql}\n\n`;

            if (result.columns && result.data) {
                formattedResponse += `📋 Data:\n`;

                // Create a table header
                const headers = result.columns.map(
                    (col: any) => col.name || "Column"
                );

                // Format each row of data
                const rows = result.data.map((row: any[]) => {
                    return row.map((value: any) => {
                        if (typeof value === "number") {
                            // Format numbers with commas and up to 4 decimal places
                            return Number(value).toLocaleString(undefined, {
                                maximumFractionDigits: 4,
                            });
                        }
                        return String(value);
                    });
                });

                // Create table-like format
                const table = [headers, ...rows]
                    .map((row) => `| ${row.join(" | ")} |`)
                    .join("\n");

                formattedResponse += `\n${table}\n`;

                // Add total rows if available
                if (result.totalRows) {
                    formattedResponse += `\n📈 Total Rows: ${result.totalRows}`;
                }
            } else {
                formattedResponse += `No data returned from query.`;
            }

            callback({
                text: formattedResponse,
            });
        } catch (error) {
            elizaLogger.error("Error in queryChainbase action:", error);
            callback({
                text: `❌ Error: ${error instanceof Error ? error.message : "An unknown error occurred while querying the blockchain data."}\n\nPlease try rephrasing your question.`,
            });
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Calculate the average transaction gas used within per block on ETH in the past 1 minute.",
                },
            },
        ],
    ],
};
