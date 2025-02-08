<script>
    export let audioUrl = '';

    let audioRef;

    $: if (audioRef && audioUrl) {
        audioRef.src = audioUrl;
        // Optionally, load the audio or handle errors
        audioRef.load();
    }

    function togglePlay() {
        if (audioRef && audioRef.paused) {
            audioRef.play();
        } else if (audioRef) {
            audioRef.pause();
            audioRef.currentTime = 0;
        }
    }
</script>

<!-- Adjusted layout to include reactive audio source -->
<div><div class="mb-2">Your audio file is ready:</div>
    <button on:click={togglePlay}><span class="playbutton">▶ Play</span></button>
    | <span class="downloadbutton"><a href="{audioUrl}" download="response.mp3">⇓ Download</a></span><div class="notice">(unavailable after refresh!)</div>
    <audio bind:this={audioRef} style="display: none;"></audio>
</div>

  

<style>
.playbutton, .downloadbutton {
    color: lightblue;
}
.playbutton:hover, .downloadbutton:hover {
    color: lightblue;
    text-decoration: underline;
}

.notice {
    font-size: 0.8em;
    color: rgb(196, 196, 87);
}
</style>