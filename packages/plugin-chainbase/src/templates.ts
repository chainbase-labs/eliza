export const retrieveTokenBalanceTemplate = `
Extract query parameters for fetching all erc20 token balance for a wallet address:
- **address** (string, required): The address of the wallet to which the api queries.
- **chain_id** (string, optional): Specify The chain on which token bases.
- **contract_address** (string, optional): Specify one token contract address to check of.

Provide the details in the following JSON format:
\`\`\`json
{
    "address": "<string>",
    "chain_id"?: "<string>",
    "contract_address"?: "<string>",
}
\`\`\`


Example for reading the balance of an ERC20 token:
\`\`\`json
{
    "address": "0xaC21F9e3550E525e568aC47Bc08095e7606c8B3F",
    "chain_id": "1",
    "contract_address"?: "0xdac17f958d2ee523a2206206994597c13d831ec7",
}
\`\`\`

Example for reading the balance of all ERC20 tokens on evm mainnet:
\`\`\`json
{
    "address": "0xaC21F9e3550E525e568aC47Bc08095e7606c8B3F",
}
\`\`\`

Here are the recent user messages for context:
{{recentMessages}}
`;
