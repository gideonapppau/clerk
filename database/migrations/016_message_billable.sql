-- Dashboard simulate messages must not count toward trial / plan reply limits.
ALTER TABLE messages ADD COLUMN IF NOT EXISTS billable BOOLEAN NOT NULL DEFAULT true;
