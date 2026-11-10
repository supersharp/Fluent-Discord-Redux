// Dump every CSS rule the Discord renderer has applied, concatenated into one
// file. This includes runtime-injected CSS (CSS-in-JS), not just the <link>
// assets, so it is the authoritative class list for the running client.
//
// Usage:
//   node scripts/discord-debug/dump-css.mjs "$TEMP/discord-live.css"
//
// The resulting file is a useful input for grep / class-mapping scripts.

import http from "node:http";
import fs from "node:fs";

const outFile = process.argv[2];
if (!outFile) {
    console.error("Usage: node dump-css.mjs <output-file>");
    process.exit(1);
}

const EXPRESSION = `(() => {
    const chunks = [];
    for (const sheet of document.styleSheets) {
        try {
            for (const rule of sheet.cssRules) chunks.push(rule.cssText);
        } catch (error) {
            // Cross-origin sheets cannot be read; Discord's own assets are same-origin.
        }
    }
    return chunks.join("\\n");
})()`;

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
            params: { expression: EXPRESSION, returnByValue: true },
        }));

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.id !== 1) return;

            const result = message.result;
            if (result.exceptionDetails) {
                console.error("EXCEPTION:", result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
                process.exitCode = 1;
            } else {
                const css = result.result.value;
                fs.writeFileSync(outFile, css);
                console.log(`wrote ${css.length} chars to ${outFile}`);
            }
            ws.close();
        };
    });
}).on("error", (error) => {
    console.error(`CDP request failed: ${error.message}`);
    process.exit(1);
});
