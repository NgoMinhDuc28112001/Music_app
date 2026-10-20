/**
 * HƯỚNG DẪN THÊM BÀI HÁT & VIDEO CỦA BẠN:
 * 1. Chép nhạc vào thư mục 'music/' (ví dụ: music/song1.mp3)
 * 2. Chép video MP4 vào thư mục 'videos/' (ví dụ: videos/video1.mp4)
 * 3. Điền đường dẫn tương ứng vào danh sách MUSIC_LIST bên dưới.
 */
const MUSIC_LIST = [
    { 
        title: "Gods", 
        artist: "Nightcore Zodiac", 
        src: "music/music1.mp3", 
        video: "videos/video1.mp4" 
    },
    { 
        title: "Monster", 
        artist: "ZeroMizKun", 
        src: "music/music2.mp3", 
        video: "videos/video2.mp4" 
    },
    { 
        title: "Burn It All Down", 
        artist: "Nightcore Zodiac", 
        src: "music/music3.mp3", 
        video: "videos/video3.mp4" 
    },
    { 
        title: "Royalty", 
        artist: "Nightcore Zodiac", 
        src: "music/music4.mp3", 
        video: "videos/video4.mp4" 
    }
];

let currentTrackIndex = 0;
let isPlaying = false;
let isShuffle = false;
let repeatState = 0; // 0: Off, 1: Repeat All, 2: Repeat One
let playPromise = null;

const audio = document.getElementById('audio-player');
const playPauseBtn = document.getElementById('btn-play-pause');
const playIcon = document.getElementById('play-icon');
const prevBtn = document.getElementById('btn-prev');
const nextBtn = document.getElementById('btn-next');
const shuffleBtn = document.getElementById('btn-shuffle');
const repeatBtn = document.getElementById('btn-repeat');
const repeatBadge = document.getElementById('repeat-badge');

const progressBar = document.getElementById('progress-bar');
const currentTimeEl = document.getElementById('current-time');
const totalDurationEl = document.getElementById('total-duration');

const volumeBar = document.getElementById('volume-bar');
const muteBtn = document.getElementById('btn-mute');
const volumeIcon = document.getElementById('volume-icon');

const trackTitle = document.getElementById('track-title');
const trackArtist = document.getElementById('track-artist');
const videoArt = document.getElementById('track-art');
const artworkContainer = document.getElementById('artwork-container');
const visualizerBar = document.getElementById('visualizer-bar');

const playlistContainer = document.getElementById('playlist-container');
const playlistCount = document.getElementById('playlist-count');

window.addEventListener('DOMContentLoaded', () => {
    renderPlaylist();
    if (MUSIC_LIST.length > 0) {
        loadTrack(currentTrackIndex);
    }
});

// Auto recover audio error
audio.addEventListener('error', () => {
    showToast('Đang chuyển bài tiếp theo...');
    pauseTrack();
    setTimeout(() => {
        nextTrack();
    }, 1200);
});

async function loadTrack(index) {
    if (MUSIC_LIST.length === 0) return;

    if (playPromise) {
        try { await playPromise; } catch(e) {}
    }

    if (index < 0) index = MUSIC_LIST.length - 1;
    if (index >= MUSIC_LIST.length) index = 0;
    currentTrackIndex = index;

    const track = MUSIC_LIST[currentTrackIndex];

    // Reset Audio
    audio.pause();
    audio.src = track.src;
    audio.load();

    trackTitle.textContent = track.title;
    trackArtist.textContent = track.artist;
    
    // Set Video MP4 source directly to element to fix display issue
    setVideoSource(track.video);

    progressBar.value = 0;
    currentTimeEl.textContent = '00:00';
    totalDurationEl.textContent = '00:00';

    renderPlaylist();
}

function setVideoSource(url) {
    videoArt.pause();
    // Directly assigning src to HTML5 Video Element forces browser re-render
    videoArt.src = url;
    videoArt.load();
}

function togglePlayPause() {
    if (MUSIC_LIST.length === 0) return;
    if (isPlaying) {
        pauseTrack();
    } else {
        playTrack();
    }
}

async function playTrack() {
    try {
        playPromise = audio.play();
        // Play video in sync with audio
        videoArt.play().catch(() => {});
        await playPromise;
        playPromise = null;

        isPlaying = true;
        playIcon.className = 'fa-solid fa-pause';
        
        artworkContainer.classList.remove('paused');
        artworkContainer.classList.add('playing');
        visualizerBar.classList.remove('paused');
    } catch (err) {
        playPromise = null;
        if (err.name === 'AbortError') return;
        showToast('Hãy kiểm tra đường dẫn nhạc/video trong thư mục!');
    }
}

async function pauseTrack() {
    if (playPromise) {
        try { await playPromise; } catch(e) {}
    }
    audio.pause();
    videoArt.pause(); // Pause video instantly at current frame

    isPlaying = false;
    playIcon.className = 'fa-solid fa-play';

    artworkContainer.classList.remove('playing');
    artworkContainer.classList.add('paused');
    visualizerBar.classList.add('paused');
}

