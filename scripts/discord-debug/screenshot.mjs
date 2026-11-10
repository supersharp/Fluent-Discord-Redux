// Capture the current Discord page via CDP (works even when the OS window is
// hidden/minimized). Usage: node scripts/discord-debug/screenshot.mjs out.png
import http from "node:http";
import fs from "node:fs";

const out = process.argv[2] || "discord-page.png";
http.get("http://127.0.0.1:9222/json/list", (res) => {
  let body = "";
  res.on("data", (c) => (body += c));
  res.on("end", () => {
    const page = JSON.parse(body).find((t) => t.type === "page");
    if (!page) { console.error("no page target"); process.exit(1); }
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    ws.onopen = () => ws.send(JSON.stringify({ id: 1, method: "Page.captureScreenshot", params: { format: "png" } }));
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id !== 1) return;
      if (msg.result?.data) {
        fs.writeFileSync(out, Buffer.from(msg.result.data, "base64"));
        console.log(`wrote ${out}`);
      } else {
        console.error(msg.error || "capture failed");
        process.exitCode = 1;
      }
      ws.close();
    };
  });
});
