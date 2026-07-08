'use strict';

const client = require('prom-client');

// Use default registry (shared with OpenTelemetry Prometheus exporter)
const register = client.register;

// Collect default Node.js metrics (memory, CPU, event loop lag, etc.)
client.collectDefaultMetrics({ register });

// HTTP request counter
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// HTTP request duration histogram
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

// Active auctions gauge
const activeAuctionsGauge = new client.Gauge({
  name: 'craftconnect_active_auctions',
  help: 'Number of currently active auctions',
  registers: [register],
});

// Express middleware to record metrics per request
function metricsMiddleware(req, res, next) {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    const route = req.route?.path || req.path || 'unknown';
    const labels = { method: req.method, route, status_code: res.statusCode };
    httpRequestsTotal.inc(labels);
    end(labels);
  });
  next();
}

module.exports = { register, metricsMiddleware, activeAuctionsGauge };
