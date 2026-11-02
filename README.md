# QuickNotes System Design

QuickNotes is moving from a browser-only app to an online service for 1 million users. This repository has two parts:

1. **A front-end API client** that proves the browser can talk to a REST API (using the JSONPlaceholder practice API): load, create and delete notes.
2. **Design documents** for the real backend: API, data model and architecture.

## How to run the API client

No build step or dependencies are needed.

1. Clone the repo: `git clone https://github.com/your-username/quicknotes-system-design.git`
2. Open `index.html` in a browser (or run `python3 -m http.server` and visit `http://localhost:8000`).
3. Click **Load notes** to fetch 10 notes (GET), fill in the form to create a note (POST), and click **Delete** on a note (DELETE).

Note: JSONPlaceholder does not really save changes, so created notes only exist on the page (see the comment in `api.js`).

## Design documents

- [API design](docs/api-design.md)
- [Data model](docs/data-model.md)
- [Architecture](docs/architecture.md)

## What I learned

- A reusable `request()` function that checks `response.ok` keeps error handling in one place, because `fetch` only rejects on network failures, not on 404 or 500.
- Good UIs show every state (loading, success, error, empty) and disable buttons during requests to prevent duplicate submissions; using `textContent` keeps user text safe from XSS.
- REST design means nouns, correct verbs and meaningful status codes (201 for create, 204 for delete, 400/401/403/404 for errors).
- A many-to-many relationship (notes and tags) needs a join table, and an index matching the main query (`user_id, created_at`) is what keeps reads fast.
- Back-of-envelope estimates (about 230 reads/s, 23 writes/s, ~0.75 TB/year) drive architecture choices such as caching, read replicas and queues, and each added component brings a trade-off.