---
name: security-secrets-management
description: Enforce strict security practices for secrets management, API keys, credentials, and sensitive data. Use this when generating code involving authentication, configuration, or any sensitive operations to ensure secrets are never hardcoded and environment variables are used exclusively.
---

# Security & Secrets Management

## When to Use This Skill

Apply this skill when:
- Generating code involving API keys, tokens, or credentials
- Setting up authentication (JWT, OAuth, API keys)
- Creating database connections
- Configuring external integrations
- Reviewing code for security vulnerabilities
- Setting up environment configurations

## Core Security Principles

### 🔴 CRITICAL: Never Hardcode Secrets

**❌ ABSOLUTELY FORBIDDEN:**
```ts
// NEVER DO THIS
const API_KEY = 'sk-1234567890abcdef';
const DATABASE_URL = 'postgresql://user:password@localhost/db';
const JWT_SECRET = 'my-super-secret-key';
export const STRIPE_KEY = 'sk_live_abc123';
```

**✅ ALWAYS USE ENVIRONMENT VARIABLES:**
```ts
// Backend
const apiKey = process.env.API_KEY;
const databaseUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET;

// Frontend
const apiUrl = import.meta.env.VITE_API_URL;
const appId = import.meta.env.VITE_APP_ID;
```

---

## Backend Secrets Management

### Environment Variables Setup

**File: `.env`** (NEVER commit to git)
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ube-hr

# Authentication
JWT_SECRET=your-very-long-random-secret-key-here
JWT_EXPIRY=7d
REFRESH_TOKEN_SECRET=another-long-random-secret-key
REFRESH_TOKEN_EXPIRY=30d

# External Services
STRIPE_SECRET_KEY=sk_test_abc123def456
SENDGRID_API_KEY=SG.abc123def456

# Application
NODE_ENV=development
PORT=3000
```

### Backend Secret Access Pattern

**Centralized Configuration** (`/src/config/index.ts`):
```ts
export const config = {
  // Database
  database: {
    url: process.env.DATABASE_URL,
    if (!config.database.url) {
      throw new Error('DATABASE_URL is required');
    }
  },

  // Authentication
  jwt: {
    secret: process.env.JWT_SECRET,
    expiry: process.env.JWT_EXPIRY || '7d',
  },

  // External Services
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
  },

  // Validation
  validateRequired: (vars: string[]) => {
    const missing = vars.filter(v => !process.env[v]);
    if (missing.length > 0) {
      throw new Error(`Missing required env vars: ${missing.join(', ')}`);
    }
  },
};

// Validate on startup
config.validateRequired(['DATABASE_URL', 'JWT_SECRET']);
```

**Usage in Code:**
```ts
// ✅ CORRECT: Use centralized config
import { config } from '@/config';

export class AuthService {
  generateToken(userId: string): string {
    const token = jwt.sign({ userId }, config.jwt.secret, {
      expiresIn: config.jwt.expiry,
    });
    return token;
  }
}
```

---

## Frontend Secrets Management

### Environment Variables Setup

**File: `.env.local`** (NEVER commit to git)
```bash
VITE_API_URL=http://localhost:3000/api
VITE_APP_ID=abc123
VITE_STRIPE_PUBLIC_KEY=pk_test_abc123def456
```

**File: `.env.example`** (commit to git - no actual values)
```bash
VITE_API_URL=http://localhost:3000/api
VITE_APP_ID=
VITE_STRIPE_PUBLIC_KEY=
```

### Frontend Secret Access Pattern

**Centralized Config** (`/src/config/index.ts`):
```ts
export const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_URL,
    if (!config.api.baseUrl) {
      throw new Error('VITE_API_URL is required');
    }
  },

  stripe: {
    publicKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY,
  },

  app: {
    id: import.meta.env.VITE_APP_ID,
  },

  validateRequired: (vars: string[]) => {
    const missing = vars.filter(v => !import.meta.env[`VITE_${v}`]);
    if (missing.length > 0) {
      throw new Error(`Missing required env vars: ${missing.join(', ')}`);
    }
  },
};

// Validate on app startup
config.validateRequired(['API_URL', 'APP_ID']);
```

**Usage in Component/Hook:**
```ts
// ✅ CORRECT: Use centralized config
import { config } from '@/config';

export function useApi() {
  const fetchData = async (endpoint: string) => {
    const response = await fetch(`${config.api.baseUrl}${endpoint}`);
    return response.json();
  };

  return { fetchData };
}
```

---

## .gitignore Rules

**Always ensure these files are in `.gitignore`:**

```gitignore
# Environment variables (NEVER commit)
.env
.env.local
.env.*.local
.env.development
.env.production

# API Keys and secrets
*.pem
*.key
*.secret
secrets/

# IDE secrets
.vscode/settings.json
.idea/
.DS_Store

# Build artifacts (may contain secrets)
dist/
build/
.next/
```

---

## Secret Types & Handling

### Authentication Secrets

**JWT Secrets:**
```ts
// Backend
const token = jwt.sign(payload, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRY,
});

// Never log tokens
logger.debug('Token generated'); // ✅ Good
logger.debug(`Token: ${token}`); // ❌ Bad - leaks secret
```

**Passwords & Password Hashes:**
```ts
import bcrypt from 'bcrypt';

// Hash passwords, never store plaintext
const hashedPassword = await bcrypt.hash(password, 10);

// Compare during login
const isValid = await bcrypt.compare(inputPassword, hashedPassword);
```

### API Keys & Credentials

**Third-party API Keys:**
```ts
// Backend only (never expose to frontend)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sendgrid = require('@sendgrid/mail');
sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
```

**Public vs Secret Keys:**
```ts
// Frontend can have PUBLIC keys (prefixed with VITE_)
VITE_STRIPE_PUBLIC_KEY=pk_test_abc123  // ✅ OK to expose

