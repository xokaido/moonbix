import { Item } from './Item';

export type HookState = 'swinging' | 'extending' | 'retracting';

export class Hook {
    x: number;
    y: number;
    length: number = 50;
    maxLength: number = 800;
    angle: number = Math.PI / 2;
    swingSpeed: number = 0.03;
    extendSpeed: number = 15;
    retractSpeed: number = 20;
    state: HookState = 'swinging';
    swingDirection: number = 1;
    caughtItem: Item | null = null;

    // Animation properties
    time: number = 0;
    clawOpen: number = 0; // 0 = closed, 1 = open
    glowIntensity: number = 0;

    readonly minAngle = Math.PI / 6;
    readonly maxAngle = 5 * Math.PI / 6;

    // Chain segment size
    readonly segmentLength = 12;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    update(dt: number) {
        this.time += dt;

        // Animate claw based on state
        if (this.state === 'extending') {
            this.clawOpen = Math.min(1, this.clawOpen + dt * 5);
            this.glowIntensity = Math.min(1, this.glowIntensity + dt * 3);
        } else if (this.state === 'retracting' && this.caughtItem) {
            this.clawOpen = Math.max(0, this.clawOpen - dt * 3);
        } else {
            this.clawOpen = 0.3 + Math.sin(this.time * 2) * 0.1;
            this.glowIntensity = 0.3 + Math.sin(this.time * 3) * 0.2;
        }

        if (this.state === 'swinging') {
            this.angle += (1.8 * dt) * this.swingDirection;
            if (this.angle >= this.maxAngle || this.angle <= this.minAngle) {
                this.swingDirection *= -1;
            }
        } else if (this.state === 'extending') {
            this.length += this.extendSpeed * (dt * 60);
        } else if (this.state === 'retracting') {
            this.length -= this.retractSpeed * (dt * 60);
            if (this.caughtItem) {
                this.caughtItem.x = this.x + Math.cos(this.angle) * this.length;
                this.caughtItem.y = this.y + Math.sin(this.angle) * this.length;
            }

            if (this.length <= 50) {
                this.length = 50;
                this.state = 'swinging';
            }
        }
    }

    shoot() {
        if (this.state === 'swinging') {
            this.state = 'extending';
        }
    }

    getTipPosition() {
        return {
            x: this.x + Math.cos(this.angle) * this.length,
            y: this.y + Math.sin(this.angle) * this.length
        };
    }

    draw(ctx: CanvasRenderingContext2D) {
        const tip = this.getTipPosition();

        // Draw chain/rope with gradient
        this.drawChain(ctx, tip);

        // Draw hook head with glow
        this.drawHookHead(ctx, tip);

        // Draw claws
        this.drawClaws(ctx, tip);
    }

    private drawChain(ctx: CanvasRenderingContext2D, tip: { x: number; y: number }) {
        const numSegments = Math.floor(this.length / this.segmentLength);
        const dx = (tip.x - this.x) / numSegments;
        const dy = (tip.y - this.y) / numSegments;

        // Rope gradient
        const gradient = ctx.createLinearGradient(this.x, this.y, tip.x, tip.y);
        gradient.addColorStop(0, '#f0b90b');
        gradient.addColorStop(0.3, '#d4a000');
        gradient.addColorStop(0.7, '#b8860b');
        gradient.addColorStop(1, '#cd853f');

        // Draw main rope line
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(tip.x, tip.y);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Draw chain links
        for (let i = 1; i < numSegments; i++) {
            const linkX = this.x + dx * i;
            const linkY = this.y + dy * i;

            // Alternating link orientation
            const perpAngle = this.angle + Math.PI / 2;
            const offset = (i % 2 === 0 ? 2 : -2);

            ctx.beginPath();
            ctx.ellipse(
                linkX + Math.cos(perpAngle) * offset,
                linkY + Math.sin(perpAngle) * offset,
                4, 6,
                this.angle,
                0, Math.PI * 2
            );
            ctx.strokeStyle = i % 2 === 0 ? '#ffd700' : '#c5a200';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Motion blur effect when extending
        if (this.state === 'extending') {
            ctx.globalAlpha = 0.3;
            for (let i = 1; i <= 3; i++) {
                const blurLength = this.length - i * 20;
                if (blurLength > 50) {
                    const blurTip = {
                        x: this.x + Math.cos(this.angle) * blurLength,
                        y: this.y + Math.sin(this.angle) * blurLength
                    };
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(blurTip.x, blurTip.y);
                    ctx.strokeStyle = `rgba(240, 185, 11, ${0.3 - i * 0.1})`;
                    ctx.lineWidth = 4 + i * 2;
                    ctx.stroke();
                }
            }
            ctx.globalAlpha = 1;
        }
    }

    private drawHookHead(ctx: CanvasRenderingContext2D, tip: { x: number; y: number }) {
        // Outer glow
        const glowSize = 20 + this.glowIntensity * 10;
        const glow = ctx.createRadialGradient(
            tip.x, tip.y, 0,
            tip.x, tip.y, glowSize
        );
        glow.addColorStop(0, `rgba(240, 185, 11, ${0.6 * this.glowIntensity})`);
        glow.addColorStop(0.5, `rgba(240, 185, 11, ${0.2 * this.glowIntensity})`);
        glow.addColorStop(1, 'rgba(240, 185, 11, 0)');

        ctx.beginPath();
        ctx.arc(tip.x, tip.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Hook head gradient
        const headGradient = ctx.createRadialGradient(
            tip.x - 3, tip.y - 3, 0,
            tip.x, tip.y, 12
        );
        headGradient.addColorStop(0, '#ffffff');
        headGradient.addColorStop(0.3, '#f0e68c');
        headGradient.addColorStop(1, '#daa520');

        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = headGradient;
        ctx.fill();

        // Shine highlight
        ctx.beginPath();
        ctx.arc(tip.x - 3, tip.y - 3, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
    }

    private drawClaws(ctx: CanvasRenderingContext2D, tip: { x: number; y: number }) {
        const clawLength = 20;
        const baseAngle = this.angle + Math.PI; // Point back towards base
        const spread = (Math.PI / 4) * (1 + this.clawOpen * 0.5); // How wide claws spread

        // Three claws
        const clawAngles = [baseAngle - spread, baseAngle, baseAngle + spread];

        for (const clawAngle of clawAngles) {
            const endX = tip.x + Math.cos(clawAngle) * clawLength;
            const endY = tip.y + Math.sin(clawAngle) * clawLength;

            // Curved claw
            const controlX = tip.x + Math.cos(clawAngle) * clawLength * 0.6;
            const controlY = tip.y + Math.sin(clawAngle) * clawLength * 0.6;
            const curveOffset = clawAngle === baseAngle ? 0 : (clawAngle < baseAngle ? 8 : -8);

            ctx.beginPath();
            ctx.moveTo(tip.x, tip.y);
            ctx.quadraticCurveTo(
                controlX + Math.cos(clawAngle + Math.PI / 2) * curveOffset,
                controlY + Math.sin(clawAngle + Math.PI / 2) * curveOffset,
                endX, endY
            );

            // Gradient for claw
            const clawGradient = ctx.createLinearGradient(tip.x, tip.y, endX, endY);
            clawGradient.addColorStop(0, '#ffd700');
            clawGradient.addColorStop(1, '#8b7500');

            ctx.strokeStyle = clawGradient;
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.stroke();

            // Claw tip
            ctx.beginPath();
            ctx.arc(endX, endY, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#ffd700';
            ctx.fill();
        }
    }
}
