// Array to keep track of active SSE client connections
let clients = [];

/**
 * Express middleware to handle SSE connection request
 */
function sseHandler(req, res) {
  // Set SSE-specific headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });

  // Send initial ping or connect event
  res.write(`event: connected\ndata: ${JSON.stringify({ message: "SSE connected successfully" })}\n\n`);

  // Add this client response stream to active clients list
  clients.push(res);
  console.log(`[SSE] Client connected. Active clients count: ${clients.length}`);

  // Handle client connection closing
  req.on("close", () => {
    clients = clients.filter((client) => client !== res);
    console.log(`[SSE] Client disconnected. Active clients count: ${clients.length}`);
  });
}

/**
 * Broadcast event payload to all connected SSE clients
 * @param {string} eventName
 * @param {object} data
 */
function broadcastEvent(eventName, data) {
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach((client) => {
    try {
      client.write(payload);
    } catch (err) {
      console.error("[SSE] Failed to write event to client:", err);
    }
  });
}

module.exports = {
  sseHandler,
  broadcastEvent,
};
