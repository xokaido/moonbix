interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;
    type: 'sparkle' | 'score' | 'trail' | 'confetti';
    text?: string;
    rotation?: number;
    rotationSpeed?: number;
}

export class ParticleSystem {
    particles: Particle[] = [];

    update(dt: number) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            p.x += p.vx * dt * 60;
            p.y += p.vy * dt * 60;
            p.life -= dt;

            // Gravity for confetti
            if (p.type === 'confetti') {
                p.vy += 0.5 * dt * 60;
                if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
                    p.rotation += p.rotationSpeed * dt * 60;
                }
            }

            // Float up for score particles
            if (p.type === 'score') {
                p.vy *= 0.95;
            }

            // Slow down sparkles
            if (p.type === 'sparkle') {
                p.vx *= 0.95;
                p.vy *= 0.95;
            }

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    emitSparkles(x: number, y: number, color: string, count: number = 12) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const speed = 3 + Math.random() * 4;

            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.5 + Math.random() * 0.5,
                maxLife: 1,
                size: 3 + Math.random() * 3,
                color,
                type: 'sparkle'
            });
        }
    }

    emitScore(x: number, y: number, score: number) {
        const isPositive = score > 0;
        this.particles.push({
            x,
            y,
            vx: 0,
            vy: -3,
            life: 1.5,
            maxLife: 1.5,
            size: 24,
            color: isPositive ? '#4ade80' : '#f87171',
            type: 'score',
            text: isPositive ? `+${score}` : `${score}`
        });
    }

    emitTrail(x: number, y: number) {
        this.particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 0.3,
            maxLife: 0.3,
            size: 2 + Math.random() * 2,
            color: '#f0b90b',
            type: 'trail'
        });
    }

    emitConfetti(x: number, y: number, count: number = 50) {
        const colors = ['#f0b90b', '#4ade80', '#60a5fa', '#f472b6', '#a78bfa'];

        for (let i = 0; i < count; i++) {
            this.particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 15,
                vy: -8 - Math.random() * 8,
                life: 2 + Math.random() * 2,
                maxLife: 4,
                size: 4 + Math.random() * 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                type: 'confetti',
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.3
            });
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        for (const p of this.particles) {
            const alpha = Math.min(1, p.life / (p.maxLife * 0.3));

            if (p.type === 'sparkle') {
                this.drawSparkle(ctx, p, alpha);
            } else if (p.type === 'score') {
                this.drawScore(ctx, p, alpha);
            } else if (p.type === 'trail') {
                this.drawTrail(ctx, p, alpha);
            } else if (p.type === 'confetti') {
                this.drawConfetti(ctx, p, alpha);
            }
        }
    }

    private drawSparkle(ctx: CanvasRenderingContext2D, p: Particle, alpha: number) {
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
        glow.addColorStop(0, `${p.color}`);
        glow.addColorStop(0.5, `${p.color}80`);
        glow.addColorStop(1, 'transparent');

        ctx.globalAlpha = alpha;
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx.fill();

        // Inner bright core
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    private drawScore(ctx: CanvasRenderingContext2D, p: Particle, alpha: number) {
        ctx.globalAlpha = alpha;
        ctx.font = `bold ${p.size}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillText(p.text || '', p.x + 2, p.y + 2);

        // Text
        ctx.fillStyle = p.color;
        ctx.fillText(p.text || '', p.x, p.y);
        ctx.globalAlpha = 1;
    }

    private drawTrail(ctx: CanvasRenderingContext2D, p: Particle, alpha: number) {
        ctx.globalAlpha = alpha * 0.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    private drawConfetti(ctx: CanvasRenderingContext2D, p: Particle, alpha: number) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
    }
}
