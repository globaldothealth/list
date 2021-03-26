const { workerData } = require('worker_threads');

console.log(`worker spawned for ${workerData.query} by ${workerData.email}`);

