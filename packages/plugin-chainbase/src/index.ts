import { Plugin } from "@elizaos/core";
import { retrieveTokenBalance } from "./actions/retrieveTokenBalance";

export const chainbasePlugin: Plugin = {
    name: "Chainbase",
    description: "Chainbase Plugin for Eliza",
    actions: [retrieveTokenBalance],
    providers: [],
};
