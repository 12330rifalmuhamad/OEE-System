// Group clients by lineId, e.g., { "1": [res1, res2], "global": [res3] }
let clientsByLine = {};

/**
 * Express middleware to handle SSE connection request
 */
function sseHandler(req, res) {
  const lineId = req.query.lineId || "global";

  // Set SSE-specific headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });

  // Send initial ping or connect event
  res.write(`event: connected\ndata: ${JSON.stringify({ message: `SSE connected successfully for Line ${lineId}` })}\n\n`);

  // Add this client response stream to active clients list for the specific line
  if (!clientsByLine[lineId]) {
    clientsByLine[lineId] = [];
  }
  clientsByLine[lineId].push(res);
  // console.log(`[SSE] Client connected for Line [${lineId}]. Active clients for this line: ${clientsByLine[lineId].length}`);

  // Handle client connection closing
  req.on("close", () => {
    if (clientsByLine[lineId]) {
      clientsByLine[lineId] = clientsByLine[lineId].filter((client) => client !== res);
      // console.log(`[SSE] Client disconnected for Line [${lineId}]. Active clients for this line: ${clientsByLine[lineId].length}`);
    }
  });
}

/**
 * Broadcast event payload to connected SSE clients
 * @param {string} eventName
 * @param {object} data
 * @param {string|number} lineId - Optional line ID to isolate the broadcast
 */
function broadcastEvent(eventName, data, lineId = null) {
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;

  let targets = [];
  if (lineId) {
    const lineIdStr = String(lineId);
    const lineClients = clientsByLine[lineIdStr] || [];
    const globalClients = clientsByLine["global"] || [];
    // Combine line-specific and global subscribers
    const targetSet = new Set([...lineClients, ...globalClients]);
    targets = Array.from(targetSet);
  } else {
    // Broadcast to all clients on all lines
    Object.keys(clientsByLine).forEach((lId) => {
      (clientsByLine[lId] || []).forEach((client) => {
        if (!targets.includes(client)) targets.push(client);
      });
    });
  }

  targets.forEach((client) => {
    try {
      client.write(payload);
    } catch (err) {
      console.error(`[SSE] Failed to write event to client:`, err);
    }
  });
}

module.exports = {
  sseHandler,
  broadcastEvent,
};
