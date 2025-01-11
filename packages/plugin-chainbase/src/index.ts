import { Plugin } from "@elizaos/core";
import { retrieveTokenBalance } from "./actions/retrieveTokenBalance";
import { ChainbaseService } from "./services/ChainbaseService";

export const chainbasePlugin: Plugin = {
    name: "chainbase",
    description: "Chainbase Plugin for Eliza",
    actions: [retrieveTokenBalance],
    services: [new ChainbaseService()],
};
