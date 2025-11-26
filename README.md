# Fury

Fury is a lightweight bookmark organizer that imports Chrome-exported HTML bookmarks, auto-categorizes them locally, and lets you search or browse by category without leaving the browser.

## Getting started

1. `npm install`
2. `npx prisma migrate dev` (or `npm run prisma:migrate`) to create the SQLite schema in `dev.db`.
3. `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) and explore Fury’s dashboard.

## Import bookmarks

1. In Chrome, open the Bookmark Manager (`chrome://bookmarks/`), click the three-dot menu, and choose **Export bookmarks**.
2. Save the `.html` file to your machine.
3. In Fury, open `/import` and upload the exported HTML file.
4. Fury parses every link, assigns a category, and records the import session.

## Explore bookmarks

- Use `/bookmarks` to search for bookmarks by title, URL, or description and filter by category.
- Visit `/categories` to scan the category grid and click any category to see its bookmarks.

## Prisma tooling

- `npm run prisma:migrate`: run migrations to align the database schema with `prisma/schema.prisma`.
- `npm run prisma:generate`: regenerate the Prisma client after schema updates.
