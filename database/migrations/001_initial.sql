-- Migration 001: initial schema (mirrors schema.sql for explicit migration tracking)
-- Apply with: psql $DATABASE_URL -f database/migrations/001_initial.sql

\i ../schema.sql
