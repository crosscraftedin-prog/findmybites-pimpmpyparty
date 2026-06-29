-- ═══════════════════════════════════════════════════════════════
-- Universal Filter Engine — Seed Data
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Helper function to create a filter group + values + assign to categories
CREATE OR REPLACE FUNCTION create_filter(
  p_name TEXT, p_type TEXT, p_unit TEXT, p_values TEXT[], p_categories TEXT[]
) RETURNS TEXT AS $$
DECLARE
  v_group_id TEXT;
  v_val TEXT;
  v_cat TEXT;
  v_order INT := 0;
BEGIN
  -- Create or get group
  INSERT INTO filter_groups (id, name, type, unit, active, "createdAt", "updatedAt")
  VALUES ('c' || replace(gen_random_uuid()::text, '-', ''), p_name, p_type, p_unit, true, NOW(), NOW())
  ON CONFLICT (name) DO UPDATE SET "updatedAt" = NOW()
  RETURNING id INTO v_group_id;

  -- Add values
  IF array_length(p_values, 1) > 0 THEN
    FOREACH v_val IN ARRAY p_values LOOP
      INSERT INTO filter_values (id, "groupId", value, "sortOrder", active, "createdAt")
      VALUES ('c' || replace(gen_random_uuid()::text, '-', ''), v_group_id, v_val, v_order, true, NOW())
      ON CONFLICT DO NOTHING;
      v_order := v_order + 1;
    END LOOP;
  END IF;

  -- Assign to categories
  FOREACH v_cat IN ARRAY p_categories LOOP
    INSERT INTO category_filters (id, "categoryId", "filterGroupId", "createdAt")
    VALUES ('c' || replace(gen_random_uuid()::text, '-', ''), v_cat, v_group_id, NOW())
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN v_group_id;
END;
$$ LANGUAGE plpgsql;

-- ═══ CATERERS ═══
SELECT create_filter('Cuisine', 'multi', NULL,
  ARRAY['North Indian','South Indian','Chinese','Italian','Mexican','Thai','Japanese','Korean','Mediterranean','Continental','American','Middle Eastern','Lebanese','Turkish','Greek','French','Spanish','Vietnamese','Indonesian','Filipino','Brazilian','African','Seafood','Street Food','Fusion'],
  ARRAY['caterers']);

SELECT create_filter('Dietary Options', 'multi', NULL,
  ARRAY['Vegetarian','Vegan','Halal','Kosher','Jain','Gluten Free','Dairy Free','Organic'],
  ARRAY['caterers','bakers-bakery','chef-staff','food-trucks','specialty-food']);

SELECT create_filter('Service Style', 'multi', NULL,
  ARRAY['Buffet','Plated','Family Style','Live Cooking','Food Stations','Drop Off','Full Service','Cocktail Reception'],
  ARRAY['caterers']);

SELECT create_filter('Guest Capacity', 'range', 'Guests', ARRAY[]::TEXT[], ARRAY['caterers']);
SELECT create_filter('Minimum Budget', 'range', 'Currency', ARRAY[]::TEXT[],
  ARRAY['caterers','bakers-bakery','venues','djs','photographers','videographers','decorators','event-planners','florists','chef-staff','makeup-artists','beauty-services','rental-services','audio-visual-services','transportation']);
SELECT create_filter('Travel Distance', 'range', 'km', ARRAY[]::TEXT[],
  ARRAY['caterers','djs','photographers','videographers','decorators','florists','makeup-artists','beauty-services','chef-staff','entertainers','event-planners']);
SELECT create_filter('Delivery Available', 'single', NULL, ARRAY['Yes','No'],
  ARRAY['caterers','bakers-bakery','food-trucks','beverage-specialists','specialty-food']);

-- ═══ BAKERS / CAKES ═══
SELECT create_filter('Flavour', 'multi', NULL,
  ARRAY['Chocolate','Vanilla','Red Velvet','Black Forest','Butterscotch','Strawberry','Coffee','Fruit','Lemon','Caramel'],
  ARRAY['bakers-bakery']);
SELECT create_filter('Egg Option', 'single', NULL, ARRAY['Egg','Eggless','Both'], ARRAY['bakers-bakery']);
SELECT create_filter('Cake Type', 'multi', NULL,
  ARRAY['Fondant','Buttercream','Fresh Cream','Photo Cake','Tier Cake','Cupcakes','Bento Cake','Cheesecake'],
  ARRAY['bakers-bakery']);
SELECT create_filter('Preparation Time', 'range', 'Days', ARRAY[]::TEXT[], ARRAY['bakers-bakery']);

