const { performance } = require('perf_hooks');

const simulateNetworkLatency = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runBenchmark() {
  const numItems = 100;
  const networkDelay = 50; // 50ms simulated network latency per request

  console.log(`Simulating migration of ${numItems} items with ${networkDelay}ms network latency...\n`);

  // --- O(N) Baseline Simulation ---
  console.log("Running unoptimized version (N+1 queries)...");
  const startTimeNPlus1 = performance.now();
  for (let i = 0; i < numItems; i++) {
    // Simulating await setDoc(...)
    await simulateNetworkLatency(networkDelay);
  }
  const endTimeNPlus1 = performance.now();
  const timeNPlus1 = endTimeNPlus1 - startTimeNPlus1;
  console.log(`Unoptimized took: ${timeNPlus1.toFixed(2)}ms\n`);

  // --- Optimized Batch Simulation ---
  console.log("Running optimized version (writeBatch)...");
  const startTimeBatch = performance.now();
  let hasChanges = false;
  for (let i = 0; i < numItems; i++) {
     // Simulating batch.set (which is synchronous in memory)
     // Very fast, virtually 0 network delay here
     hasChanges = true;
  }
  if (hasChanges) {
    // Simulating await batch.commit()
    // It's just ONE network request
    await simulateNetworkLatency(networkDelay);
  }
  const endTimeBatch = performance.now();
  const timeBatch = endTimeBatch - startTimeBatch;
  console.log(`Optimized took: ${timeBatch.toFixed(2)}ms\n`);

  const improvementFactor = (timeNPlus1 / timeBatch).toFixed(2);
  console.log(`Improvement: ${improvementFactor}x faster (${(timeNPlus1 - timeBatch).toFixed(2)}ms saved for 100 items with ${networkDelay}ms latency)`);
}

runBenchmark();
