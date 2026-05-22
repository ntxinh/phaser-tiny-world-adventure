# GitHub Actions + GitHub Pages Deployment

**Date:** 2026-05-22
**Status:** Approved

## Goal

Automatically build and deploy the Phaser game to GitHub Pages on every push to `main`.

## Approach

Use official GitHub Actions for Pages (Option A):
- `actions/upload-pages-artifact` — packages the build output
- `actions/deploy-pages` — deploys via GitHub's Pages environment

No `gh-pages` branch. No 3rd-party actions. No secrets required (OIDC token via `id-token: write`).

## Files Changed

| File | Change |
|------|--------|
| `vite.config.ts` | Add `base: '/phaser-tiny-world-adventure/'` |
| `.github/workflows/deploy.yml` | New workflow file |

## Workflow Design

**Trigger:** `push` to `main` only.

**Permissions:**
```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

**Jobs:**

### `build`
1. `actions/checkout@v4`
2. `actions/setup-node@v4` — Node 20, npm cache
3. `npm ci`
4. `npm run build` — runs `tsc && vite build`, outputs to `dist/`
5. `actions/configure-pages@v5`
6. `actions/upload-pages-artifact@v3` — `path: dist`

### `deploy`
- `needs: build`
- `environment: github-pages` with `url: ${{ steps.deployment.outputs.page_url }}`
- `actions/deploy-pages@v4`

## Vite Config

```typescript
export default defineConfig({
  base: '/phaser-tiny-world-adventure/',
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

Required so asset paths resolve correctly under the Pages subdirectory.

## Manual Setup (one-time)

In GitHub repo: **Settings → Pages → Source → GitHub Actions**

Must be done before first deploy. No other repo configuration needed.

## Out of Scope

- Test runs in CI (deploy-only by design)
- PR build checks
- Custom domain
- Environment-specific builds