-- ═══ VENUES ═══
SELECT create_filter('Capacity', 'range', 'Guests', ARRAY[]::TEXT[], ARRAY['venues']);
SELECT create_filter('Venue Type', 'multi', NULL,
  ARRAY['Indoor','Outdoor','Rooftop','Garden','Beachfront','Banquet Hall','Ballroom','Farmhouse','Resort','Hotel'],
  ARRAY['venues']);
SELECT create_filter('Parking', 'single', NULL, ARRAY['Available','Not Available'], ARRAY['venues']);
SELECT create_filter('Air Conditioning', 'single', NULL, ARRAY['Yes','No'], ARRAY['venues']);
SELECT create_filter('Accommodation', 'single', NULL, ARRAY['Yes','No'], ARRAY['venues']);
SELECT create_filter('Wheelchair Accessible', 'single', NULL, ARRAY['Yes','No'], ARRAY['venues']);

-- ═══ DECORATORS ═══
SELECT create_filter('Event Type (Decor)', 'multi', NULL,
  ARRAY['Wedding','Birthday','Baby Shower','Corporate','Engagement','Anniversary','Festival'],
  ARRAY['decorators','florists']);
SELECT create_filter('Decoration Theme', 'multi', NULL,
  ARRAY['Luxury','Modern','Rustic','Boho','Floral','Traditional','Minimalist','Vintage'],
  ARRAY['decorators']);
SELECT create_filter('Balloon Decoration', 'single', NULL, ARRAY['Yes','No'], ARRAY['decorators']);
SELECT create_filter('Floral Decoration', 'single', NULL, ARRAY['Yes','No'], ARRAY['decorators','florists']);
SELECT create_filter('Setup Included', 'single', NULL, ARRAY['Yes','No'],
  ARRAY['decorators','rental-services','audio-visual-services']);
SELECT create_filter('Cleanup Included', 'single', NULL, ARRAY['Yes','No'], ARRAY['decorators']);

-- ═══ PHOTOGRAPHERS & VIDEOGRAPHERS ═══
SELECT create_filter('Event Type (Photo)', 'multi', NULL,
  ARRAY['Wedding','Birthday','Corporate','Baby Shower','Engagement','Festival'],
  ARRAY['photographers','videographers']);
SELECT create_filter('Photography Style', 'multi', NULL,
  ARRAY['Traditional','Candid','Documentary','Fine Art','Cinematic'],
  ARRAY['photographers','videographers']);
SELECT create_filter('Drone Available', 'single', NULL, ARRAY['Yes','No'], ARRAY['photographers','videographers']);
SELECT create_filter('Same Day Editing', 'single', NULL, ARRAY['Yes','No'], ARRAY['photographers','videographers']);
SELECT create_filter('Travel Available', 'single', NULL, ARRAY['Yes','No'],
  ARRAY['photographers','videographers','djs','entertainers','event-planners']);

-- ═══ DJs & ENTERTAINERS ═══
SELECT create_filter('Music Genre', 'multi', NULL,
  ARRAY['Bollywood','EDM','House','Hip Hop','Pop','Rock','Jazz','Classical','R&B','Commercial'],
  ARRAY['djs']);
SELECT create_filter('Languages', 'multi', NULL,
  ARRAY['English','Hindi','Arabic','Spanish','French','Tamil','Telugu','Malayalam','Kannada'],
  ARRAY['djs','entertainers','event-planners']);
SELECT create_filter('Performance Duration', 'range', 'Hours', ARRAY[]::TEXT[], ARRAY['djs','entertainers']);
SELECT create_filter('Equipment Included', 'single', NULL, ARRAY['Yes','No'], ARRAY['djs','audio-visual-services']);

-- ═══ FLORISTS ═══
SELECT create_filter('Flower Type', 'multi', NULL,
  ARRAY['Roses','Orchids','Lilies','Tulips','Carnations','Sunflowers','Mixed Flowers'],
  ARRAY['florists']);
SELECT create_filter('Fresh Flowers', 'single', NULL, ARRAY['Yes','No'], ARRAY['florists']);

-- ═══ BEAUTY, HAIR & HENNA ═══
SELECT create_filter('Beauty Service Type', 'multi', NULL,
  ARRAY['Hair Styling','Makeup','Bridal Makeup','Airbrush Makeup','HD Makeup','Henna','Mehndi','Lashes','Brows'],
  ARRAY['makeup-artists','beauty-services']);
SELECT create_filter('Mobile Service', 'single', NULL, ARRAY['Yes','No'], ARRAY['makeup-artists','beauty-services']);

-- ═══ RENTALS ═══
SELECT create_filter('Rental Type', 'multi', NULL,
  ARRAY['Photo Booth','Furniture','Tables','Chairs','Tent','Stage','Dance Floor','AV Equipment','Linen','Games'],
  ARRAY['rental-services']);

