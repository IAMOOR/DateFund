import { performance } from 'perf_hooks';

async function mockSetDocSequential(docs: any[]) {
  for (const doc of docs) {
    // Simulating network latency
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

async function mockSetDocPromiseAll(docs: any[]) {
  const promises = docs.map(doc => {
    return new Promise(resolve => setTimeout(resolve, 10));
  });
  await Promise.all(promises);
}

async function runBenchmark() {
  const docs = Array.from({ length: 50 }).map((_, i) => ({ id: i }));

  const startSeq = performance.now();
  await mockSetDocSequential(docs);
  const endSeq = performance.now();
  console.log(`Sequential baseline: ${(endSeq - startSeq).toFixed(2)} ms`);

  const startPar = performance.now();
  await mockSetDocPromiseAll(docs);
  const endPar = performance.now();
  console.log(`Promise.all optimized: ${(endPar - startPar).toFixed(2)} ms`);
}

runBenchmark();
