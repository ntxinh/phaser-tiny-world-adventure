# GitHub Actions + GitHub Pages Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the Phaser game to GitHub Pages automatically on every push to `main` using official GitHub Actions.

**Architecture:** Two-job workflow — `build` compiles the Vite project and uploads the artifact, `deploy` publishes it via the GitHub Pages environment using OIDC (no secrets needed). Vite needs a `base` path matching the repo name so asset URLs resolve correctly under the Pages subdirectory.

**Tech Stack:** Vite 5, TypeScript, GitHub Actions, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4`

---

### Task 1: Fix Vite base path for GitHub Pages

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: Open `vite.config.ts`**

Current content:
```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

- [ ] **Step 2: Add `base` option**

Replace the file with:
```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/phaser-tiny-world-adventure/',
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

`base` must match the GitHub repo name exactly (case-sensitive). Without this, all JS/CSS/asset URLs in the built `index.html` will be absolute (`/assets/...`) and 404 on Pages since the site is served at `/phaser-tiny-world-adventure/`.

- [ ] **Step 3: Verify build still works locally**

```bash
npm run build
```

Expected: no errors, `dist/` directory created, `dist/index.html` contains asset URLs starting with `/phaser-tiny-world-adventure/assets/`.

Check:
```bash
grep 'src=' dist/index.html
```
Expected output contains `/phaser-tiny-world-adventure/assets/`.

- [ ] **Step 4: Commit**

```bash
git add vite.config.ts
git commit -m "fix: set vite base path for GitHub Pages deployment"
```

---

### Task 2: Create GitHub Actions workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create directory**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Configure Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Validate YAML syntax**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml'))" && echo "YAML valid"
```

Expected: `YAML valid`

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions workflow for GitHub Pages deployment"
```

---

### Task 3: Enable GitHub Pages in repo settings (manual)

**Files:** None — this is a GitHub UI step.

- [ ] **Step 1: Open repo settings**

Go to: `https://github.com/ntxinh/phaser-tiny-world-adventure/settings/pages`

- [ ] **Step 2: Set Pages source**

Under **Build and deployment → Source**, select **GitHub Actions**.

Save.

- [ ] **Step 3: Push to `main` and verify**

```bash
git push origin main
```

Then go to: `https://github.com/ntxinh/phaser-tiny-world-adventure/actions`

Expected: workflow named "Deploy to GitHub Pages" appears and runs. Both `build` and `deploy` jobs show green.

- [ ] **Step 4: Confirm live URL**

After deploy job completes, the Pages URL appears in the deploy job summary.

Expected URL: `https://ntxinh.github.io/phaser-tiny-world-adventure/`

Open it — game should load without 404 errors on assets.