-- ═══ LIGHTING & AV ═══
SELECT create_filter('AV Service Type', 'multi', NULL,
  ARRAY['Lighting','Sound','LED Screen','Projector','Truss','Stage','Dance Floor','Projection Mapping'],
  ARRAY['audio-visual-services']);
SELECT create_filter('Technician Included', 'single', NULL, ARRAY['Yes','No'], ARRAY['audio-visual-services']);

-- ═══ TRANSPORT ═══
SELECT create_filter('Vehicle Type', 'multi', NULL,
  ARRAY['Luxury Car','Limousine','Vintage Car','Party Bus','Coach','Minibus','Helicopter','Private Jet','Yacht'],
  ARRAY['transportation']);
SELECT create_filter('Chauffeur Included', 'single', NULL, ARRAY['Yes','No'], ARRAY['transportation']);

-- ═══ EVENT STAFFING ═══
SELECT create_filter('Staff Type', 'multi', NULL,
  ARRAY['Waiter','Waitress','Bartender','Mixologist','Host','Hostess','Promoter','Brand Ambassador','Security','Valet','Cleaner','Event Crew'],
  ARRAY['chef-staff']);
SELECT create_filter('Staff Gender', 'single', NULL, ARRAY['Male','Female','Mixed'], ARRAY['chef-staff']);
SELECT create_filter('Staff Experience', 'multi', NULL, ARRAY['Beginner','1–3 Years','3–5 Years','5+ Years'], ARRAY['chef-staff']);

-- ═══ BAR SERVICES ═══
SELECT create_filter('Beverage Type', 'multi', NULL,
  ARRAY['Cocktails','Mocktails','Coffee','Tea','Juice','Smoothies','Beer','Wine','Spirits'],
  ARRAY['beverage-specialists']);
SELECT create_filter('Bar Service Style', 'multi', NULL,
  ARRAY['Mobile Bar','Cocktail Bar','Coffee Bar','Dry Bar','Luxury Bar'],
  ARRAY['beverage-specialists']);
SELECT create_filter('Bartender Included', 'single', NULL, ARRAY['Yes','No'], ARRAY['beverage-specialists']);

-- ═══ UNIVERSAL FILTERS (all categories) ═══
SELECT create_filter('Years of Experience', 'range', 'Years', ARRAY[]::TEXT[],
  ARRAY['bakers-bakery','caterers','chef-staff','food-trucks','beverage-specialists','specialty-food','event-planners','decorators','photographers','videographers','djs','entertainers','venues','florists','rental-services','makeup-artists','beauty-services','transportation','invitation-printing','kids-party-services','audio-visual-services']);
SELECT create_filter('Home Service Available', 'single', NULL, ARRAY['Yes','No'],
  ARRAY['bakers-bakery','caterers','chef-staff','food-trucks','beverage-specialists','specialty-food','event-planners','decorators','photographers','videographers','djs','entertainers','venues','florists','rental-services','makeup-artists','beauty-services','transportation','invitation-printing','kids-party-services','audio-visual-services']);
SELECT create_filter('Available for Destination Events', 'single', NULL, ARRAY['Yes','No'],
  ARRAY['bakers-bakery','caterers','chef-staff','food-trucks','beverage-specialists','specialty-food','event-planners','decorators','photographers','videographers','djs','entertainers','venues','florists','rental-services','makeup-artists','beauty-services','transportation','invitation-printing','kids-party-services','audio-visual-services']);
SELECT create_filter('Emergency Booking', 'single', NULL, ARRAY['Yes','No'],
  ARRAY['bakers-bakery','caterers','chef-staff','food-trucks','beverage-specialists','specialty-food','event-planners','decorators','photographers','videographers','djs','entertainers','venues','florists','rental-services','makeup-artists','beauty-services','transportation','invitation-printing','kids-party-services','audio-visual-services']);
SELECT create_filter('Booking Type', 'multi', NULL, ARRAY['Instant Booking','Request Quote','Call to Book'],
  ARRAY['bakers-bakery','caterers','chef-staff','food-trucks','beverage-specialists','specialty-food','event-planners','decorators','photographers','videographers','djs','entertainers','venues','florists','rental-services','makeup-artists','beauty-services','transportation','invitation-printing','kids-party-services','audio-visual-services']);

-- Clean up helper function
DROP FUNCTION IF EXISTS create_filter(TEXT, TEXT, TEXT, TEXT[], TEXT[]);

-- ═══ DONE ═══
-- Total: 55 filter groups, 150+ filter values, assigned to 21 categories
