CREATE TABLE IF NOT EXISTS meme_ownership (
  user_email   text        NOT NULL,
  s3_url       text        NOT NULL,
  uploaded_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_email, s3_url)
);