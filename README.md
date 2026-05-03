# Carteggio

> Conoscersi per le parole, non per la foto.

App di dating italiana text-first. In sviluppo per Brescia e Bergamo.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Supabase** (Postgres + Auth + Storage + Realtime)
- **Tailwind CSS** (palette brand: paper, ink, bordeaux)
- **PWA** installabile su iPhone, Android, desktop

## Variabili d'ambiente

Vedi `.env.example`. Tutte le chiavi sono configurate come variabili d'ambiente su Vercel — non finiscono nel repository.

## Sviluppo

Il codice viene scritto da Claude e pubblicato su questo repository. Il deploy a `carteggio-app.vercel.app` è automatico ad ogni push su `main`.

Per lavoro locale (più avanti):

```bash
npm install
cp .env.example .env.local   # incolla le chiavi reali
npm run dev
```

## Sintesi della v1

Vedi `product-spec-mvp.html` nella cartella di progetto principale.
