# Redis Setup Guide for SnapRegister

This guide will help you set up Redis for the SnapRegister backend to enable BullMQ job queues for warranty notifications and background processing.

## Table of Contents

- [What is Redis?](#what-is-redis)
- [Installation Options](#installation-options)
  - [Windows Setup](#windows-setup)
  - [macOS Setup](#macos-setup)
  - [Docker Setup (Recommended)](#docker-setup-recommended)
- [Verifying Redis Installation](#verifying-redis-installation)
- [Environment Variables](#environment-variables)
- [Testing the Connection](#testing-the-connection)
- [Production Considerations](#production-considerations)
- [Troubleshooting](#troubleshooting)

## What is Redis?

Redis is an in-memory data structure store used as a database, cache, and message broker. SnapRegister uses Redis to power BullMQ job queues that handle:

- Warranty expiration notifications
- Daily warranty status updates
- Email notification scheduling
- Background job processing

## Installation Options

### Windows Setup

#### Option 1: WSL (Windows Subsystem for Linux) - Recommended

1. **Install WSL** (if not already installed):
   ```powershell
   wsl --install
   ```

2. **Update packages in WSL**:
   ```bash
   sudo apt update
   sudo apt upgrade
   ```

3. **Install Redis**:
   ```bash
   sudo apt install redis-server
   ```

4. **Configure Redis to start automatically**:
   ```bash
   sudo service redis-server start
   ```

5. **Verify installation**:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

6. **Auto-start Redis on WSL boot** (optional):
   Add to your `~/.bashrc`:
   ```bash
   echo "sudo service redis-server start" >> ~/.bashrc
   ```

#### Option 2: Native Windows (Memurai)

Memurai is a Redis-compatible server for Windows:

1. Download Memurai from [https://www.memurai.com/](https://www.memurai.com/)
2. Run the installer
3. Start Memurai from Windows Services or the Start Menu
4. Use `memurai-cli ping` to verify

**Note**: Memurai has a free developer edition with some limitations.

#### Option 3: Docker (see Docker Setup section)

### macOS Setup

#### Option 1: Homebrew (Recommended)

1. **Install Homebrew** (if not already installed):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install Redis**:
   ```bash
   brew install redis
   ```

3. **Start Redis as a service**:
   ```bash
   brew services start redis
   ```

4. **Verify installation**:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

5. **Check Redis status**:
   ```bash
   brew services list
   ```

#### Option 2: Docker (see Docker Setup section)

### Docker Setup (Recommended)

Docker provides the most consistent Redis experience across all platforms.

#### Prerequisites

- Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Ensure Docker is running

#### Quick Start with Docker Compose

1. **Create `docker-compose.yml`** in your project root (if not exists):
   ```yaml
   version: '3.8'

   services:
     redis:
       image: redis:7-alpine
       container_name: snapregister-redis
       ports:
         - "6379:6379"
       volumes:
         - redis-data:/data
       command: redis-server --appendonly yes
       healthcheck:
         test: ["CMD", "redis-cli", "ping"]
         interval: 10s
         timeout: 3s
         retries: 3
       restart: unless-stopped

   volumes:
     redis-data:
   ```

2. **Start Redis**:
   ```bash
   docker-compose up -d redis
   ```

3. **Verify Redis is running**:
   ```bash
   docker ps
   docker exec snapregister-redis redis-cli ping
   # Should return: PONG
   ```

4. **View Redis logs**:
   ```bash
   docker logs snapregister-redis
   ```

5. **Stop Redis**:
   ```bash
   docker-compose down
   ```

#### Standalone Docker Command

If you prefer not to use Docker Compose:

```bash
docker run -d \
  --name snapregister-redis \
  -p 6379:6379 \
  -v redis-data:/data \
  redis:7-alpine redis-server --appendonly yes
```

## Verifying Redis Installation

### Basic Connectivity Test

```bash
redis-cli ping
```
Expected output: `PONG`

### Connection with Redis CLI

```bash
redis-cli
127.0.0.1:6379> SET test "Hello Redis"
127.0.0.1:6379> GET test
"Hello Redis"
127.0.0.1:6379> DEL test
127.0.0.1:6379> exit
```

### Using the Test Script

Run our custom test script:

```bash
npm run test:redis
# or
tsx scripts/test-redis-connection.ts
```

This will:
- Test Redis connection
- Create a test BullMQ job
- Verify queue functionality
- Clean up test data

## Environment Variables

Create a `.env.local` file in the `website` directory with these Redis configuration variables:

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Optional: Redis connection pool settings
REDIS_MAX_RETRIES_PER_REQUEST=null
REDIS_ENABLE_READY_CHECK=true
REDIS_ENABLE_OFFLINE_QUEUE=true
```

### Environment Variable Descriptions

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REDIS_URL` | Complete Redis connection string | `redis://localhost:6379` | Yes |
| `REDIS_HOST` | Redis server hostname | `localhost` | No* |
| `REDIS_PORT` | Redis server port | `6379` | No* |
| `REDIS_PASSWORD` | Redis authentication password | (empty) | No |
| `REDIS_MAX_RETRIES_PER_REQUEST` | Max retry attempts per request | `null` (unlimited) | No |
| `REDIS_ENABLE_READY_CHECK` | Enable ready state checking | `true` | No |
| `REDIS_ENABLE_OFFLINE_QUEUE` | Queue commands when disconnected | `true` | No |

*Not required if `REDIS_URL` is provided

### Production Redis URLs

For production environments, use managed Redis services:

**Railway**:
```bash
REDIS_URL=redis://default:password@redis.railway.app:6379
```

**Redis Cloud**:
```bash
REDIS_URL=redis://default:password@redis-12345.c1.us-east-1-2.ec2.cloud.redislabs.com:12345
```

**Upstash**:
```bash
REDIS_URL=redis://default:password@gusc1-charming-fish-12345.upstash.io:6379
```

**AWS ElastiCache**:
```bash
REDIS_URL=redis://master.redis-cluster.abc123.use1.cache.amazonaws.com:6379
```

### Connecting to Remote Redis

If Redis requires authentication:

```bash
REDIS_URL=redis://:your-password@hostname:6379
# or
REDIS_URL=redis://username:password@hostname:6379
```

For SSL/TLS connections:

```bash
REDIS_URL=rediss://username:password@hostname:6380
```

## Testing the Connection

### Method 1: Using npm script

```bash
npm run test:redis
```

### Method 2: Manual test with Node.js

Create a test file `test-redis.js`:

```javascript
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redis.on('connect', () => {
  console.log('✓ Connected to Redis');
});

redis.on('error', (err) => {
  console.error('✗ Redis connection error:', err);
});

// Test set/get
redis.set('test-key', 'test-value')
  .then(() => redis.get('test-key'))
  .then((value) => {
    console.log('✓ Redis read/write test:', value);
    return redis.del('test-key');
  })
  .then(() => {
    console.log('✓ All tests passed');
    redis.quit();
    process.exit(0);
  })
  .catch((err) => {
    console.error('✗ Test failed:', err);
    process.exit(1);
  });
```

Run with:
```bash
node test-redis.js
```

### Method 3: Testing BullMQ Integration

```bash
# Start the worker
npm run worker:dev

# In another terminal, trigger a test job
tsx scripts/test-redis-connection.ts
```

## Production Considerations

### Security

1. **Enable authentication**:
   ```bash
   # In redis.conf
   requirepass your-strong-password
   ```

2. **Bind to specific interface**:
   ```bash
   # In redis.conf
   bind 127.0.0.1 ::1  # localhost only
   # or
   bind 0.0.0.0  # all interfaces (use with caution)
   ```

3. **Enable SSL/TLS**:
   Use Redis 6+ with TLS support or a managed service with SSL

4. **Firewall rules**:
   Only allow connections from your application servers

### Performance

1. **Persistence configuration**:
   ```bash
   # Append-only file (AOF) for durability
   appendonly yes
   appendfsync everysec

   # RDB snapshots
   save 900 1
   save 300 10
   save 60 10000
   ```

2. **Memory management**:
   ```bash
   maxmemory 256mb
   maxmemory-policy allkeys-lru
   ```

3. **Connection pooling**:
   BullMQ automatically handles connection pooling

### Monitoring

1. **Redis INFO command**:
   ```bash
   redis-cli INFO
   ```

2. **Monitor real-time commands**:
   ```bash
   redis-cli MONITOR
   ```

3. **Check memory usage**:
   ```bash
   redis-cli INFO memory
   ```

4. **Queue monitoring**:
   Use BullMQ Board or custom monitoring dashboard

### Backup

1. **Manual backup**:
   ```bash
   redis-cli SAVE
   # or
   redis-cli BGSAVE
   ```

2. **Automated backups**:
   - Use managed Redis services with automatic backups
   - Set up cron jobs to backup dump.rdb and appendonly.aof files

### High Availability

For production systems, consider:

1. **Redis Sentinel** - Automatic failover
2. **Redis Cluster** - Horizontal scaling
3. **Managed Services** - Redis Cloud, AWS ElastiCache, etc.

## Troubleshooting

### Connection Issues

#### Error: "ECONNREFUSED"

**Problem**: Redis server is not running

**Solutions**:
```bash
# Check if Redis is running
redis-cli ping

# Start Redis (depends on your setup)
# WSL/Linux:
sudo service redis-server start

# macOS:
brew services start redis

# Docker:
docker start snapregister-redis
# or
docker-compose up -d redis
```

#### Error: "WRONGPASS invalid username-password pair"

**Problem**: Incorrect Redis password

**Solutions**:
1. Check your `REDIS_URL` in `.env.local`
2. Verify password in Redis configuration
3. For local development, remove password requirement:
   ```bash
   # In redis.conf, comment out:
   # requirepass your-password
   ```

#### Error: "NOAUTH Authentication required"

**Problem**: Redis requires authentication but no password provided

**Solutions**:
Update your `.env.local`:
```bash
REDIS_URL=redis://:your-password@localhost:6379
```

### Performance Issues

#### Slow job processing

1. Check Redis latency:
   ```bash
   redis-cli --latency
   ```

2. Increase worker concurrency in `warranty-worker.ts`

3. Check Redis memory:
   ```bash
   redis-cli INFO memory
   ```

#### Jobs stuck in queue

1. Check if workers are running:
   ```bash
   npm run worker:dev
   ```

2. View failed jobs:
   ```bash
   redis-cli LRANGE bull:warranty-notifications:failed 0 -1
   ```

3. Clear failed jobs (careful!):
   ```bash
   # Use BullMQ API or:
   redis-cli DEL bull:warranty-notifications:failed
   ```

### Docker Issues

#### Container won't start

```bash
# Check logs
docker logs snapregister-redis

# Check if port is already in use
docker ps -a

# Remove old container and recreate
docker rm snapregister-redis
docker-compose up -d redis
```

#### Data persistence issues

```bash
# Check volumes
docker volume ls

# Inspect volume
docker volume inspect redis-data

# Backup data
docker run --rm -v redis-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/redis-backup.tar.gz /data
```

### WSL Issues

#### Redis won't start in WSL

```bash
# Check Redis status
sudo service redis-server status

# View logs
sudo tail -f /var/log/redis/redis-server.log

# Restart Redis
sudo service redis-server restart

# Check if port is in use
sudo netstat -tulpn | grep 6379
```

### macOS Issues

#### Homebrew service won't start

```bash
# Check service status
brew services list

# View logs
tail -f /usr/local/var/log/redis.log

# Restart service
brew services restart redis

# Stop and start manually
brew services stop redis
redis-server /usr/local/etc/redis.conf
```

## Getting Help

If you encounter issues not covered here:

1. Check Redis logs for specific error messages
2. Review the [Redis documentation](https://redis.io/documentation)
3. Check [BullMQ documentation](https://docs.bullmq.io/)
4. Search [Stack Overflow](https://stackoverflow.com/questions/tagged/redis)
5. Check the SnapRegister issue tracker

## Quick Reference Commands

```bash
# Start Redis (choose one based on your setup)
sudo service redis-server start          # WSL/Linux
brew services start redis                 # macOS
docker-compose up -d redis               # Docker

# Test connection
redis-cli ping

# Monitor Redis
redis-cli MONITOR

# Check queue status
npm run worker:dev

# Test BullMQ integration
npm run test:redis

# View Redis keys
redis-cli KEYS "*"

# Clear all Redis data (careful!)
redis-cli FLUSHALL
```

## Next Steps

After setting up Redis:

1. Configure environment variables in `.env.local`
2. Run the test script: `npm run test:redis`
3. Start the worker: `npm run worker:dev`
4. Test warranty notifications in your application
5. Monitor job processing and adjust concurrency as needed

## Additional Resources

- [Redis Official Documentation](https://redis.io/documentation)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [ioredis Documentation](https://github.com/luin/ioredis)
- [Docker Redis Image](https://hub.docker.com/_/redis)
- [Redis Cloud Free Tier](https://redis.com/try-free/)
