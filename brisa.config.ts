import type { Configuration } from "brisa";
import vercelAdapter from "brisa-adapter-vercel";

export default {
    output: "static",
    outputAdapter: vercelAdapter()
} satisfies Configuration;