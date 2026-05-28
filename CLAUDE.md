@AGENTS.md

# Project: zorazhao.com

Personal blog/portfolio site for Zixuan Zhao.

## Infrastructure
- **Deployed on**: Vercel
- **Domain**: zorazhao.com
- **GitHub repo**: zhaozixuan03/zixuanzhao
- **Supabase project ID**: agwjpxnqmukptmagfqsq

## Tech Stack
- Next.js App Router (see AGENTS.md — this version has breaking changes)
- Tailwind CSS v4 (`@import "tailwindcss"` in globals.css)
- Tiptap rich text editor (with custom image upload via canvas compression)
- Supabase PostgreSQL + Storage (bucket: `images`) for posts, photos, tags
- Cookie-based auth via `isAuthenticated()` / `isAuthenticatedFromRequest(req)`

## Design System
- Reference: thecreativeindependent.com
- Layout: colorful card grid, masonry photo gallery
- Background: `#f5f4f0`
- Primary green: `#3B6D11`; mid-green: `#639922`; light green: `#97C459`
- Font serif: `Noto Serif SC, Georgia, serif` (class `font-serif`)
- Font mono: `Courier New, monospace` (class `font-mono`)
- Font sans: system sans (class `font-sans`)

## Key Conventions
- Server components fetch data; client components handle interaction
- `export const revalidate = 0` on pages that need fresh data
- Post visibility: `'public'` | `'private'` — non-authed users see public only
- Photos in gallery: `post_id IS NULL`; post-embedded photos: `post_id = <id>`
- Tag filtering is client-side state (no URL params) in `PostsGrid`
- Card background color stored in `posts.card_color`; text color in `posts.card_text_color`
