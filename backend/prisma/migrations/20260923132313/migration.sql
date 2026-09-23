-- CreateEnum
CREATE TYPE "LicenseType" AS ENUM ('OPEN', 'INVITED_ONLY', 'LOCATION_TIME');

-- AlterTable
ALTER TABLE "LiveSession" ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "license" "LicenseType" NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "startTime" TIMESTAMP(3);
