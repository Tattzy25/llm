# Image Slug Service Setup

This service provides branded image URLs using human-readable slugs that map to Supabase storage files.

## Features

- **Branded URLs**: `https://digitalhustlelab.com/i/:slug`
- **Supabase Storage**: Uses the `image_convert` bucket with `Model_cards` and `Provider_icons` folders
- **Database Mapping**: PostgreSQL table `image_slugs` maps slugs to storage keys
- **Caching**: Proper HTTP caching headers for performance
- **No Auth**: Public access for branded image serving

## Database Setup

### 1. Create the image_slugs table

Run this SQL in your Supabase SQL Editor:

```sql
-- Image Slugs table for branded image URLs
CREATE TABLE image_slugs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  storage_key TEXT NOT NULL,
  bucket_name TEXT NOT NULL DEFAULT 'image_convert',
  content_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$' AND char_length(slug) >= 1 AND char_length(slug) <= 100),
  CONSTRAINT storage_key_format CHECK (char_length(storage_key) >= 1 AND char_length(storage_key) <= 500)
);

-- Add trigger for updated_at
CREATE TRIGGER update_image_slugs_updated_at
  BEFORE UPDATE ON image_slugs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add indexes
CREATE INDEX idx_image_slugs_slug ON image_slugs(slug);
CREATE INDEX idx_image_slugs_storage_key ON image_slugs(storage_key);

-- Enable RLS
ALTER TABLE image_slugs ENABLE ROW LEVEL SECURITY;

-- Public read access policy
CREATE POLICY "Public read access for image slugs" ON image_slugs
  FOR SELECT USING (true);
```

### 2. Create the image_convert bucket

Run this SQL or use the Supabase dashboard:

```sql
-- This will be handled by the API route: POST /api/setup/image-convert-bucket
```

## API Endpoints

### Image Serving
- **GET** `/i/:slug` - Serve image by slug with proper headers

### Management Endpoints
- **POST** `/api/images/upload` - Upload images and create slugs
- **GET** `/api/images/list` - List all image slugs
- **DELETE** `/api/images/delete?slug=:slug` - Delete image by slug

### Setup Endpoints
- **POST** `/api/setup/image-convert-bucket` - Create the storage bucket

## Usage Examples

### Upload an Image
```bash
curl -X POST http://localhost:3000/api/images/upload \
  -F "files=@model-card.jpg" \
  -F "folder=Model_cards"
```

Response:
```json
{
  "success": true,
  "results": [{
    "slug": "model-card",
    "storageKey": "Model_cards/model-card.jpg",
    "publicUrl": "https://digitalhustlelab.com/i/model-card",
    "contentType": "image/jpeg",
    "fileSize": 12345
  }]
}
```

### Access Branded URL
```
https://digitalhustlelab.com/i/model-card
```

This will serve the image with:
- Content-Type: image/jpeg
- Cache-Control: public, max-age=31536000, immutable
- ETag: "model-card-{timestamp}"

## File Structure

```
app/
  i/
    [slug]/
      route.ts          # Main image serving endpoint
  api/
    images/
      upload/
        route.ts        # Upload images
      list/
        route.ts        # List images
      delete/
        route.ts        # Delete images
    setup/
      image-convert-bucket/
        route.ts        # Create bucket
database/
  schema.sql            # Updated with image_slugs table
lib/
  database.ts           # Updated with imageSlugsDB
  image-slug-utils.ts   # Utility functions
```

## Environment Variables

Make sure these are set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` (for branded URLs)

## Security Notes

- No authentication required for image serving
- Public bucket access for performance
- RLS policies allow public read access
- Service role key used for storage operations
- Input validation on slugs and file types
