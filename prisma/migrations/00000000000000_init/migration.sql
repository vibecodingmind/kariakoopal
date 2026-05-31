-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'seeker',
    "languagePref" TEXT NOT NULL DEFAULT 'sw',
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT NOT NULL DEFAULT '',
    "idDocumentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "zones" TEXT NOT NULL DEFAULT '[]',
    "languages" TEXT NOT NULL DEFAULT '[]',
    "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "currentStatus" TEXT NOT NULL DEFAULT 'offline',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuideProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameSw" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "geoBounds" TEXT NOT NULL DEFAULT '{}',
    "color" TEXT NOT NULL DEFAULT '#4CAF50',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Request" (
    "id" TEXT NOT NULL,
    "seekerId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "zoneIds" TEXT NOT NULL DEFAULT '[]',
    "budget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "photoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "seekerId" TEXT NOT NULL,
    "sessionCode" TEXT NOT NULL DEFAULT '',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "escrowStatus" TEXT NOT NULL DEFAULT 'pending',
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "platformFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingSeeker" DOUBLE PRECISION,
    "ratingGuide" DOUBLE PRECISION,
    "reviewSeeker" TEXT,
    "reviewGuide" TEXT,
    "disputeFlag" BOOLEAN NOT NULL DEFAULT false,
    "disputeReason" TEXT,
    "emergencyFlag" BOOLEAN NOT NULL DEFAULT false,
    "seekerConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "guideConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "translatedContent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "categories" TEXT NOT NULL DEFAULT '[]',
    "stallNumber" TEXT NOT NULL DEFAULT '',
    "contact" TEXT NOT NULL DEFAULT '',
    "geoLat" DOUBLE PRECISION NOT NULL DEFAULT -6.8264,
    "geoLng" DOUBLE PRECISION NOT NULL DEFAULT 39.2695,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "recommendations" INTEGER NOT NULL DEFAULT 0,
    "openHours" TEXT NOT NULL DEFAULT '8:00-18:00',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceRadar" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "priceMin" DOUBLE PRECISION NOT NULL,
    "priceMax" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL DEFAULT 'admin',

    CONSTRAINT "PriceRadar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "mobileMoneyNumber" TEXT NOT NULL DEFAULT '',
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "badgeType" TEXT NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorVerification" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "monthlyFee" DOUBLE PRECISION NOT NULL DEFAULT 5000,
    "qrCode" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideSubscription" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'starter',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "paymentRef" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuideSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageDeal" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "duration" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "zoneIds" TEXT NOT NULL DEFAULT '[]',
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "includesDelivery" BOOLEAN NOT NULL DEFAULT false,
    "sessionsCompleted" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackageDeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionRecording" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "isRecording" BOOLEAN NOT NULL DEFAULT false,
    "guideConsent" BOOLEAN NOT NULL DEFAULT false,
    "seekerConsent" BOOLEAN NOT NULL DEFAULT false,
    "duration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "storageUrl" TEXT NOT NULL DEFAULT '',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionRecording_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuddyMatch" (
    "id" TEXT NOT NULL,
    "seeker1Id" TEXT NOT NULL,
    "seeker2Id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "guideId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuddyMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NavWaypoint" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "labelSw" TEXT NOT NULL DEFAULT '',
    "qrCode" TEXT NOT NULL DEFAULT '',
    "floorPlanX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "floorPlanY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL DEFAULT 'junction',
    "directions" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NavWaypoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketStory" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "vendorId" TEXT,
    "zoneId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "audioUrl" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketStory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mentorship" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "sessionsDone" INTEGER NOT NULL DEFAULT 0,
    "sessionsRequired" INTEGER NOT NULL DEFAULT 5,
    "bonusPercent" DOUBLE PRECISION NOT NULL DEFAULT 0.03,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mentorship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonalEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleSw" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'cultural',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "affectedZones" TEXT NOT NULL DEFAULT '[]',
    "insiderTip" TEXT NOT NULL DEFAULT '',
    "insiderTipSw" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeasonalEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudAlert" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL DEFAULT 'guide',
    "entityId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL DEFAULT 'fast_completion',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "details" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FraudAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupTour" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "descriptionSw" TEXT NOT NULL DEFAULT '',
    "maxParticipants" INTEGER NOT NULL DEFAULT 5,
    "currentCount" INTEGER NOT NULL DEFAULT 1,
    "soloPrice" DOUBLE PRECISION NOT NULL DEFAULT 15000,
    "groupPrice" DOUBLE PRECISION NOT NULL DEFAULT 8000,
    "timeSlot" TEXT NOT NULL DEFAULT '',
    "date" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'open',
    "participantIds" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupTour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingList" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'My Shopping List',
    "items" TEXT NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarReminder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalendarReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RequestToZone" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RequestToZone_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "GuideProfile_userId_key" ON "GuideProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorVerification_vendorId_key" ON "VendorVerification"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "GuideSubscription_guideId_key" ON "GuideSubscription"("guideId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionRecording_sessionId_key" ON "SessionRecording"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRate_currency_key" ON "ExchangeRate"("currency");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarReminder_userId_eventId_key" ON "CalendarReminder"("userId", "eventId");

-- CreateIndex
CREATE INDEX "_RequestToZone_B_index" ON "_RequestToZone"("B");

-- AddForeignKey
ALTER TABLE "GuideProfile" ADD CONSTRAINT "GuideProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_seekerId_fkey" FOREIGN KEY ("seekerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_seekerId_fkey" FOREIGN KEY ("seekerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceRadar" ADD CONSTRAINT "PriceRadar_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Badge" ADD CONSTRAINT "Badge_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RequestToZone" ADD CONSTRAINT "_RequestToZone_A_fkey" FOREIGN KEY ("A") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RequestToZone" ADD CONSTRAINT "_RequestToZone_B_fkey" FOREIGN KEY ("B") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

