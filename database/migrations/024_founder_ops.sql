-- Founder ops: weekly scorecard, cold outreach log, competitor watch.

CREATE TABLE IF NOT EXISTS founder_scorecards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start      DATE NOT NULL UNIQUE,
  cold_dms        INT NOT NULL DEFAULT 0,
  demos           INT NOT NULL DEFAULT 0,
  new_paid        INT NOT NULL DEFAULT 0,
  mrr_ghs         INT NOT NULL DEFAULT 0,
  avoided         TEXT NOT NULL DEFAULT '',
  sitting_on      TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS founder_outreach_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  platform        TEXT NOT NULL DEFAULT 'instagram'
                    CHECK (platform IN ('instagram', 'tiktok', 'facebook', 'whatsapp', 'other')),
  shop_name       TEXT NOT NULL,
  message_version TEXT NOT NULL DEFAULT '',
  response        TEXT NOT NULL DEFAULT 'none'
                    CHECK (response IN ('none', 'replied', 'demo', 'trialing', 'paid', 'rejected')),
  outcome         TEXT NOT NULL DEFAULT '',
  notes           TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_founder_outreach_date
  ON founder_outreach_log (log_date DESC);

-- Three posts per week: Mon problem, Wed proof, Fri founder.
CREATE TABLE IF NOT EXISTS founder_content_calendar (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start      DATE NOT NULL UNIQUE,
  mon_problem     BOOLEAN NOT NULL DEFAULT false,
  wed_proof       BOOLEAN NOT NULL DEFAULT false,
  fri_founder     BOOLEAN NOT NULL DEFAULT false,
  notes           TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
