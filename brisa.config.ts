import type { Configuration } from "brisa";
import vercelAdapter from "brisa-adapter-vercel";

export default {
    output: "node",
    outputAdapter: vercelAdapter()
} satisfies Configuration;