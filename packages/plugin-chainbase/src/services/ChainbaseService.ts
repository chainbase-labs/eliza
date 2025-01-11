import {
    IAgentRuntime,
    ModelClass,
    Service,
    ServiceType,
    elizaLogger,
    generateText,
} from "@elizaos/core";
import { generateSQL, executeQuery } from "../libs/chainbase";
import { responsePrompt } from "../templates";

const QUERY_PREFIX = "query onchain data:";

export interface IChainbaseService extends Service {
    queryBlockchainData(message: string): Promise<string>;
}

export class ChainbaseService extends Service implements IChainbaseService {
    private runtime: IAgentRuntime;

    getInstance(): ChainbaseService {
        return this;
    }
    static get serviceType() {
        return ServiceType.CHAINBASE;
    }

    initialize(runtime: IAgentRuntime): Promise<void> {
        this.runtime = runtime;
        this.apiKey = runtime.getSetting("CHAINBASE_API_KEY");
        return Promise.resolve();
    }

    async queryBlockchainData(message: string): Promise<string> {
        try {
            const messageText = message.toLowerCase();

            if (!messageText.includes(QUERY_PREFIX)) {
                return `Please use the format: ${QUERY_PREFIX} <your natural language query>`;
            }

            const queryText = message
                .slice(
                    message.toLowerCase().indexOf(QUERY_PREFIX) +
                        QUERY_PREFIX.length
                )
                .trim();

            if (!queryText) {
                return `Please provide a specific query after '${QUERY_PREFIX}'`;
            }

            // Generate SQL from natural language
            const sql = await generateSQL(queryText);

            // Execute query on Chainbase
            const result = await executeQuery(sql);

            // Use generateText to format the response
            const formattedResponse = await generateText({
                runtime: this.runtime,
                context: responsePrompt(
                    {
                        sql,
                        columns: result.columns,
                        data: result.data,
                        totalRows: result.totalRows,
                    },
                    queryText
                ),
                modelClass: ModelClass.SMALL,
            });

            return formattedResponse;
        } catch (error) {
            elizaLogger.error("Error in ChainbaseService:", error);
            return "error";
        }
    }
}

export default ChainbaseService;