async function nextTrack() {
    if (isShuffle) {
        await playRandomTrack();
    } else {
        currentTrackIndex = (currentTrackIndex + 1) % MUSIC_LIST.length;
        await loadTrack(currentTrackIndex);
        if (isPlaying) await playTrack();
    }
}

async function prevTrack() {
    if (audio.currentTime > 3) {
        audio.currentTime = 0;
    } else {
        currentTrackIndex = (currentTrackIndex - 1 + MUSIC_LIST.length) % MUSIC_LIST.length;
        await loadTrack(currentTrackIndex);
        if (isPlaying) await playTrack();
    }
}

async function playRandomTrack() {
    if (MUSIC_LIST.length <= 1) {
        await loadTrack(0);
    } else {
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * MUSIC_LIST.length);
        } while (randomIndex === currentTrackIndex);
        currentTrackIndex = randomIndex;
        await loadTrack(currentTrackIndex);
    }
    if (isPlaying) await playTrack();
}

audio.addEventListener('timeupdate', () => {
    if (!isNaN(audio.duration) && audio.duration > 0) {
        const progressPercent = (audio.currentTime / audio.duration) * 100;
        progressBar.value = progressPercent;
        currentTimeEl.textContent = formatTime(audio.currentTime);
        totalDurationEl.textContent = formatTime(audio.duration);
    }
});

progressBar.addEventListener('input', (e) => {
    if (!isNaN(audio.duration)) {
        const seekTime = (e.target.value / 100) * audio.duration;
        audio.currentTime = seekTime;
    }
});

audio.addEventListener('ended', () => {
    if (repeatState === 2) {
        audio.currentTime = 0;
        playTrack();
    } else if (repeatState === 1 || currentTrackIndex < MUSIC_LIST.length - 1 || isShuffle) {
        nextTrack();
    } else {
        pauseTrack();
    }
});

volumeBar.addEventListener('input', (e) => {
    const val = e.target.value;
    audio.volume = val / 100;
    updateVolumeIcon(val);
});

muteBtn.addEventListener('click', () => {
    if (audio.volume > 0) {
        audio.dataset.prevVolume = audio.volume;
        audio.volume = 0;
        volumeBar.value = 0;
        updateVolumeIcon(0);
    } else {
        const prev = audio.dataset.prevVolume || 0.8;
        audio.volume = prev;
        volumeBar.value = prev * 100;
        updateVolumeIcon(prev * 100);
    }
});

function updateVolumeIcon(val) {
    if (val == 0) {
        volumeIcon.className = 'fa-solid fa-volume-xmark';
    } else if (val < 50) {
        volumeIcon.className = 'fa-solid fa-volume-low';
    } else {
        volumeIcon.className = 'fa-solid fa-volume-high';
    }
}

shuffleBtn.addEventListener('click', () => {
    isShuffle = !isShuffle;
    shuffleBtn.classList.toggle('active', isShuffle);
    showToast(isShuffle ? 'Đã BẬT phát ngẫu nhiên' : 'Đã TẮT phát ngẫu nhiên');
});

repeatBtn.addEventListener('click', () => {
    repeatState = (repeatState + 1) % 3;
    if (repeatState === 0) {
        repeatBtn.classList.remove('active');
        repeatBadge.classList.add('hidden');
        showToast('Đã TẮT lặp lại');
    } else if (repeatState === 1) {
        repeatBtn.classList.add('active');
        repeatBadge.classList.add('hidden');
        showToast('Lặp lại TẤT CẢ bài hát');
    } else {
        repeatBtn.classList.add('active');
        repeatBadge.classList.remove('hidden');
        showToast('Lặp lại BÀI HÁT HIỆN TẠI');
    }
});

playPauseBtn.addEventListener('click', togglePlayPause);
artworkContainer.addEventListener('click', togglePlayPause);
nextBtn.addEventListener('click', nextTrack);
prevBtn.addEventListener('click', prevTrack);

function renderPlaylist() {
    playlistContainer.innerHTML = '';
    playlistCount.textContent = `${MUSIC_LIST.length} bài hát`;

    MUSIC_LIST.forEach((track, idx) => {
        const isActive = idx === currentTrackIndex;
        const item = document.createElement('div');
        item.className = `playlist-item ${isActive ? 'active' : ''}`;

        item.innerHTML = `
            <div class="item-left">
                <span class="item-num">${idx + 1}</span>
                <div class="item-info">
                    <h4>${track.title}</h4>
                    <p>${track.artist}</p>
                </div>
            </div>
            ${isActive ? '<span class="active-tag">Đang phát</span>' : ''}
        `;

        item.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (currentTrackIndex !== idx) {
                currentTrackIndex = idx;
                await loadTrack(currentTrackIndex);
                await playTrack();
            } else {
                togglePlayPause();
            }
        });

        playlistContainer.appendChild(item);
    });
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function showToast(msg) {
    const toast = document.getElementById('toast-msg');
    const toastText = document.getElementById('toast-text');
    toastText.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 2500);
}