export type ItemType = 'food' | 'burnt' | 'timer_enhancer' | 'timer_reducer';

export class Item {
    x: number;
    y: number;
    baseY: number; // Original Y for floating animation
    radius: number = 25;
    type: ItemType;
    value: number = 0;
    timeBonus: number = 0;
    emoji: string;
    caught: boolean = false;

    // Animation properties
    time: number = 0;
    floatOffset: number = 0;
    rotation: number = 0;
    scale: number = 1;
    spawnScale: number = 0; // For spawn animation
    phase: number = Math.random() * Math.PI * 2; // Random phase for variety

    constructor(x: number, y: number, type: ItemType) {
        this.x = x;
        this.y = y;
        this.baseY = y;
        this.type = type;

        if (type === 'food') {
            this.value = 10;
            const foods = ['🍕', '🍔', '🍟', '🌭', '🍿', '🍩', '🍪', '🍫', '🍰', '🧁', '🍦', '🍭'];
            this.emoji = foods[Math.floor(Math.random() * foods.length)];
        } else if (type === 'burnt') {
            this.value = -5;
            const burnt = ['💀', '🔥', '💩', '🧨', '☠️', '👻'];
            this.emoji = burnt[Math.floor(Math.random() * burnt.length)];
        } else if (type === 'timer_enhancer') {
            this.timeBonus = 15;
            this.emoji = '⏰';
        } else if (type === 'timer_reducer') {
            this.timeBonus = -5;
            this.emoji = '⌛';
        } else {
            this.emoji = '❓';
        }
    }

    update(dt: number) {
        this.time += dt;

        // Spawn animation
        if (this.spawnScale < 1) {
            this.spawnScale = Math.min(1, this.spawnScale + dt * 3);
        }

        // Floating animation
        this.floatOffset = Math.sin(this.time * 2 + this.phase) * 8;
        this.y = this.baseY + this.floatOffset;

        // Subtle rotation
        this.rotation = Math.sin(this.time * 1.5 + this.phase) * 0.15;

        // Scale pulse (breathing effect)
        this.scale = 1 + Math.sin(this.time * 3 + this.phase) * 0.08;
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.caught) return;

        const displayScale = this.scale * this.spawnScale;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(displayScale, displayScale);

        // Draw glow effect
        this.drawGlow(ctx);

        // Draw shadow
        this.drawShadow(ctx);

        // Draw emoji
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, 0, 0);

        ctx.restore();
    }

    private drawGlow(ctx: CanvasRenderingContext2D) {
        let glowColor = 'rgba(74, 222, 128, 0.4)';
        let innerColor = 'rgba(74, 222, 128, 0.2)';

        if (this.type === 'food') {
            glowColor = 'rgba(74, 222, 128, 0.4)'; // Green
            innerColor = 'rgba(74, 222, 128, 0.2)';
        } else if (this.type === 'burnt') {
            glowColor = 'rgba(248, 113, 113, 0.4)'; // Red
            innerColor = 'rgba(248, 113, 113, 0.2)';
        } else if (this.type === 'timer_enhancer') {
            glowColor = 'rgba(250, 204, 21, 0.6)'; // Yellow/Gold
            innerColor = 'rgba(250, 204, 21, 0.3)';
        } else if (this.type === 'timer_reducer') {
            glowColor = 'rgba(192, 132, 252, 0.6)'; // Purple
            innerColor = 'rgba(192, 132, 252, 0.3)';
        }

        // Outer glow
        const pulse = 1 + Math.sin(this.time * 4) * 0.2;
        const glowSize = 35 * pulse;

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
        gradient.addColorStop(0, innerColor);
        gradient.addColorStop(0.5, glowColor);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    private drawShadow(ctx: CanvasRenderingContext2D) {
        // Drop shadow for depth
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 5;
    }
}
