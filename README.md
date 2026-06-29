# portfolio

My personal site. A content driven portfolio for my experience, projects and
homelab. Built with react, typescript and vite.

## dev

```bash
npm install
npm run dev
```

## build

```bash
npm run build
npm run preview
```

## structure

- `src/lib` is the content i actually edit: experience, skills, projects,
  services and lab notes. typed data, no cms.
- `src/components` are the section and layout pieces.
- `src/pages` are the routed views (home, projects, project detail, homelab,
  notes).
- `src/index.css` holds the global styles and tokens.

Routing is a small hand rolled client router in `src/hooks/useRoute.ts`, so no
framework router and no backend.
