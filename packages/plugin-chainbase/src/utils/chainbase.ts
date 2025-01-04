import { elizaLogger } from "@elizaos/core";
import { CHAINBASE_API_URL_ENDPOINT } from "../constants";

export interface TokenWithBalance {
    name: string;
    symbol: string;
    balance: string;
    decimals: number;
    contract_address: string;
}

export interface TokenBalanceParams {
    chain_id: number;
    address: string;
    contract_address?: string;
}

export async function generateSQL(prompt: string): Promise<string> {
    try {
        const response = await fetch("http://127.0.0.1:8000/runs/wait", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                assistant_id: "6b86c502-d203-4f6b-baf6-f406c23a9421",
                input: {
                    messages: [
                        {
                            type: "human",
                            content: prompt,
                        },
                    ],
                },
            }),
        });

        const data = await response.json();
        elizaLogger.log("Generated SQL:", data.sql);
        return data.sql;
    } catch (error) {
        elizaLogger.error("Error generating SQL:", error);
        throw error;
    }
}

const POLL_INTERVAL = 1000; // 1秒
const MAX_RETRIES = 30; // 最大重试次数

// 添加新的工具函数
function getChainbaseApiKey(): string {
    const apiKey = process.env.CHAINBASE_API_KEY;
    if (!apiKey) {
        throw new Error(
            "CHAINBASE_API_KEY is not set in environment variables"
        );
    }
    return apiKey;
}

export async function executeQuery(sql: string): Promise<any> {
    try {
        const apiKey = getChainbaseApiKey();

        // 处理 SQL 中的换行符和分号
        const processedSql = sql
            .replace(/\n/g, " ") // 替换换行符为空格
            .replace(/;/g, "") // 移除分号
            .trim();

        // 1. 执行查询
        elizaLogger.log("Executing Chainbase query:", processedSql);
        const executeResponse = await fetch(
            `${CHAINBASE_API_URL_ENDPOINT}/query/execute`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-KEY": apiKey,
                },
                body: JSON.stringify({ sql: processedSql }),
            }
        );

        const executeData = await executeResponse.json();
        elizaLogger.log("Execute response:", executeData);
        const executionId = executeData.data[0].executionId;

        if (!executionId) {
            throw new Error("Failed to get execution_id from query execution");
        }

        // 2. 轮询获取结果
        let retries = 0;
        while (retries < MAX_RETRIES) {
            elizaLogger.log(
                `Polling results (attempt ${retries + 1}/${MAX_RETRIES})...`
            );
            const resultResponse = await fetch(
                `${CHAINBASE_API_URL_ENDPOINT}/execution/${executionId}/results`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "X-API-KEY": apiKey,
                    },
                }
            );

            const response = await resultResponse.json();
            elizaLogger.log("Poll response:", response);

            // 如果查询失败，立即返回错误
            if (response.data.status === "FAILED") {
                throw new Error(
                    response.data.message || "Query failed with unknown error"
                );
            }

            // 如果查询完成，返回结果
            if (response.data.status === "FINISHED") {
                elizaLogger.log("Query succeeded:", response.data);
                return {
                    columns: response.data.columns,
                    data: response.data.data,
                    totalRows: response.data.total_row_count,
                };
            }

            // 等待指定时间后继续查询
            await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
            retries++;
        }

        throw new Error("Query timeout after 30 seconds");
    } catch (error) {
        elizaLogger.error("Error executing Chainbase query:", error);
        throw error;
    }
}

export async function getTokenBalances(
    params: TokenBalanceParams
): Promise<TokenWithBalance[]> {
    try {
        const apiKey = getChainbaseApiKey();

        elizaLogger.log("Fetching token balances:", params);

        const response = await fetch(
            `${CHAINBASE_API_URL_ENDPOINT}/account/tokens?chain_id=${params.chain_id}&address=${params.address}&limit=100`,
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

        if (!data) {
            throw new Error("No data returned from Chainbase API");
        }

        elizaLogger.log("Token balances retrieved:", data);

        // 过滤掉没有名称和符号的代币
        return data.filter(
            (token) => !(token.name.length === 0 && token.symbol.length === 0)
        );
    } catch (error) {
        elizaLogger.error("Error fetching token balances:", error);
        throw error;
    }
}

export function formatTokenBalance(token: TokenWithBalance): string {
    const balance = parseFloat(token.balance) / Math.pow(10, token.decimals);
    return `${balance.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${token.symbol} (${token.name})`;
}
