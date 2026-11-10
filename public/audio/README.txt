Put your track in this folder and call it  music.mp3

    public/audio/music.mp3

That is the only step. The page picks it up on its own, loops it, and
fades it in and out when the speaker button is pressed.

To use a different name or format (.m4a, .ogg, .wav all work), change
CONFIG.music at the top of public/extras.js to match.
CONFIG.musicVolume there sets how loud it sits, 0 to 1.

If no file is found the page falls back to the pad it synthesises
itself, so nothing breaks while this folder is empty.
