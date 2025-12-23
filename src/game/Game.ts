import { Hook } from './Hook';
import { ItemSpawner } from './ItemSpawner';
import { AudioManager } from '../audio/AudioManager';
import { UIManager } from '../ui/UIManager';
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

    lastTime: number = 0;
    score: number = 0;
    timeLeft: number = 45;
    gameActive: boolean = false;

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.audio = new AudioManager();
        this.ui = new UIManager();
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
        this.hook = new Hook(this.width / 2, 80);
        this.spawner.spawnItems(10);
        this.gameActive = true;
        this.ui.showGame();
        this.audio.playShoot(); // Small sound to indicate start
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
        // Potentially respawn items if resize is drastic, but keeping it simple for now
    }

    loop(timestamp: number) {
        if (!this.lastTime) this.lastTime = timestamp;
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        if (this.gameActive) {
            this.update(dt);
        }

        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt: number) {
        if (this.timeLeft > 0) {
            this.timeLeft -= dt;
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }

        this.hook.update(dt);
        this.ui.updateHUD(this.score, this.timeLeft);

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
                    // Simple circle collision
                    if (Math.sqrt(dx * dx + dy * dy) < (item.radius + 10)) { // +10 for hook head size
                        this.hook.caughtItem = item;
                        item.caught = true;
                        this.hook.state = 'retracting';
                        this.audio.playGrab();
                        break;
                    }
                }
            }
        } else if (this.hook.state === 'swinging' && this.hook.caughtItem) {
            // Returned with item
            const val = this.hook.caughtItem.value;
            this.score += val;
            if (val > 0) this.audio.playScore();
            else this.audio.playBurnt();

            this.spawner.items = this.spawner.items.filter(i => i !== this.hook.caughtItem);
            this.hook.caughtItem = null;

            // Spawn new item if few left?
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

        this.ui.showGameOver(this.score);
    }

    draw() {
        // Clear background
        this.ctx.clearRect(0, 0, this.width, this.height);

        if (this.gameActive || this.hook.state !== 'swinging') {
            this.spawner.draw(this.ctx);
            this.hook.draw(this.ctx);
        }
        // Draw hook base always?
        this.ctx.beginPath();
        this.ctx.arc(this.width / 2, 80, 20, 0, Math.PI * 2);
        this.ctx.fillStyle = '#f0b90b';
        this.ctx.fill();
    }
}
