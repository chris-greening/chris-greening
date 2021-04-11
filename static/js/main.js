// (async () => {
//     console.log("waiting for variable");
//     while (!window.app2 === null) // define the condition as you like
//         await new Promise(resolve => setTimeout(resolve, 1000));
//     console.log("variable is defined");
// })();
// window.app.initialize();


// window.app.initialize();

var backgroundMusic = document.getElementById("background-song");
var soundEffectsButton = document.getElementById('sound-effects');
var pauseButton = document.getElementById("pause-button");
var crtEffectButton = document.getElementById("crt-effect");
var musicCredit = document.getElementById("music-credit")

function toggleIcon(icon, removeClass, addClass) {
    icon.classList.remove(removeClass);
    icon.classList.add(addClass);
}

soundEffectsButton.onclick = function () {
    if (window.asteroids.presets.soundEnabled) {
        // Turn sound off 
        toggleIcon(soundEffectsButton, "fa-volume-up", "fa-volume-mute");
        musicCredit.style.display = "none";
        backgroundMusic.pause()
    } else {
        // Turn sound on
        toggleIcon(soundEffectsButton, "fa-volume-mute", "fa-volume-up");
        musicCredit.style.display = "inline";
        backgroundMusic.play()
    }
    window.asteroids.presets.soundEnabled = !window.asteroids.presets.soundEnabled;
}

pauseButton.onclick = function () {
    if (window.asteroids.presets.pause) {
        // Play
        toggleIcon(pauseButton, "fa-play", "fa-pause");
    } else {
        // Pause
        toggleIcon(pauseButton, "fa-pause", "fa-play");
    }
    window.asteroids.presets.pause = !window.asteroids.presets.pause;
}

crtEffectButton.onclick = function () {
    var body = document.getElementsByTagName("body")[0];
    if (!window.asteroids.presets.nightMode) {
        nightModeToggle();
    }
    if (window.asteroids.presets.crtEffect) {
        // Remove CRT filter 
        body.classList.remove("crt");
    } else {
        // Add CRT filter
        body.classList.add("crt");
    }
    window.asteroids.presets.crtEffect = !window.asteroids.presets.crtEffect;
}