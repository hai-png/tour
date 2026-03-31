# Audio Files Directory

## Adding Background Music

1. **Create audio files** (MP3 format recommended):
   - Bitrate: 128-192 kbps
   - Sample rate: 44.1 kHz
   - Format: MP3 or AAC

2. **Place files in this directory**:
   ```
   media/
     audio/
       ambient-01.mp3
       ambient-02.mp3
       ambient-03.mp3
   ```

3. **Update AudioManager.js** playlist:
   ```javascript
   this.playlist = [
     {
       id: 1,
       title: 'Ambient Lounge',
       artist: 'Background Music',
       url: 'media/audio/ambient-01.mp3'
     },
     {
       id: 2,
       title: 'Peaceful Atmosphere',
       artist: 'Ambient Sounds',
       url: 'media/audio/ambient-02.mp3'
     }
   ];
   ```

## Adding Narration for Guided Tour

1. **Record narration** for each scene:
   - Format: MP3
   - Quality: 128 kbps mono is sufficient
   - Keep files under 1-2 minutes each

2. **Place narration files**:
   ```
   media/
     audio/
       narration/
         scene-01.mp3
         scene-02.mp3
         scene-03.mp3
   ```

3. **Update GuidedTourManager.js**:
   ```javascript
   getNarrationForScene(index) {
     const audioFiles = [
       'media/audio/narration/scene-01.mp3',
       'media/audio/narration/scene-02.mp3',
       'media/audio/narration/scene-03.mp3'
     ];
     
     return {
       text: "Your narration text here",
       audioUrl: audioFiles[index]
     };
   }
   ```

## Recommended Audio Sources

### Free Royalty-Free Music:
- **YouTube Audio Library** - Free music for videos
- **Free Music Archive** - Creative Commons music
- **Incompetech** - Kevin MacLeod's royalty-free music
- **Bensound** - Free with attribution
- **Purple Planet** - Free ambient music

### Paid Options:
- **Epidemic Sound** - High-quality royalty-free
- **Artlist** - Unlimited license
- **AudioJungle** - Pay per track
- **MusicBed** - Premium licensing

## Audio Optimization Tips

1. **Compress audio** for web:
   ```bash
   ffmpeg -i input.wav -codec:a libmp3lame -b:a 128k output.mp3
   ```

2. **Normalize volume** across tracks:
   ```bash
   ffmpeg -i input.mp3 -af loudnorm output-normalized.mp3
   ```

3. **Fade in/out** for smooth transitions:
   ```bash
   ffmpeg -i input.mp3 -af "afade=t=in:st=0:d=2,afade=t=out:st=58:d=2" output.mp3
   ```

## Testing Audio

1. Open the virtual tour in a browser
2. Click the play button in the music player
3. Adjust volume in settings
4. Test mute/unmute with 'M' key
5. Start guided tour to test narration

## Troubleshooting

**Audio doesn't play:**
- Check browser console for errors
- Verify file paths are correct
- Ensure files are valid MP3 format
- Check CORS headers if hosting externally

**Audio cuts out:**
- Reduce bitrate to 96-128 kbps
- Shorten track length
- Check for network issues

**Narration doesn't sync:**
- Adjust scene duration in GuidedTourManager
- Trim audio files to match scene transitions
