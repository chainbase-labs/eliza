import { Plugin } from "@elizaos/core";
import { sayHello } from "./actions/hello";

export const chainbasePlugin: Plugin = {
    name: "Chainbase",
    description: "Chainbase Plugin for Eliza",
    actions: [sayHello],
    providers: [],
};
