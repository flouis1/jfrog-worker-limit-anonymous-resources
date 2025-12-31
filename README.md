# Limit Anonymous Resources Worker

JFrog Worker that limits anonymous user access to repositories containing "local" in their name (except repository "c1").

## Description

This worker intercepts `BEFORE_DOWNLOAD_REQUEST` events and blocks anonymous users from downloading artifacts from repositories whose name contains "local" (except repository "c1").

### Features

- Blocks anonymous users for repositories containing "local" (except c1)
- Works for all repository types (local, remote, virtual, federated)
- Checks both `repoPath` and `originalRepoPath` (for virtual repositories)
- Allows access to repository "c1" even for anonymous users
- Allows all authenticated users

## Installation with JFrog CLI

### Prerequisites

- JFrog CLI version 2.57.0 or higher
- Access to a JFrog Platform Cloud instance
- Access token with necessary permissions

### Installation Steps

1. **Initialize the worker** (if not already done):
```bash
jf worker init BEFORE_DOWNLOAD_REQUEST limit-anonymous-resources
```

2. **Configure connection to your JFrog Platform**:
```bash
jf config add --url=<YOUR_PLATFORM_URL> --access-token="<YOUR_TOKEN>" --interactive=false <SERVER_ID>
```

3. **Deploy the worker**:
```bash
jf worker deploy --server-id <SERVER_ID>
```

### Verify Installation

Check that the worker is deployed and active:
```bash
jf worker ls --server-id <SERVER_ID> | grep limit-anonymous-resources
```

You should see: `limit-anonymous-resources,BEFORE_DOWNLOAD_REQUEST,...,true`

## Configuration

### Modify Monitored Repositories

Edit the `manifest.json` file:

```json
{
  "filterCriteria": {
    "artifactFilterCriteria": {
      "repoKeys": ["*"]
    }
  }
}
```

**Options:**
- `["*"]` : Monitors all repositories
- `["repo1", "repo2"]` : Monitors only specified repositories
- `[]` : Monitors no repositories (disabled)

### Modify Blocked Repositories

To change the blocking logic (e.g., block other patterns), modify `worker.ts`:

```typescript
// Lines 53-54: Modify the detection logic
const containsLocal = repoKey.toLowerCase().includes('local');
const isNotC1 = repoKey.toLowerCase() !== 'c1';
```

**Modification Examples:**

1. **Block all repositories containing "local" (including c1)**:
```typescript
const isNotC1 = true; // Always true
```

2. **Block multiple exceptions**:
```typescript
const exceptions = ['c1', 'c2', 'c3'];
const isNotException = !exceptions.includes(repoKey.toLowerCase());
```

3. **Block a different pattern**:
```typescript
const containsPattern = repoKey.toLowerCase().includes('your-pattern');
```

### Enable/Disable the Worker

In `manifest.json`:
```json
{
  "enabled": true,  // true = enabled, false = disabled
  "debug": true     // true = detailed logs, false = minimal logs
}
```

Then redeploy:
```bash
jf worker deploy --server-id <SERVER_ID>
```

## Testing

### Test 1: Dry-run (Simulation)

Test the worker without deploying it:

```bash
# Test with anonymous user
jf worker dry-run --server-id <SERVER_ID> '{
  "userContext": null,
  "metadata": {
    "repoPath": {
      "key": "test-local-repo",
      "path": "/test-file.txt",
      "id": "test-local-repo:/test-file.txt",
      "isRoot": false,
      "isFolder": false
    },
    "repoType": 1
  }
}'
```

**Expected result:** `"status": "STOP"` with blocking message

### Test 2: Real HTTP Test with Anonymous User

1. **Create a test file**:
```bash
echo "test-content" > /tmp/test-file.txt
jf rt u /tmp/test-file.txt test-local-repo/test-file.txt
```

2. **Configure permissions for anonymous access**:
   - Go to Administration > Security > Permissions
   - Create a permission to allow anonymous read access
   - Add repository `test-local-repo` to this permission

3. **Test anonymous download**:
```bash
curl -u "anonymous:" "https://<YOUR_PLATFORM_URL>/artifactory/test-local-repo/test-file.txt"
```

**Expected result:** HTTP code 409 with message:
```json
{
  "errors": [{
    "status": 409,
    "message": "BEFORE_DOWNLOAD_REQUEST Worker Event Error: Anonymous users are not allowed to download from repository: test-local-repo"
  }]
}
```

### Test 3: Verify c1 is Allowed

```bash
# Upload to c1
jf rt u /tmp/test-file.txt c1/test-file.txt

# Anonymous test
curl -u "anonymous:" "https://<YOUR_PLATFORM_URL>/artifactory/c1/test-file.txt"
```

**Expected result:** HTTP code 200 (download successful)

### Test 4: Check Logs

1. Go to your JFrog Platform
2. Workers > limit-anonymous-resources > Troubleshooting
3. Check execution logs (if `debug: true`)

## Project Structure

```
worker_thales/
├── worker.ts          # Main worker code
├── manifest.json      # Worker configuration
├── types.ts           # TypeScript types
├── package.json       # Dependencies
├── worker.spec.ts     # Unit tests
├── tsconfig.json      # TypeScript configuration
└── README.md          # This documentation
```

## Detection Logic

The worker detects an anonymous user if:
- `userContext` is `null` or `undefined`
- `userContext.id` is empty, `'anonymous'` or starts with `'anonymous@'`
- `userContext.realm` is `'anonymous'`

## Maintenance

### Update the Worker

1. Modify `worker.ts`
2. Test with `jf worker dry-run`
3. Deploy with `jf worker deploy --server-id <SERVER_ID>`

### Uninstall the Worker

```bash
jf worker rm "limit-anonymous-resources" --server-id <SERVER_ID>
```

### View Logs

Logs are available in the Troubleshooting tab of the JFrog interface if `debug: true` is enabled in `manifest.json`.

## Support

For questions or issues:
1. Check logs in the Troubleshooting tab
2. Test with `jf worker dry-run` to diagnose
3. Verify the worker is enabled: `jf worker ls`

## Production Ready

This worker is production-ready and only blocks anonymous users. All authenticated users are allowed to download from any repository.
