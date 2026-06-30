/**
 * Seed the Universal Filter Engine with all filter groups + values.
 * Run: bun run prisma/seed-filters.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Helper: create a filter group with values + assign to categories
async function createFilter(name: string, type: string, unit: string | null, values: string[], categoryIds: string[]) {
  try {
    // Check if group already exists
    const existing = await db.filterGroup.findUnique({ where: { name } });
    if (existing) {
      // Update: add missing values + categories
      const existingValues = await db.filterValue.findMany({ where: { groupId: existing.id } });
      const existingValueStrings = existingValues.map(v => v.value);
      const newValues = values.filter(v => !existingValueStrings.includes(v));
      if (newValues.length > 0) {
        const startOrder = existingValues.length;
        await db.filterValue.createMany({
          data: newValues.map((v, i) => ({ groupId: existing.id, value: v, sortOrder: startOrder + i })),
        });
      }
      for (const catId of categoryIds) {
        try {
          await db.categoryFilter.create({ data: { categoryId: catId, filterGroupId: existing.id } });
        } catch {}
      }
      console.log(`  ✅ ${name}: updated (${values.length} values, ${categoryIds.length} categories)`);
      return;
    }

    const group = await db.filterGroup.create({
      data: { name, type, unit },
    });

    if (values.length > 0) {
      await db.filterValue.createMany({
        data: values.map((v, i) => ({ groupId: group.id, value: v, sortOrder: i })),
      });
    }

    for (const catId of categoryIds) {
      try {
        await db.categoryFilter.create({ data: { categoryId: catId, filterGroupId: group.id } });
      } catch {}
    }

    console.log(`  ✅ ${name}: created (${values.length} values, ${categoryIds.length} categories)`);
  } catch (e: any) {
    console.error(`  ❌ ${name}:`, e.message?.slice(0, 80));
  }
}

async function main() {
  console.log("Seeding Universal Filter Engine...\n");

  // ═══ CATERERS (caterers) ═══
  console.log("📦 CATERERS:");
  await createFilter("Cuisine", "multi", null,
    ["North Indian","South Indian","Chinese","Italian","Mexican","Thai","Japanese","Korean","Mediterranean","Continental","American","Middle Eastern","Lebanese","Turkish","Greek","French","Spanish","Vietnamese","Indonesian","Filipino","Brazilian","African","Seafood","Street Food","Fusion"],
    ["caterers"]);
  await createFilter("Dietary Options", "multi", null,
    ["Vegetarian","Vegan","Halal","Kosher","Jain","Gluten Free","Dairy Free","Organic"],
    ["caterers","bakers-bakery","chef-staff","food-trucks","specialty-food"]);
  await createFilter("Service Style", "multi", null,
    ["Buffet","Plated","Family Style","Live Cooking","Food Stations","Drop Off","Full Service","Cocktail Reception"],
    ["caterers"]);
  await createFilter("Guest Capacity", "range", "Guests", [], ["caterers"]);
  await createFilter("Minimum Budget", "range", "Currency", [], ["caterers","bakers-bakery","venues","djs","photographers","videographers","decorators","event-planners","florists","chef-staff","makeup-artists","beauty-services","rental-services","audio-visual-services","transportation"]);
  await createFilter("Travel Distance", "range", "km", [], ["caterers","djs","photographers","videographers","decorators","florists","makeup-artists","beauty-services","chef-staff","entertainers","event-planners"]);
  await createFilter("Delivery Available", "single", null, ["Yes","No"], ["caterers","bakers-bakery","food-trucks","beverage-specialists","specialty-food"]);

  // ═══ BAKERS / CAKES (bakers-bakery) ═══
  console.log("\n🎂 BAKERS / CAKES:");
  await createFilter("Flavour", "multi", null,
    ["Chocolate","Vanilla","Red Velvet","Black Forest","Butterscotch","Strawberry","Coffee","Fruit","Lemon","Caramel"],
    ["bakers-bakery"]);
  await createFilter("Egg Option", "single", null, ["Egg","Eggless","Both"], ["bakers-bakery"]);
  await createFilter("Cake Type", "multi", null,
    ["Fondant","Buttercream","Fresh Cream","Photo Cake","Tier Cake","Cupcakes","Bento Cake","Cheesecake"],
    ["bakers-bakery"]);
  await createFilter("Preparation Time", "range", "Days", [], ["bakers-bakery"]);

  // ═══ VENUES (venues) ═══
  console.log("\n🏛️ VENUES:");
  await createFilter("Capacity", "range", "Guests", [], ["venues"]);
  await createFilter("Venue Type", "multi", null,
    ["Indoor","Outdoor","Rooftop","Garden","Beachfront","Banquet Hall","Ballroom","Farmhouse","Resort","Hotel"],
    ["venues"]);
  await createFilter("Parking", "single", null, ["Available","Not Available"], ["venues"]);
  await createFilter("Air Conditioning", "single", null, ["Yes","No"], ["venues"]);
  await createFilter("Accommodation", "single", null, ["Yes","No"], ["venues"]);
  await createFilter("Wheelchair Accessible", "single", null, ["Yes","No"], ["venues"]);

  // ═══ DECORATORS (decorators) ═══
  console.log("\n🎈 DECORATORS:");
  await createFilter("Event Type (Decor)", "multi", null,
    ["Wedding","Birthday","Baby Shower","Corporate","Engagement","Anniversary","Festival"],
    ["decorators","florists"]);
  await createFilter("Decoration Theme", "multi", null,
    ["Luxury","Modern","Rustic","Boho","Floral","Traditional","Minimalist","Vintage"],
    ["decorators"]);
  await createFilter("Balloon Decoration", "single", null, ["Yes","No"], ["decorators"]);
  await createFilter("Floral Decoration", "single", null, ["Yes","No"], ["decorators","florists"]);
  await createFilter("Setup Included", "single", null, ["Yes","No"], ["decorators","rental-services","audio-visual-services"]);
  await createFilter("Cleanup Included", "single", null, ["Yes","No"], ["decorators"]);

  // ═══ PHOTOGRAPHERS & VIDEOGRAPHERS ═══
  console.log("\n📸 PHOTOGRAPHERS & VIDEOGRAPHERS:");
  await createFilter("Event Type (Photo)", "multi", null,
    ["Wedding","Birthday","Corporate","Baby Shower","Engagement","Festival"],
    ["photographers","videographers"]);
  await createFilter("Photography Style", "multi", null,
    ["Traditional","Candid","Documentary","Fine Art","Cinematic"],
    ["photographers","videographers"]);
  await createFilter("Drone Available", "single", null, ["Yes","No"], ["photographers","videographers"]);
  await createFilter("Same Day Editing", "single", null, ["Yes","No"], ["photographers","videographers"]);
  await createFilter("Travel Available", "single", null, ["Yes","No"], ["photographers","videographers","djs","entertainers","event-planners"]);

  // ═══ DJs & ENTERTAINERS ═══
  console.log("\n🎵 DJs & ENTERTAINERS:");
  await createFilter("Music Genre", "multi", null,
    ["Bollywood","EDM","House","Hip Hop","Pop","Rock","Jazz","Classical","R&B","Commercial"],
    ["djs"]);
  await createFilter("Languages", "multi", null,
    ["English","Hindi","Arabic","Spanish","French","Tamil","Telugu","Malayalam","Kannada"],
    ["djs","entertainers","event-planners"]);
  await createFilter("Performance Duration", "range", "Hours", [], ["djs","entertainers"]);
  await createFilter("Equipment Included", "single", null, ["Yes","No"], ["djs","audio-visual-services"]);

  // ═══ FLORISTS ═══
  console.log("\n💐 FLORISTS:");
  await createFilter("Flower Type", "multi", null,
    ["Roses","Orchids","Lilies","Tulips","Carnations","Sunflowers","Mixed Flowers"],
    ["florists"]);
  await createFilter("Fresh Flowers", "single", null, ["Yes","No"], ["florists"]);

  // ═══ BEAUTY, HAIR & HENNA ═══
  console.log("\n💄 BEAUTY & HENNA:");
  await createFilter("Beauty Service Type", "multi", null,
    ["Hair Styling","Makeup","Bridal Makeup","Airbrush Makeup","HD Makeup","Henna","Mehndi","Lashes","Brows"],
    ["makeup-artists","beauty-services"]);
  await createFilter("Mobile Service", "single", null, ["Yes","No"], ["makeup-artists","beauty-services"]);

  // ═══ RENTALS ═══
  console.log("\n🪑 RENTALS:");
  await createFilter("Rental Type", "multi", null,
    ["Photo Booth","Furniture","Tables","Chairs","Tent","Stage","Dance Floor","AV Equipment","Linen","Games"],
    ["rental-services"]);

  // ═══ LIGHTING & AV ═══
  console.log("\n💡 LIGHTING & AV:");
  await createFilter("AV Service Type", "multi", null,
    ["Lighting","Sound","LED Screen","Projector","Truss","Stage","Dance Floor","Projection Mapping"],
    ["audio-visual-services"]);
  await createFilter("Technician Included", "single", null, ["Yes","No"], ["audio-visual-services"]);

  // ═══ TRANSPORT ═══
  console.log("\n🚗 TRANSPORT:");
  await createFilter("Vehicle Type", "multi", null,
    ["Luxury Car","Limousine","Vintage Car","Party Bus","Coach","Minibus","Helicopter","Private Jet","Yacht"],
    ["transportation"]);
  await createFilter("Chauffeur Included", "single", null, ["Yes","No"], ["transportation"]);

  // ═══ EVENT STAFFING (chef-staff) ═══
  console.log("\n👥 EVENT STAFFING:");
  await createFilter("Staff Type", "multi", null,
    ["Waiter","Waitress","Bartender","Mixologist","Host","Hostess","Promoter","Brand Ambassador","Security","Valet","Cleaner","Event Crew"],
    ["chef-staff"]);
  await createFilter("Staff Gender", "single", null, ["Male","Female","Mixed"], ["chef-staff"]);
  await createFilter("Staff Experience", "multi", null, ["Beginner","1–3 Years","3–5 Years","5+ Years"], ["chef-staff"]);

  // ═══ BAR SERVICES (beverage-specialists) ═══
  console.log("\n🍹 BAR SERVICES:");
  await createFilter("Beverage Type", "multi", null,
    ["Cocktails","Mocktails","Coffee","Tea","Juice","Smoothies","Beer","Wine","Spirits"],
    ["beverage-specialists"]);
  await createFilter("Bar Service Style", "multi", null,
    ["Mobile Bar","Cocktail Bar","Coffee Bar","Dry Bar","Luxury Bar"],
    ["beverage-specialists"]);
  await createFilter("Bartender Included", "single", null, ["Yes","No"], ["beverage-specialists"]);

  // ═══ UNIVERSAL FILTERS (all categories) ═══
  console.log("\n🌍 UNIVERSAL FILTERS:");
  const ALL = [
    "bakers-bakery","caterers","chef-staff","food-trucks","beverage-specialists","specialty-food",
    "event-planners","decorators","photographers","videographers","djs","entertainers","venues",
    "florists","rental-services","makeup-artists","beauty-services","transportation",
    "invitation-printing","kids-party-services","audio-visual-services",
  ];
  await createFilter("Years of Experience", "range", "Years", [], ALL);
  await createFilter("Home Service Available", "single", null, ["Yes","No"], ALL);
  await createFilter("Available for Destination Events", "single", null, ["Yes","No"], ALL);
  await createFilter("Emergency Booking", "single", null, ["Yes","No"], ALL);
  await createFilter("Booking Type", "multi", null, ["Instant Booking","Request Quote","Call to Book"], ALL);

  console.log("\n✅ Done!");
}

main().finally(() => db.$disconnect());
