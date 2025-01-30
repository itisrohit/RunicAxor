import client from 'prom-client';

const registry = new client.Registry();
client.collectDefaultMetrics({ registry });

export const executionMetrics = {
  duration: new client.Histogram({
    name: 'code_execution_duration_seconds',
    help: 'Execution time by language',
    labelNames: ['language'],
    buckets: [0.1, 0.5, 1, 2, 5]
  }),
  success: new client.Counter({
    name: 'code_execution_success_total',
    help: 'Total successful executions',
    labelNames: ['language']
  }),
  errors: new client.Counter({
    name: 'code_execution_errors_total',
    help: 'Total execution errors',
    labelNames: ['language', 'error_type']
  })
};

export async function metricsEndpoint(req, res) {
  res.set('Content-Type', registry.contentType);
  res.end(await registry.metrics());
}