-- Backfill latitude/longitude for existing vendors that have city+country but no coordinates
-- Run this in Supabase SQL Editor
-- This sets coordinates based on city+country geocoding (done via the app)
-- For vendors that already have coordinates, this does nothing.

-- First, let's see how many vendors are missing coordinates:
SELECT count(*) as missing_coords FROM "Vendor" WHERE latitude IS NULL AND longitude IS NULL AND city IS NOT NULL;

-- Note: This SQL can't geocode (that requires an external API call).
-- Instead, we'll update the vendors that have a known city to use
-- approximate coordinates for major cities.

-- Hyderabad, India (17.3850, 78.4867)
UPDATE "Vendor" SET latitude = 17.3850, longitude = 78.4867
WHERE latitude IS NULL AND city ILIKE '%hyderabad%' AND country ILIKE '%india%';

-- Mumbai, India (19.0760, 72.8777)
UPDATE "Vendor" SET latitude = 19.0760, longitude = 72.8777
WHERE latitude IS NULL AND city ILIKE '%mumbai%' AND country ILIKE '%india%';

-- Delhi, India (28.6139, 77.2090)
UPDATE "Vendor" SET latitude = 28.6139, longitude = 77.2090
WHERE latitude IS NULL AND city ILIKE '%delhi%' AND country ILIKE '%india%';

-- Bengaluru, India (12.9716, 77.5946)
UPDATE "Vendor" SET latitude = 12.9716, longitude = 77.5946
WHERE latitude IS NULL AND (city ILIKE '%bengaluru%' OR city ILIKE '%bangalore%') AND country ILIKE '%india%';

-- Chennai, India (13.0827, 80.2707)
UPDATE "Vendor" SET latitude = 13.0827, longitude = 80.2707
WHERE latitude IS NULL AND city ILIKE '%chennai%' AND country ILIKE '%india%';

-- Pune, India (18.5204, 73.8567)
UPDATE "Vendor" SET latitude = 18.5204, longitude = 73.8567
WHERE latitude IS NULL AND city ILIKE '%pune%' AND country ILIKE '%india%';

-- Kolkata, India (22.5726, 88.3639)
UPDATE "Vendor" SET latitude = 22.5726, longitude = 88.3639
WHERE latitude IS NULL AND city ILIKE '%kolkata%' AND country ILIKE '%india%';

-- New York, USA (40.7128, -74.0060)
UPDATE "Vendor" SET latitude = 40.7128, longitude = -74.0060
WHERE latitude IS NULL AND city ILIKE '%new york%' AND country ILIKE '%usa%';

-- London, UK (51.5074, -0.1278)
UPDATE "Vendor" SET latitude = 51.5074, longitude = -0.1278
WHERE latitude IS NULL AND city ILIKE '%london%' AND country ILIKE '%uk%';

-- Dubai, UAE (25.2048, 55.2708)
UPDATE "Vendor" SET latitude = 25.2048, longitude = 55.2708
WHERE latitude IS NULL AND city ILIKE '%dubai%' AND country ILIKE '%uae%';

-- Melbourne, Australia (-37.8136, 144.9631)
UPDATE "Vendor" SET latitude = -37.8136, longitude = 144.9631
WHERE latitude IS NULL AND city ILIKE '%melbourne%' AND country ILIKE '%australia%';

-- Sydney, Australia (-33.8688, 151.2093)
UPDATE "Vendor" SET latitude = -33.8688, longitude = 151.2093
WHERE latitude IS NULL AND city ILIKE '%sydney%' AND country ILIKE '%australia%';

-- Verify
SELECT count(*) as vendors_with_coords FROM "Vendor" WHERE latitude IS NOT NULL;
SELECT count(*) as vendors_without_coords FROM "Vendor" WHERE latitude IS NULL;
