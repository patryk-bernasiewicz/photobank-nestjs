-- CreateTable
CREATE TABLE "UserEmailConfirmationToken" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "UserEmailConfirmationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserEmailConfirmationToken_userId_key" ON "UserEmailConfirmationToken"("userId");

-- AddForeignKey
ALTER TABLE "UserEmailConfirmationToken" ADD CONSTRAINT "UserEmailConfirmationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
