export default async function handler(req, res) {
  const targetBaseUrl = "https://www.thc.org"; // Replace with your target domain
  const targetUrl = `${targetBaseUrl}${req.url.replace('/api', '')}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        host: new URL(targetBaseUrl).host, // Ensures proper host headers for the target
      },
      body: req.method !== "GET" && req.method !== "HEAD" ? req.body : null,
    });

    // Relay headers from the target response
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Send the status and body of the response
    const responseData = await response.buffer();
    res.status(response.status).send(responseData);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ message: "An error occurred while proxying the request." });
  }
}
