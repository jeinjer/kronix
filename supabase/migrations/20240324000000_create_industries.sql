-- Create industries table
CREATE TABLE IF NOT EXISTS public.industries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.industries ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read access for industries" ON public.industries
    FOR SELECT USING (true);

-- Insert initial current industries and images
INSERT INTO public.industries (id, name, image_url)
VALUES 
    ('barberia', 'Barbería', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=200&h=200&fit=crop'),
    ('peluqueria', 'Peluquería', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&h=200&fit=crop'),
    ('estetica', 'Estética', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop'),
    ('spa', 'Spa', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=200&h=200&fit=crop'),
    ('manicura', 'Manicura', 'https://images.unsplash.com/photo-1519014816548-bf5fe059e98b?w=200&h=200&fit=crop'),
    ('beauty', 'Belleza', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&h=200&fit=crop'),
    ('automotive', 'Automotor', 'https://images.unsplash.com/photo-1596707325251-ce0aebbf9ecf?w=200&h=200&fit=crop'),
    ('health', 'Salud', 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=200&h=200&fit=crop'),
    ('fitness', 'Fitness', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&h=200&fit=crop'),
    ('deportes', 'Deportes', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=200&h=200&fit=crop')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    image_url = EXCLUDED.image_url;
