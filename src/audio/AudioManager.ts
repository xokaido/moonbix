export class AudioManager {
    ctx: AudioContext;
    muted: boolean = false;

    // Timer warning debounce
    lastTimerWarning: number = 0;
    lastTimerTick: number = 0;

    constructor() {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    playOscillator(freq: number, type: OscillatorType, duration: number, vol: number = 0.1) {
        if (this.muted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playSwing() {
        // Whoosh sound - fast slide down
        this.playOscillator(200, 'sine', 0.2, 0.05);
    }

    playShoot() {
        this.playOscillator(400, 'triangle', 0.1, 0.1);
    }

    playGrab() {
        // Short chirp
        if (this.muted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playScore() {
        // High ding
        this.playOscillator(880, 'sine', 0.3, 0.1); // A5
        setTimeout(() => this.playOscillator(1108, 'sine', 0.3, 0.1), 100); // C#6
    }

    playBurnt() {
        // Low buzz
        this.playOscillator(100, 'sawtooth', 0.4, 0.1);
    }

    playGameOver() {
        // Sad slide
        if (this.muted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 1.0);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.0);

        osc.start();
        osc.stop(this.ctx.currentTime + 1.0);
    }

    // Timer warning sounds - called when time is running low
    playTimerWarning() {
        // Debounce - only play once per second
        const now = Date.now();
        if (now - this.lastTimerWarning < 1000) return;
        this.lastTimerWarning = now;

        if (this.muted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        // Urgent beep - two-tone alarm
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc2.frequency.setValueAtTime(600, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

        osc1.start();
        osc2.start();
        osc1.stop(this.ctx.currentTime + 0.15);
        osc2.stop(this.ctx.currentTime + 0.3);
    }

    playTimerTick() {
        // Sharp tick for countdown - more distinct
        const now = Date.now();
        if (now - this.lastTimerTick < 900) return;
        this.lastTimerTick = now;

        if (this.muted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'square';
        osc.frequency.setValueAtTime(1000, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(500, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    playTimerUrgent() {
        // Very urgent - fast beeping for last 3 seconds
        if (this.muted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        // Triple beep
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(1200, this.ctx.currentTime);

                gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

                osc.start();
                osc.stop(this.ctx.currentTime + 0.08);
            }, i * 100);
        }
    }
}

