import { Hook } from './Hook';
import { ItemSpawner } from './ItemSpawner';
import { AudioManager } from '../audio/AudioManager';
import { UIManager } from '../ui/UIManager';
import { Background } from './Background';
import { ParticleSystem } from './ParticleSystem';
import { i18n } from '../i18n';

export class Game {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;

    hook: Hook;
    spawner: ItemSpawner;
    audio: AudioManager;
    ui: UIManager;
    background: Background;
    particles: ParticleSystem;

    lastTime: number = 0;
    score: number = 0;
    timeLeft: number = 45;
    gameActive: boolean = false;

    // Screen shake
    shakeIntensity: number = 0;
    shakeOffsetX: number = 0;
    shakeOffsetY: number = 0;

    // Timer warning tracking
    lastWarningSecond: number = 0;

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.audio = new AudioManager();
        this.ui = new UIManager();
        this.background = new Background(this.width, this.height);
        this.particles = new ParticleSystem();
        this.hook = new Hook(this.width / 2, 100);
        this.spawner = new ItemSpawner(this.width, this.height);

        // UI Callbacks
        this.ui.onStart = () => this.start();
        this.ui.onRestart = () => this.start();

        window.addEventListener('resize', () => this.handleResize());

        // Input handling
        this.canvas.addEventListener('click', () => this.handleInput());
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleInput();
        }, { passive: false });

        // Initialize i18n default
        i18n.loadTranslations(localStorage.getItem('moonbix_lang') || 'en');

        // Start loop (but game is not active yet)
        this.loop(0);
    }

    start() {
        this.score = 0;
        this.timeLeft = 45;
        this.lastWarningSecond = 0;
        this.hook = new Hook(this.width / 2, 80);
        this.spawner.spawnItems(10);
        this.gameActive = true;
        this.ui.showGame();
        this.audio.playShoot();

        // Celebration particles at start
        this.particles.emitSparkles(this.width / 2, 80, '#f0b90b', 20);
    }

    handleInput() {
        if (this.gameActive) {
            if (this.hook.state === 'swinging') {
                this.hook.shoot();
                this.audio.playSwing();
            }
        }
    }

    handleResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.hook.x = this.width / 2;
        this.background.resize(this.width, this.height);
    }

    loop(timestamp: number) {
        if (!this.lastTime) this.lastTime = timestamp;
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        // Always update background for animations
        this.background.update(dt);
        this.particles.update(dt);

        if (this.gameActive) {
            this.update(dt);
        }

        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt: number) {
        // Timer logic with audio warnings
        if (this.timeLeft > 0) {
            this.timeLeft -= dt;

            const currentSecond = Math.ceil(this.timeLeft);

            // Timer audio warnings
            if (currentSecond !== this.lastWarningSecond && currentSecond <= 10 && currentSecond > 0) {
                this.lastWarningSecond = currentSecond;

                if (currentSecond <= 3) {
                    // Very urgent - last 3 seconds
                    this.audio.playTimerUrgent();
                    this.shakeIntensity = 8;
                } else if (currentSecond <= 5) {
                    // Countdown ticks
                    this.audio.playTimerTick();
                    this.shakeIntensity = 4;
                } else {
                    // Warning beeps (10-6 seconds)
                    this.audio.playTimerWarning();
                    this.shakeIntensity = 2;
                }
            }

            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }

        // Update screen shake
        if (this.shakeIntensity > 0) {
            this.shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeIntensity *= 0.9;
            if (this.shakeIntensity < 0.5) this.shakeIntensity = 0;
        } else {
            this.shakeOffsetX = 0;
            this.shakeOffsetY = 0;
        }

        this.hook.update(dt);
        this.spawner.update(dt);
        this.ui.updateHUD(this.score, this.timeLeft);

        // Emit trail particles when hook is extending
        if (this.hook.state === 'extending') {
            const tip = this.hook.getTipPosition();
            if (Math.random() < 0.3) {
                this.particles.emitTrail(tip.x, tip.y);
            }
        }

        // Collision detection
        if (this.hook.state === 'extending') {
            const tip = this.hook.getTipPosition();

            // Check wall collision
            if (tip.x < 0 || tip.x > this.width || tip.y > this.height) {
                this.hook.state = 'retracting';
            }

            // Check item collision
            for (const item of this.spawner.items) {
                if (!item.caught) {
                    const dx = tip.x - item.x;
                    const dy = tip.y - item.y;
                    if (Math.sqrt(dx * dx + dy * dy) < (item.radius + 10)) {
                        this.hook.caughtItem = item;
                        item.caught = true;
                        this.hook.state = 'retracting';
                        this.audio.playGrab();

                        // Emit sparkles on grab
                        let color = '#4ade80';
                        if (item.type === 'food') color = '#4ade80';
                        else if (item.type === 'burnt') color = '#f87171';
                        else if (item.type === 'timer_enhancer') color = '#facc15';
                        else if (item.type === 'timer_reducer') color = '#c084fc';

                        this.particles.emitSparkles(item.x, item.y, color, 8);
                        break;
                    }
                }
            }
        } else if (this.hook.state === 'swinging' && this.hook.caughtItem) {
            // Returned with item
            const val = this.hook.caughtItem.value;
            const timeBonus = this.hook.caughtItem.timeBonus;
            const itemX = this.width / 2;
            const itemY = 80;

            this.score += val;
            this.timeLeft += timeBonus;

            if (val > 0 || timeBonus > 0) {
                this.audio.playScore();
                const color = timeBonus > 0 ? '#facc15' : '#4ade80';
                this.particles.emitSparkles(itemX, itemY, color, 15);
            } else if (val < 0 || timeBonus < 0) {
                this.audio.playBurnt();
                const color = timeBonus < 0 ? '#c084fc' : '#f87171';
                this.particles.emitSparkles(itemX, itemY, color, 10);
                this.shakeIntensity = 5; // Screen shake on negative score/time
            }

            // Emit score or time popup
            if (timeBonus !== 0) {
                const sign = timeBonus > 0 ? '+' : '';
                this.particles.emitScore(itemX, itemY - 30, `${sign}${timeBonus}s` as any);
            } else {
                this.particles.emitScore(itemX, itemY - 30, val);
            }

            this.spawner.items = this.spawner.items.filter(i => i !== this.hook.caughtItem);
            this.hook.caughtItem = null;

            if (this.spawner.items.length < 3) {
                this.spawner.spawnItems(5);
            }
        }
    }

    endGame() {
        this.timeLeft = 0;
        this.gameActive = false;
        this.audio.playGameOver();

        // Save High Score
        const high = parseInt(localStorage.getItem('moonbix_highscore') || '0');
        if (this.score > high) {
            localStorage.setItem('moonbix_highscore', this.score.toString());
        }

        // Celebration or consolation particles
        if (this.score > 0) {
            this.particles.emitConfetti(this.width / 2, this.height / 2, 80);
        }

        this.ui.showGameOver(this.score);
    }

    draw() {
        this.ctx.save();

        // Apply screen shake
        if (this.shakeIntensity > 0) {
            this.ctx.translate(this.shakeOffsetX, this.shakeOffsetY);
        }

        // Draw background first
        this.background.draw(this.ctx);

        if (this.gameActive || this.hook.state !== 'swinging') {
            this.spawner.draw(this.ctx);
            this.hook.draw(this.ctx);
        }

        // Draw hook base with enhanced glow
        this.drawHookBase();

        // Draw particles on top
        this.particles.draw(this.ctx);

        this.ctx.restore();
    }

    private drawHookBase() {
        const centerX = this.width / 2;
        const centerY = 80;

        // Outer glow ring
        const gradient = this.ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, 35
        );
        gradient.addColorStop(0, '#f0b90b');
        gradient.addColorStop(0.5, 'rgba(240, 185, 11, 0.3)');
        gradient.addColorStop(1, 'rgba(240, 185, 11, 0)');

        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 35, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // Main base with metallic gradient
        const metalGradient = this.ctx.createRadialGradient(
            centerX - 5, centerY - 5, 0,
            centerX, centerY, 22
        );
        metalGradient.addColorStop(0, '#ffd700');
        metalGradient.addColorStop(0.5, '#f0b90b');
        metalGradient.addColorStop(1, '#b8860b');

        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 22, 0, Math.PI * 2);
        this.ctx.fillStyle = metalGradient;
        this.ctx.fill();

        // Inner ring
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Highlight
        this.ctx.beginPath();
        this.ctx.arc(centerX - 6, centerY - 6, 5, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.fill();
    }
}

