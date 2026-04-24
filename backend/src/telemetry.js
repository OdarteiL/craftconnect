'use strict';

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');

const prometheusExporter = new PrometheusExporter(
  { port: 9464, startServer: true },
  () => console.log('Prometheus metrics available at http://localhost:9464/metrics')
);

const sdk = new NodeSDK({
  metricReader: prometheusExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false }, // too noisy
    }),
  ],
});

sdk.start();

process.on('SIGTERM', () => sdk.shutdown().finally(() => process.exit(0)));
