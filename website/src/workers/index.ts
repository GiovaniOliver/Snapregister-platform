// Main Worker Entry Point - Initializes all background workers

import { initializeWarrantyWorker } from './warranty-worker';

async function startWorkers() {
  console.log('Starting SnapRegister background workers...');

  try {
    // Initialize warranty worker
    await initializeWarrantyWorker();

    console.log('All workers initialized successfully!');
    console.log('Workers are running and waiting for jobs...');
  } catch (error) {
    console.error('Failed to initialize workers:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start workers
startWorkers().catch((error) => {
  console.error('Fatal error starting workers:', error);
  process.exit(1);
});
