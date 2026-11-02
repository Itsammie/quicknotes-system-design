# QuickNotes Data Model

## Entities

### users
| Column | Type | Key / constraint |
|--------|------|------------------|
| id | BIGINT | **PK**, auto-increment |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| created_at | TIMESTAMP | NOT NULL, default now |

### notes
| Column | Type | Key / constraint |
|--------|------|------------------|
| id | BIGINT | **PK**, auto-increment |
| user_id | BIGINT | **FK → users.id**, NOT NULL |
| title | VARCHAR(100) | NOT NULL |
| body | TEXT | NULL allowed |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

### tags
| Column | Type | Key / constraint |
|--------|------|------------------|
| id | BIGINT | **PK**, auto-increment |
| user_id | BIGINT | **FK → users.id**, NOT NULL |
| name | VARCHAR(50) | NOT NULL, UNIQUE per user |

### note_tags (join table)
| Column | Type | Key / constraint |
|--------|------|------------------|
| note_id | BIGINT | **PK (part 1)**, **FK → notes.id** ON DELETE CASCADE |
| tag_id | BIGINT | **PK (part 2)**, **FK → tags.id** ON DELETE CASCADE |

## Relationships

- **One-to-many:** one user has many notes (`notes.user_id → users.id`); one user also owns many tags.
- **Many-to-many:** a note can have many tags and a tag can label many notes. A relational database cannot store this directly, so the join table `note_tags` holds one row per (note, tag) pair; its composite primary key prevents duplicates.

## CREATE TABLE statements

```sql
CREATE TABLE users (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT NOT NULL,
  title      VARCHAR(100) NOT NULL,
  body       TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE tags (
  id      BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  name    VARCHAR(50) NOT NULL,
  UNIQUE (user_id, name),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE note_tags (
  note_id BIGINT NOT NULL,
  tag_id  BIGINT NOT NULL,
  PRIMARY KEY (note_id, tag_id),
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id)  REFERENCES tags(id)  ON DELETE CASCADE
);
```

## Example queries

```sql
-- 1. Latest 10 notes for a user (backs GET /notes)
SELECT id, title, body, created_at
FROM notes
WHERE user_id = 42
ORDER BY created_at DESC
LIMIT 10;

-- 2. JOIN: all notes with a given tag
SELECT n.id, n.title, t.name AS tag
FROM notes n
JOIN note_tags nt ON nt.note_id = n.id
JOIN tags t       ON t.id = nt.tag_id
WHERE n.user_id = 42 AND t.name = 'work'
ORDER BY n.created_at DESC;

-- 3. Number of notes per tag for a user
SELECT t.name, COUNT(*) AS note_count
FROM tags t
JOIN note_tags nt ON nt.tag_id = t.id
WHERE t.user_id = 42
GROUP BY t.name;

-- 4. Delete a note (its note_tags rows are removed by CASCADE)
DELETE FROM notes WHERE id = 9812 AND user_id = 42;
```

## Index

```sql
CREATE INDEX idx_notes_user_created ON notes (user_id, created_at DESC);
```

**Reason:** almost every read is "this user's newest notes". Without the index the database scans the whole `notes` table (hundreds of millions of rows); with it, it jumps straight to one user's rows already sorted by date. A second index on `note_tags (tag_id, note_id)` speeds up "notes for a tag" lookups.

## SQL vs NoSQL

I chose **SQL (PostgreSQL/MySQL)**. The data is structured and relational (users → notes, notes ↔ tags), and we need foreign keys, transactions (e.g. create a note and its tags atomically) and flexible queries with JOINs. A single relational database comfortably handles our estimated load (about 70 writes/s at peak); scale reads with replicas and, much later, shard by `user_id`. NoSQL would only be considered for a separate search or analytics feature, not for the core data.