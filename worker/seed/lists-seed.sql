-- Seed data for curated lists
-- 20 lifestyle listicles with cannabis angles

-- MOVIES CATEGORY

INSERT INTO curated_lists (title, slug, category, subcategory, description, icon_emoji, featured) VALUES
('13 Horror Movies to Watch While High', '13-horror-movies-high', 'movies', 'horror', 'Terrifying films that become mind-bending experiences when elevated. Perfect for Halloween or any night you want to feel everything.', '🎬', 1),
('10 Mind-Bending Movies for Your Next Session', 'mind-bending-movies', 'movies', 'thriller', 'Reality-warping films that make you question everything. Best enjoyed with your favorite strain and an open mind.', '🧠', 1),
('15 Comedy Movies That Hit Different Stoned', 'comedy-movies-stoned', 'movies', 'comedy', 'Laugh-out-loud classics that become even funnier when you''re elevated. Bring tissues for the tears of laughter.', '😂', 1),
('8 Documentaries to Blow Your Mind', 'documentaries-mind-blowing', 'movies', 'documentary', 'Eye-opening docs about nature, space, and the human experience. Perfect for curious minds and deep thoughts.', '🌍', 0);

-- MUSIC CATEGORY

INSERT INTO curated_lists (title, slug, category, subcategory, description, icon_emoji, featured) VALUES
('12 Albums Perfect for a Smoke Session', 'albums-smoke-session', 'music', 'albums', 'Front-to-back masterpieces that pair perfectly with cannabis. Each track flows into the next like a journey.', '🎵', 1),
('20 Chill Playlists for Evening Vibes', 'chill-playlists-evening', 'music', 'playlists', 'Curated soundscapes for winding down. Lo-fi beats, ambient sounds, and downtempo grooves for your nighttime ritual.', '🌙', 0),
('10 Psychedelic Albums to Explore', 'psychedelic-albums', 'music', 'psychedelic', 'Genre-defying albums that take you on sonic adventures. Headphones recommended for full effect.', '🌈', 1),
('15 Hip-Hop Classics for Getting Elevated', 'hip-hop-classics-elevated', 'music', 'hip-hop', 'Iconic albums from rap legends who knew the assignment. Beats, bars, and cannabis culture collide.', '🎤', 0);

-- FOOD CATEGORY

INSERT INTO curated_lists (title, slug, category, subcategory, description, icon_emoji, featured) VALUES
('18 Easy Munchie Recipes You Can''t Mess Up', 'easy-munchie-recipes', 'food', 'recipes', 'Simple, delicious recipes for when hunger hits hard. No culinary degree required, just enthusiasm.', '🍕', 1),
('12 Best Late-Night Food Delivery Options', 'late-night-delivery', 'food', 'delivery', 'Your lifeline when the munchies strike at 2 AM. These places deliver happiness right to your door.', '🚚', 0),
('10 Elevated Edibles to Try This Year', 'elevated-edibles-try', 'food', 'edibles', 'Beyond brownies: innovative edibles that taste amazing and provide precise dosing. Start low, go slow.', '🍪', 1),
('14 Gourmet Snacks for Sophisticated Stoners', 'gourmet-snacks-sophisticated', 'food', 'gourmet', 'Elevated munchies for refined palates. Artisanal treats that pair perfectly with quality cannabis.', '🧀', 0);

-- ACTIVITIES CATEGORY

INSERT INTO curated_lists (title, slug, category, subcategory, description, icon_emoji, featured) VALUES
('16 Indoor Activities for a Rainy Day High', 'indoor-activities-rainy', 'activities', 'indoor', 'Cozy activities when you''re stuck inside and elevated. From creative projects to deep dives into hobbies.', '🏠', 1),
('11 Outdoor Adventures That Are Cannabis-Friendly', 'outdoor-adventures-cannabis', 'activities', 'outdoor', 'Nature experiences enhanced by cannabis. Remember to be responsible and respectful of the environment.', '🌲', 1),
('20 Video Games Perfect for Couch Lock', 'video-games-couch-lock', 'activities', 'gaming', 'Immersive games that melt hours away. Single-player adventures and chill multiplayer experiences.', '🎮', 1),
('13 Creative Projects While Elevated', 'creative-projects-elevated', 'activities', 'creative', 'Artistic activities that flow better with cannabis. Paint, write, make music, or just let creativity happen.', '🎨', 0);

-- PRODUCTS CATEGORY

INSERT INTO curated_lists (title, slug, category, subcategory, description, icon_emoji, featured) VALUES
('15 Best Strains for Different Moods', 'best-strains-moods', 'products', 'strains', 'Match your strain to your desired vibe. From energizing sativas to relaxing indicas and balanced hybrids.', '🌿', 1),
('12 Must-Have Smoking Accessories', 'must-have-accessories', 'products', 'accessories', 'Level up your setup with these essential tools. Quality accessories enhance every session.', '💨', 0),
('10 Edibles for Every Occasion', 'edibles-every-occasion', 'products', 'edibles', 'The right edible for the right moment. Gummies, chocolates, drinks, and more for every situation.', '🍬', 1),
('8 Terpene Combinations to Try', 'terpene-combinations', 'products', 'terpenes', 'Explore the aromatic compounds that define your experience. Understanding terpenes unlocks new dimensions.', '🔬', 0);
