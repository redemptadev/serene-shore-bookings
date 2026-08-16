INSERT INTO public.properties (slug, name, description, location, property_type, max_guests, bedrooms, beds, bathrooms, amenities, house_rules, base_price, weekend_price, cleaning_fee, min_nights, status, is_featured)
VALUES
('ocean-breeze-villa', 'Ocean Breeze Villa', E'A light-filled villa steps from the Kilifi shoreline. Wake up to the sound of the Indian Ocean, take breakfast on the terrace and swim in the private pool.\n\nPerfect for families and small groups who want privacy with easy beach access.', 'Kilifi, Kenya', 'villa', 8, 4, 5, 3, ARRAY['Private pool','Wi-Fi','Air conditioning','Ocean view','Free parking','Kitchen','Beach access','Housekeeping'], ARRAY['No smoking indoors','No parties or events','Quiet hours after 10pm'], 18500, 22000, 2500, 2, 'published', true),
('coral Cottage', 'Coral Cottage', E'A romantic two-bedroom cottage tucked into a tropical garden, five minutes from Bofa Beach. Outdoor shower, hammock and a shaded makuti veranda.', 'Bofa, Kilifi', 'cottage', 4, 2, 2, 2, ARRAY['Wi-Fi','Garden','Outdoor shower','Kitchen','Free parking','Fan'], ARRAY['No smoking indoors','Pets on request'], 9500, 11000, 1500, 1, 'published', true),
('creekside-penthouse', 'Creekside Penthouse', E'Panoramic views over Kilifi Creek from a top-floor apartment with a wraparound balcony, fast Wi-Fi and a dedicated workspace — ideal for longer remote-work stays.', 'Kilifi Creek, Kenya', 'apartment', 3, 2, 2, 1, ARRAY['Wi-Fi','Workspace','Creek view','Air conditioning','Kitchen','Washing machine'], ARRAY['No smoking','No loud music after 11pm'], 12000, 13500, 1800, 3, 'published', false),
('palm-grove-bungalow', 'Palm Grove Bungalow', E'A relaxed beachfront bungalow set among coconut palms, with a private stretch of sand, barbecue area and space for six guests.', 'Watamu Road, Kilifi', 'bungalow', 6, 3, 4, 2, ARRAY['Beachfront','Wi-Fi','Barbecue','Kitchen','Free parking','Ocean view'], ARRAY['No smoking indoors','No unregistered guests'], 15000, 17500, 2000, 2, 'published', false);

INSERT INTO public.property_images (property_id, url, alt_text, sort_order, is_cover)
SELECT p.id, i.url, i.alt_text, i.sort_order, i.is_cover
FROM public.properties p
JOIN (
  VALUES
    ('ocean-breeze-villa', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=80', 'Ocean Breeze Villa with private pool', 0, true),
    ('ocean-breeze-villa', 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=80', 'Bright living room at Ocean Breeze Villa', 1, false),
    ('ocean-breeze-villa', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=80', 'Master bedroom at Ocean Breeze Villa', 2, false),
    ('coral Cottage', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80', 'Coral Cottage exterior', 0, true),
    ('coral Cottage', 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80', 'Coral Cottage bedroom', 1, false),
    ('coral Cottage', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1600&q=80', 'Coral Cottage garden veranda', 2, false),
    ('creekside-penthouse', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80', 'Creekside Penthouse living space', 0, true),
    ('creekside-penthouse', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80', 'Creekside Penthouse balcony', 1, false),
    ('creekside-penthouse', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80', 'Creekside Penthouse workspace', 2, false),
    ('palm-grove-bungalow', 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1600&q=80', 'Palm Grove Bungalow beachfront', 0, true),
    ('palm-grove-bungalow', 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1600&q=80', 'Palm Grove Bungalow terrace', 1, false),
    ('palm-grove-bungalow', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80', 'Palm Grove Bungalow bedroom', 2, false)
) AS i(slug, url, alt_text, sort_order, is_cover) ON i.slug = p.slug;