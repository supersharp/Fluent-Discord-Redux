// Evaluate a JavaScript expression in the Discord renderer over CDP.
//
// Usage:
//   node scripts/discord-debug/eval.mjs path/to/expression.js
//   node scripts/discord-debug/eval.mjs --expr "document.title"
//
// The expression must return a JSON-serialisable value. Output is pretty
// printed JSON. Long results can be written to a file with --out.
//
// This intentionally talks to the first "page" target only; Discord exposes a
// worker target as well, which is not the renderer we theme.

import http from "node:http";
import fs from "node:fs";

const args = process.argv.slice(2);
const outIndex = args.indexOf("--out");
const outFile = outIndex >= 0 ? args.splice(outIndex, 2)[1] : null;

let expression;
if (args[0] === "--expr") {
    expression = args[1];
} else if (args[0]) {
    expression = fs.readFileSync(args[0], "utf8");
} else {
    console.error("Usage: node eval.mjs <expression-file> [--out file]");
    process.exit(1);
}

http.get("http://127.0.0.1:9222/json/list", (res) => {
    let body = "";
    res.on("data", (chunk) => (body += chunk));
    res.on("end", () => {
        const page = JSON.parse(body).find((target) => target.type === "page");
        if (!page) {
            console.error("No page target. Is Discord running with --remote-debugging-port=9222?");
            process.exit(1);
        }

        const ws = new WebSocket(page.webSocketDebuggerUrl);
        ws.onopen = () => ws.send(JSON.stringify({
            id: 1,
            method: "Runtime.evaluate",
            params: { expression, returnByValue: true, awaitPromise: true },
        }));

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.id !== 1) return;

            const result = message.result;
            if (result.exceptionDetails) {
                console.error("EXCEPTION:", result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
                process.exitCode = 1;
            } else {
                const value = result.result.value;
                const text = JSON.stringify(value, null, 2);
                if (outFile) {
                    fs.writeFileSync(outFile, text);
                    console.log(`wrote ${text.length} chars to ${outFile}`);
                } else {
                    console.log(text);
                }
            }
            ws.close();
        };
    });
}).on("error", (error) => {
    console.error(`CDP request failed: ${error.message}`);
    process.exit(1);
});
