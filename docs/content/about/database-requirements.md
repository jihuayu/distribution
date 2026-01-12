# Database Requirements

## Does This Application Need a Database?

**No, the Distribution Registry does not require a database by default.** The registry is designed to be database-free for simplicity and performance.

## Data Storage

### 1. **Image Data Storage**
All image layers and manifests are stored in the configured **storage backend**:

- **Filesystem** (default): Stores data on local disk
- **S3/Azure/GCS**: Cloud object storage
- **In-memory**: For testing only

Example configuration:
```yaml
storage:
  filesystem:
    rootdirectory: /var/lib/registry
```

### 2. **Metadata Caching** (Optional)

For improved performance, you can optionally use:

#### Redis Cache
Caches blob metadata to reduce storage driver calls:

```yaml
storage:
  cache:
    blobdescriptor: redis

redis:
  addr: localhost:6379
  password: ""
  db: 0
```

**Benefits:**
- Faster blob lookups
- Reduced storage driver operations
- Better performance under load

#### In-Memory Cache
Simple cache that doesn't require external services:

```yaml
storage:
  cache:
    blobdescriptor: inmemory
    blobdescriptorsize: 10000
```

### 3. **Session Management** (For Web UI)

The current web management implementation stores sessions **in-memory**. For production deployments with multiple registry instances, you should consider:

#### Option 1: External Session Store (Recommended for Production)
Use Redis for shared session storage across multiple registry instances:

```go
// Example: Update web handler to use Redis sessions
import "github.com/redis/go-redis/v9"

// Share sessions across instances using Redis
```

#### Option 2: Stateless Authentication (Future Enhancement)
Implement JWT-based authentication for stateless session management:

```yaml
webmanagement:
  enabled: true
  oauth:
    github:
      clientid: YOUR_CLIENT_ID
      clientsecret: YOUR_CLIENT_SECRET
```

## When You Might Want a Database

While not required, you might consider adding a database for:

### 1. **Advanced Features**
- **User Management**: Custom user roles and permissions
- **Audit Logging**: Detailed audit trails in a queryable format
- **Usage Analytics**: Track image pulls/pushes over time
- **Tag History**: Version history and rollback capabilities

### 2. **Example: PostgreSQL for Audit Logging**

```yaml
# Custom extension (not part of core registry)
audit:
  enabled: true
  database:
    type: postgresql
    dsn: "postgres://user:pass@localhost/registry_audit"
```

This would require custom middleware to log events to the database.

### 3. **Example: User Management Database**

For enterprise deployments with custom authentication:

```yaml
auth:
  database:
    type: postgresql
    dsn: "postgres://user:pass@localhost/registry_users"
```

## Current Implementation

The web management interface currently:

✅ **Does NOT require a database**
- Sessions stored in-memory (single instance)
- Configuration from YAML files
- Image data in storage backend
- Optional Redis for blob cache only

⚠️ **Limitations without Database:**
- Sessions lost on restart
- No persistent user management
- No audit trail storage
- Can't share sessions across instances

## Recommendations by Deployment Size

### Small Deployment (< 10 users)
- ✅ **No database needed**
- Use filesystem storage
- In-memory cache is sufficient
- In-memory sessions are fine

### Medium Deployment (10-100 users)
- ✅ **Still no database required**
- Use Redis for blob cache (optional)
- Consider Redis for sessions if running multiple instances
- Use cloud storage (S3/Azure/GCS)

### Large Deployment (100+ users)
- ⚠️ **Consider adding database for:**
  - Advanced audit logging
  - User management
  - Analytics and reporting
- Use Redis for:
  - Blob descriptor cache
  - Session storage (multiple instances)
- Use cloud storage with CDN

## Summary

**For most use cases, no database is needed.** The registry is designed to be lightweight and database-free. If you need advanced features like detailed audit logs or custom user management, you can add a database as an optional enhancement, but it's not required for core registry functionality.

The web management interface works perfectly without a database for viewing registry status, browsing repositories, and managing basic operations.
