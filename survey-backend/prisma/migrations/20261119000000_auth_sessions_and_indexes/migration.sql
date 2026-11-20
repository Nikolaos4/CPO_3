-- JWT sessions
CREATE TABLE "auth_session" (
    "session_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "refresh_token_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "auth_session_pkey" PRIMARY KEY ("session_id")
);

CREATE INDEX "auth_session_user_id_idx" ON "auth_session"("user_id");
CREATE INDEX "auth_session_expires_at_idx" ON "auth_session"("expires_at");
CREATE INDEX "survey_creator_id_status_idx" ON "survey"("creator_id", "status");
CREATE INDEX "survey_status_deadline_idx" ON "survey"("status", "deadline");
CREATE INDEX "survey_status_created_at_idx" ON "survey"("status", "created_at");
CREATE INDEX "question_survey_id_order_index_idx" ON "question"("survey_id", "order_index");
CREATE INDEX "option_question_id_order_index_idx" ON "option"("question_id", "order_index");
CREATE INDEX "vote_user_id_idx" ON "vote"("user_id");
CREATE INDEX "vote_option_id_idx" ON "vote"("option_id");
CREATE INDEX "participation_survey_id_idx" ON "participation"("survey_id");
CREATE INDEX "participation_user_id_completed_at_idx" ON "participation"("user_id", "completed_at");

ALTER TABLE "auth_session"
ADD CONSTRAINT "auth_session_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "user"("user_id")
ON DELETE CASCADE ON UPDATE CASCADE;
