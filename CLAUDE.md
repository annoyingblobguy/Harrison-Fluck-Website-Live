# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Local Development

```bash
bundle install               # First-time setup
bundle exec jekyll serve     # Serve at http://localhost:4000
```

## Deployment

Push to `main` — GitHub Actions (`.github/workflows/jekyll.yml`) automatically builds and deploys to `https://harrisonfluck.me/`. The GitHub Pages source must be set to **GitHub Actions** in the repo settings.

## Architecture

Two-page site with a hybrid structure:

- **`index.html`** — standalone static HTML (no Jekyll front matter). Links use absolute paths (`/`, `/blog/`).
- **`blog.html`** — Jekyll page (`layout: default`, `permalink: /blog/`). Lists all `_posts/*.md` entries via Liquid.
- **`_posts/*.md`** — Blog posts processed by Jekyll into `/blog/:title/` URLs.
- **`_layouts/default.html`** — Shared Jekyll layout (nav + footer) used by blog pages.
- **`_layouts/post.html`** — Individual post layout (extends `default`).
- **`styles.css`** — All styles for both static and Jekyll pages.
- **`script.js`** — Hamburger menu, smooth scroll, scroll-in fade animations.

### Color palette (dark blue)

| Variable | Value | Use |
|----------|-------|-----|
| `--bg` | `#060914` | Page background |
| `--surface` | `#0d1630` | Cards / elevated surfaces |
| `--blue` | `#2997ff` | Accent (Apple blue) |
| `--white` | `#f5f5f7` | Primary text |
| `--gray` | `#8896b3` | Secondary text |

### Blog post front matter

```yaml
---
layout: post
title: "Post Title"
subtitle: "Optional subtitle"
date: 2024-12-25
category: adventure   # adventure | activities | sports | school | tech | personal
tags: [tag1, tag2]
author: Harrison Fluck
featured_image: /images/photo.jpg
excerpt: "Short summary shown in blog listing."
---
```

### Important notes

- `index.html` is **not** processed by Jekyll (no front matter). Use absolute paths for links.
- `blog.html` permalink is `/blog/` — link to it as `/blog/`, not `blog.html`.
- Old pages (`about.html`, `activities.html`, etc.) are excluded from the Jekyll build via `_config.yml`.
- Images go in `/images/` and should use absolute paths starting with `/`.
- After any push to `main`, check the **Actions** tab in GitHub to verify the build succeeded.
