#!/usr/bin/env tsx

/**
 * Redis and BullMQ Connection Test Script
 *
 * This script tests:
 * 1. Redis connectivity
 * 2. Basic Redis operations
 * 3. BullMQ queue creation and job processing
 * 4. Worker functionality
 *
 * Usage:
 *   npm run test:redis
 *   or
 *   tsx scripts/test-redis-connection.ts
 */

import Redis from 'ioredis';
import { Queue, Worker, QueueScheduler } from 'bullmq';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Helper functions for colored output
const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg: string) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
};

// Test configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const TEST_QUEUE_NAME = 'test-queue';
const TEST_TIMEOUT = 30000; // 30 seconds

// Track test results
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
};

/**
 * Run a test and track results
 */
async function runTest(name: string, testFn: () => Promise<void>): Promise<boolean> {
  testResults.total++;
  try {
    log.info(`Testing: ${name}...`);
    await testFn();
    log.success(`${name}`);
    testResults.passed++;
    return true;
  } catch (error: any) {
    log.error(`${name}: ${error.message}`);
    testResults.failed++;
    return false;
  }
}

/**
 * Test 1: Basic Redis Connection
 */
async function testRedisConnection(redis: Redis): Promise<void> {
  const result = await redis.ping();
  if (result !== 'PONG') {
    throw new Error('Redis PING did not return PONG');
  }
}

/**
 * Test 2: Redis Read/Write Operations
 */
async function testRedisReadWrite(redis: Redis): Promise<void> {
  const testKey = 'snapregister:test:key';
  const testValue = 'test-value-' + Date.now();

  // Write
  await redis.set(testKey, testValue);

  // Read
  const retrievedValue = await redis.get(testKey);
  if (retrievedValue !== testValue) {
    throw new Error(`Expected ${testValue}, got ${retrievedValue}`);
  }

  // Cleanup
  await redis.del(testKey);
}

/**
 * Test 3: Redis Data Structures
 */
async function testRedisDataStructures(redis: Redis): Promise<void> {
  const hashKey = 'snapregister:test:hash';
  const listKey = 'snapregister:test:list';
  const setKey = 'snapregister:test:set';

  try {
    // Test Hash
    await redis.hset(hashKey, 'field1', 'value1');
    const hashValue = await redis.hget(hashKey, 'field1');
    if (hashValue !== 'value1') {
      throw new Error('Hash operation failed');
    }

    // Test List
    await redis.rpush(listKey, 'item1', 'item2');
    const listLength = await redis.llen(listKey);
    if (listLength !== 2) {
      throw new Error('List operation failed');
    }

    // Test Set
    await redis.sadd(setKey, 'member1', 'member2');
    const setSize = await redis.scard(setKey);
    if (setSize !== 2) {
      throw new Error('Set operation failed');
    }
  } finally {
    // Cleanup
    await redis.del(hashKey, listKey, setKey);
  }
}

/**
 * Test 4: Redis Server Info
 */
async function testRedisInfo(redis: Redis): Promise<void> {
  const info = await redis.info('server');
  if (!info.includes('redis_version')) {
    throw new Error('Failed to retrieve Redis server info');
  }
}

/**
 * Test 5: BullMQ Queue Creation
 */
async function testBullMQQueueCreation(connection: Redis): Promise<Queue> {
  const queue = new Queue(TEST_QUEUE_NAME, {
    connection: connection.duplicate(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    },
  });

  // Verify queue is accessible
  await queue.getJobCounts();

  return queue;
}

/**
 * Test 6: BullMQ Job Creation
 */
async function testBullMQJobCreation(queue: Queue): Promise<string> {
  const job = await queue.add(
    'test-job',
    {
      type: 'test',
      message: 'This is a test job',
      timestamp: new Date().toISOString(),
    },
    {
      jobId: `test-job-${Date.now()}`,
    }
  );

  if (!job.id) {
    throw new Error('Failed to create job');
  }

  return job.id;
}

/**
 * Test 7: BullMQ Worker Processing
 */
async function testBullMQWorkerProcessing(
  connection: Redis,
  queue: Queue,
  jobId: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      worker.close();
      reject(new Error('Worker timeout - job was not processed'));
    }, TEST_TIMEOUT);

    const worker = new Worker(
      TEST_QUEUE_NAME,
      async (job) => {
        if (job.id === jobId) {
          clearTimeout(timeout);
          return { success: true, processedAt: new Date().toISOString() };
        }
        return { success: false };
      },
      {
        connection: connection.duplicate(),
        concurrency: 1,
      }
    );

    worker.on('completed', async (job) => {
      if (job.id === jobId) {
        await worker.close();
        resolve();
      }
    });

    worker.on('failed', async (job, error) => {
      if (job?.id === jobId) {
        await worker.close();
        clearTimeout(timeout);
        reject(error);
      }
    });
  });
}

/**
 * Test 8: BullMQ Queue Cleanup
 */
async function testBullMQCleanup(queue: Queue): Promise<void> {
  // Clean up completed and failed jobs
  await queue.clean(0, 100, 'completed');
  await queue.clean(0, 100, 'failed');

  // Obliterate the test queue
  await queue.obliterate();
}

/**
 * Display Redis server information
 */
