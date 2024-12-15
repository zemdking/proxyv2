export const config = {
  api: {
    bodyParser: false, // Disable body parsing for raw requests
  },
};

export default async function handler(req, res) {
  const targetBaseUrl = "https://www.thc.org";

  const targetUrl = `${targetBaseUrl}${req.url}`;
  const bodyChunks = [];

  req.on("data", (chunk) => bodyChunks.push(chunk));
  req.on("end", async () => {
    try {
      const requestBody = Buffer.concat(bodyChunks);

      const proxyResponse = await fetch(targetUrl, {
        method: req.method,
        headers: {
          ...req.headers,
          host: new URL(targetBaseUrl).host, // Ensure proper Host header
        },
        body: req.method !== "GET" && req.method !== "HEAD" ? requestBody : undefined,
      });

      // Relay response headers and status
      res.status(proxyResponse.status);
      proxyResponse.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });

      // Stream response body
      const responseBody = await proxyResponse.buffer();
      res.send(responseBody);
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).json({ error: "An error occurred during proxying." });
    }
  });
}