// Backend keeps SECRET keys in .env
STRIPE_SECRET_KEY=sk_test_def456       // ❌ Never expose
```

### Database Credentials

**Connection Strings:**
```ts
// ✅ CORRECT: From environment
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// ❌ WRONG: Hardcoded
// url: 'postgresql://user:pass@localhost/db'
```

---

## Logging & Error Handling

### Safe Logging Practices

**❌ DANGEROUS: Logging Secrets**
```ts
logger.error('Auth failed:', { token, password, apiKey }); // Leaks secrets!
logger.debug('Config:', config); // May leak secrets!
logger.info(`Connecting to ${DATABASE_URL}`); // Leaks credentials!
```

**✅ SAFE: Sanitized Logs**
```ts
logger.error('Auth failed', {
  reason: 'Invalid token',
  // Don't log the actual token
});

logger.debug('API call', {
  endpoint: '/users',
  // Don't log the API key
});

// Mask sensitive parts
const maskedKey = apiKey.substring(0, 4) + '***' + apiKey.substring(apiKey.length - 4);
logger.info('Using API key: ' + maskedKey);
```

### Error Messages

**❌ Leaks Information**
```ts
throw new Error(`Database connection failed: ${DATABASE_URL}`);
```

**✅ Safe Error Message**
```ts
logger.error('Database connection failed', { attempted: true });
throw new Error('Database connection failed. Check server logs.');
```

---

## Secrets in Different Environments

### Development
```bash
# .env.local
DATABASE_URL=postgresql://localhost/ube-hr-dev
JWT_SECRET=dev-secret-123
NODE_ENV=development
```

### Staging
```bash
# Managed by deployment platform (GitHub Secrets, AWS Secrets Manager, etc.)
DATABASE_URL=[secret from platform]
JWT_SECRET=[secret from platform]
NODE_ENV=staging
```

### Production
```bash
# Managed by deployment platform
DATABASE_URL=[secret from platform]
JWT_SECRET=[secret from platform]
STRIPE_SECRET_KEY=[secret from platform]
NODE_ENV=production
```

### CI/CD Secrets

**GitHub Actions** (`.github/workflows/deploy.yml`):
```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
  STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

**Never:**
```yaml
env:
  DATABASE_URL: postgresql://user:password@host/db  # ❌ WRONG
```

---

## Secret Rotation

### When to Rotate
- After team member leaves
- If secret is accidentally exposed
- On security audit recommendations
- Regular schedule (quarterly recommended)

### How to Rotate
```ts
// 1. Generate new secret
JWT_SECRET_NEW=new-long-random-secret

// 2. Accept both old and new during transition period
const secrets = [
  process.env.JWT_SECRET,      // old
  process.env.JWT_SECRET_NEW,  // new
];

const verified = secrets.some(secret => {
  try {
    return jwt.verify(token, secret);
  } catch {
    return false;
  }
});

// 3. After transition period, remove old secret
// Remove JWT_SECRET from .env, keep only JWT_SECRET_NEW
```

---

## Security Checklist

Before committing code:
- ✅ No hardcoded secrets in source code
- ✅ All secrets in `.env` (never committed)
- ✅ `.env` in `.gitignore`
- ✅ `.env.example` shows structure only (no values)
- ✅ Centralized config file validates required secrets
- ✅ Sensitive data never logged
- ✅ Error messages don't leak secrets
- ✅ API keys marked as public/private correctly
- ✅ Database URLs use environment variables
- ✅ JWT secrets are strong (min 32 characters)

## Validation on Startup

**Always validate secrets exist before starting:**

```ts
// Backend: app.ts or server.ts
const requiredSecrets = [
  'DATABASE_URL',
  'JWT_SECRET',
  'NODE_ENV',
];

const missing = requiredSecrets.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('✅ All secrets loaded successfully');
// Start server
```

```ts
// Frontend: main.tsx or index.tsx
const requiredEnvVars = [
  'VITE_API_URL',
];

const missing = requiredEnvVars.filter(
  key => !import.meta.env[key]
);

if (missing.length > 0) {
  throw new Error(`Missing required env vars: ${missing.join(', ')}`);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
);
```

---

## External Secrets Management Tools

### For Advanced Use Cases
- **AWS Secrets Manager**: Store and rotate secrets
- **HashiCorp Vault**: Enterprise secret management
- **1Password Secrets Automation**: Team secret sharing
- **GitHub Secrets**: Built-in for CI/CD
- **Doppler**: Secret management across environments

### Without External Tools
- Use `.env.example` as template
- Use `.env` for local development
- Document all required secrets in README
- Share secrets through secure channels (1Password, Signal, etc.)

---

## Security Code Review Checklist

When reviewing code, reject PRs that:
- ❌ Have hardcoded secrets
- ❌ Log sensitive data
- ❌ Expose API keys in frontend
- ❌ Missing environment variable validation
- ❌ Hardcoded database credentials
- ❌ Leak error information
- ❌ Don't use centralized config

Ask author to fix before approval.

---

## Key Principles Summary

1. **Never Hardcode**: All secrets must be in environment variables
2. **Centralize**: Access secrets through config file, not directly from `process.env`
3. **Validate**: Check required secrets exist on startup
4. **Don't Log**: Never log tokens, keys, or credentials
5. **Rotate**: Regularly rotate secrets and after exposure
6. **Mask**: In logs, mask sensitive information
7. **Public vs Private**: Frontend gets only public keys
8. **Version Control**: Never commit `.env` or `.env.local`