async function displayRedisInfo(redis: Redis): Promise<void> {
  log.section('Redis Server Information');

  try {
    const serverInfo = await redis.info('server');
    const memoryInfo = await redis.info('memory');
    const clientsInfo = await redis.info('clients');

    const extractValue = (info: string, key: string): string => {
      const match = info.match(new RegExp(`${key}:(.+)`));
      return match ? match[1].trim() : 'N/A';
    };

    console.log(`  Redis Version: ${extractValue(serverInfo, 'redis_version')}`);
    console.log(`  OS: ${extractValue(serverInfo, 'os')}`);
    console.log(`  Uptime: ${extractValue(serverInfo, 'uptime_in_seconds')} seconds`);
    console.log(`  Memory Used: ${extractValue(memoryInfo, 'used_memory_human')}`);
    console.log(`  Connected Clients: ${extractValue(clientsInfo, 'connected_clients')}`);

    // Check for existing BullMQ queues
    const queueKeys = await redis.keys('bull:*:meta');
    if (queueKeys.length > 0) {
      console.log(`\n  Existing BullMQ Queues:`);
      for (const key of queueKeys) {
        const queueName = key.replace('bull:', '').replace(':meta', '');
        console.log(`    - ${queueName}`);
      }
    } else {
      console.log(`\n  No existing BullMQ queues found`);
    }
  } catch (error: any) {
    log.warning(`Failed to retrieve detailed info: ${error.message}`);
  }
}

/**
 * Display environment configuration
 */
function displayEnvironmentConfig(): void {
  log.section('Environment Configuration');

  const vars = [
    'REDIS_URL',
    'REDIS_HOST',
    'REDIS_PORT',
    'REDIS_PASSWORD',
  ];

  for (const varName of vars) {
    const value = process.env[varName];
    if (value) {
      // Mask password
      const displayValue = varName === 'REDIS_PASSWORD'
        ? '*'.repeat(value.length)
        : value;
      console.log(`  ${varName}: ${displayValue}`);
    } else {
      console.log(`  ${varName}: ${colors.yellow}Not set${colors.reset}`);
    }
  }

  if (!process.env.REDIS_URL) {
    log.warning('REDIS_URL not set, using default: redis://localhost:6379');
  }
}

/**
 * Display test summary
 */
function displayTestSummary(): void {
  log.section('Test Summary');

  console.log(`  Total Tests: ${testResults.total}`);
  console.log(`  ${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${testResults.failed}${colors.reset}`);

  if (testResults.failed === 0) {
    console.log(`\n  ${colors.green}${colors.bright}All tests passed!${colors.reset}`);
  } else {
    console.log(`\n  ${colors.red}${colors.bright}Some tests failed.${colors.reset}`);
  }
}

/**
 * Main test execution
 */
async function main(): Promise<void> {
  console.log(`${colors.bright}${colors.cyan}`);
  console.log('========================================');
  console.log('  Redis & BullMQ Connection Test');
  console.log('  SnapRegister Backend');
  console.log('========================================');
  console.log(colors.reset);

  // Display configuration
  displayEnvironmentConfig();

  let redis: Redis | null = null;
  let queue: Queue | null = null;
  let jobId: string | null = null;

  try {
    // Create Redis connection
    log.section('Connecting to Redis');
    log.info(`Connection URL: ${REDIS_URL}`);

    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      enableOfflineQueue: true,
    });

    // Wait for connection
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Redis connection timeout'));
      }, 5000);

      redis!.on('ready', () => {
        clearTimeout(timeout);
        resolve();
      });

      redis!.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    log.success('Connected to Redis');

    // Display Redis information
    await displayRedisInfo(redis);

    // Run tests
    log.section('Running Tests');

    // Test 1: Basic connection
    await runTest('Redis PING/PONG', () => testRedisConnection(redis!));

    // Test 2: Read/Write
    await runTest('Redis Read/Write operations', () => testRedisReadWrite(redis!));

    // Test 3: Data structures
    await runTest('Redis data structures (Hash, List, Set)', () =>
      testRedisDataStructures(redis!)
    );

    // Test 4: Server info
    await runTest('Redis server info retrieval', () => testRedisInfo(redis!));

    // Test 5: BullMQ queue creation
    const queueResult = await runTest('BullMQ queue creation', async () => {
      queue = await testBullMQQueueCreation(redis!);
    });

    if (queueResult && queue) {
      // Test 6: Job creation
      const jobResult = await runTest('BullMQ job creation', async () => {
        jobId = await testBullMQJobCreation(queue!);
      });

      if (jobResult && jobId) {
        // Test 7: Worker processing
        await runTest('BullMQ worker processing', () =>
          testBullMQWorkerProcessing(redis!, queue!, jobId!)
        );
      }

      // Test 8: Cleanup
      await runTest('BullMQ queue cleanup', () => testBullMQCleanup(queue!));
    }

    // Display summary
    displayTestSummary();

    // Exit with appropriate code
    if (testResults.failed === 0) {
      log.section('Next Steps');
      console.log(`  ${colors.blue}1.${colors.reset} Start the worker: ${colors.cyan}npm run worker:dev${colors.reset}`);
      console.log(`  ${colors.blue}2.${colors.reset} Run your application: ${colors.cyan}npm run dev${colors.reset}`);
      console.log(`  ${colors.blue}3.${colors.reset} Test warranty notifications in the app`);
      console.log('');

      process.exit(0);
    } else {
      log.section('Troubleshooting');
      console.log(`  See ${colors.cyan}website/docs/REDIS_SETUP.md${colors.reset} for troubleshooting help`);
      console.log('');

      process.exit(1);
    }
  } catch (error: any) {
    log.error(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    // Cleanup connections
    if (queue) {
      try {
        await queue.close();
      } catch (error) {
        // Ignore cleanup errors
      }
    }

    if (redis) {
      try {
        await redis.quit();
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (error: any) => {
  log.error(`Unhandled rejection: ${error.message}`);
  console.error(error);
  process.exit(1);
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  log.warning('Interrupted by user');
  process.exit(130);
});

// Run main function
main();
