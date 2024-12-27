import {
    Action,
    IAgentRuntime,
    Memory,
    State,
    HandlerCallback,
} from "@elizaos/core";

export const sayHello: Action = {
    name: "SAY_HELLO_TO_CHAINBASE",
    similes: ["GREETING_CHAINBASE", "SAY_HI_TO_CHAINBASE"],
    description: "say hello to chainbase",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        // no extra validation needed
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        options?: { [key: string]: unknown },
        callback?: HandlerCallback
    ) => {
        callback({
            text: `Hello! Chainbase, how are you!`,
        });
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Let's say hello to chainbase",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Hello! Chainbase, how are you!",
                },
            },
        ],
    ],
};
