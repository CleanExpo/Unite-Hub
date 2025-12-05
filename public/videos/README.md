# Video Assets

This directory contains video files used throughout the application.

## Missing Videos

The following video file is referenced in the codebase but not yet uploaded:

- `scattered-leads.mp4`

## Video Specifications

For optimal performance and compatibility:

- **Format:** MP4 (H.264 codec)
- **Resolution:** 1920x1080 (Full HD) or 1280x720 (HD)
- **Max File Size:** 50MB (consider compression for web)
- **Frame Rate:** 30fps
- **Aspect Ratio:** 16:9

## Upload Instructions

1. Place video files directly in this directory (`public/videos/`)
2. Videos will be accessible at `/videos/filename.mp4`
3. Update corresponding code references if filenames change

## Optimization

For better web performance, consider:
- Compressing videos with tools like HandBrake or FFmpeg
- Creating multiple resolutions for adaptive streaming
- Generating thumbnails with `npm run generate:thumbnails`
