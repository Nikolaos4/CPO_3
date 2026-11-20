-- CreateEnum
CREATE TYPE "SurveyStatus" AS ENUM ('draft', 'active', 'completed');

-- CreateTable
CREATE TABLE "role" (
    "role_id" SERIAL NOT NULL,
    "role_name" TEXT NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "user" (
    "user_id" SERIAL NOT NULL,
    "nickname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "survey" (
    "survey_id" SERIAL NOT NULL,
    "creator_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "short_description" TEXT,
    "full_description" TEXT,
    "is_private" BOOLEAN NOT NULL DEFAULT false,
    "password_hash" TEXT,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" "SurveyStatus" NOT NULL DEFAULT 'draft',
    "deadline" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "survey_pkey" PRIMARY KEY ("survey_id")
);

-- CreateTable
CREATE TABLE "question" (
    "question_id" SERIAL NOT NULL,
    "survey_id" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "allow_multiple" BOOLEAN NOT NULL DEFAULT false,
    "order_index" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "question_pkey" PRIMARY KEY ("question_id")
);

-- CreateTable
CREATE TABLE "option" (
    "option_id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "option_pkey" PRIMARY KEY ("option_id")
);

-- CreateTable
CREATE TABLE "vote" (
    "vote_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "option_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vote_pkey" PRIMARY KEY ("vote_id")
);

-- CreateTable
CREATE TABLE "participation" (
    "participation_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "survey_id" INTEGER NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participation_pkey" PRIMARY KEY ("participation_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "role_role_name_key" ON "role"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "user_nickname_key" ON "user"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vote_user_id_option_id_key" ON "vote"("user_id", "option_id");

-- CreateIndex
CREATE UNIQUE INDEX "participation_user_id_survey_id_key" ON "participation"("user_id", "survey_id");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey" ADD CONSTRAINT "survey_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question" ADD CONSTRAINT "question_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "survey"("survey_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "option" ADD CONSTRAINT "option_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question"("question_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vote" ADD CONSTRAINT "vote_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vote" ADD CONSTRAINT "vote_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "option"("option_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participation" ADD CONSTRAINT "participation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participation" ADD CONSTRAINT "participation_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "survey"("survey_id") ON DELETE CASCADE ON UPDATE CASCADE;
