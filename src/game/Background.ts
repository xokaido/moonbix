interface Star {
    x: number;
    y: number;
    size: number;
    speed: number;
    opacity: number;
    twinkleSpeed: number;
    twinklePhase: number;
}

interface ShootingStar {
    x: number;
    y: number;
    length: number;
    speed: number;
    angle: number;
    opacity: number;
    life: number;
}

export class Background {
    width: number;
    height: number;
    stars: Star[][] = [[], [], []]; // 3 layers for parallax
    shootingStars: ShootingStar[] = [];
    time: number = 0;

    // Nebula colors
    nebulaHue: number = 0;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.initStars();
    }

    initStars() {
        const counts = [100, 60, 30]; // More small stars, fewer large ones
        const sizes = [1, 2, 3];
        const speeds = [0.1, 0.3, 0.5];

        for (let layer = 0; layer < 3; layer++) {
            this.stars[layer] = [];
            for (let i = 0; i < counts[layer]; i++) {
                this.stars[layer].push({
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    size: sizes[layer] + Math.random() * 0.5,
                    speed: speeds[layer],
                    opacity: 0.3 + Math.random() * 0.7,
                    twinkleSpeed: 0.5 + Math.random() * 2,
                    twinklePhase: Math.random() * Math.PI * 2
                });
            }
        }
    }

    resize(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.initStars();
    }

    update(dt: number) {
        this.time += dt;
        this.nebulaHue = (this.nebulaHue + dt * 2) % 360;

        // Update stars
        for (let layer = 0; layer < 3; layer++) {
            for (const star of this.stars[layer]) {
                star.y += star.speed * dt * 60;
                if (star.y > this.height) {
                    star.y = 0;
                    star.x = Math.random() * this.width;
                }
            }
        }

        // Spawn shooting stars occasionally
        if (Math.random() < 0.002) {
            this.spawnShootingStar();
        }

        // Update shooting stars
        for (let i = this.shootingStars.length - 1; i >= 0; i--) {
            const ss = this.shootingStars[i];
            ss.x += Math.cos(ss.angle) * ss.speed * dt * 60;
            ss.y += Math.sin(ss.angle) * ss.speed * dt * 60;
            ss.life -= dt;
            ss.opacity = ss.life * 2;

            if (ss.life <= 0) {
                this.shootingStars.splice(i, 1);
            }
        }
    }

    spawnShootingStar() {
        this.shootingStars.push({
            x: Math.random() * this.width,
            y: Math.random() * this.height * 0.3,
            length: 50 + Math.random() * 100,
            speed: 15 + Math.random() * 10,
            angle: Math.PI / 4 + Math.random() * 0.5, // Diagonal down-right
            opacity: 1,
            life: 0.5 + Math.random() * 0.5
        });
    }

    draw(ctx: CanvasRenderingContext2D) {
        // Deep space gradient background
        const gradient = ctx.createRadialGradient(
            this.width / 2, this.height * 0.3, 0,
            this.width / 2, this.height * 0.3, Math.max(this.width, this.height)
        );
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f0f1a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);

        // Subtle nebula effect
        this.drawNebula(ctx);

        // Draw stars (back to front for proper layering)
        for (let layer = 0; layer < 3; layer++) {
            for (const star of this.stars[layer]) {
                const twinkle = Math.sin(this.time * star.twinkleSpeed + star.twinklePhase);
                const opacity = star.opacity * (0.6 + twinkle * 0.4);

                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);

                // Larger stars get a glow
                if (layer === 2) {
                    const glow = ctx.createRadialGradient(
                        star.x, star.y, 0,
                        star.x, star.y, star.size * 4
                    );
                    glow.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
                    glow.addColorStop(0.3, `rgba(200, 220, 255, ${opacity * 0.3})`);
                    glow.addColorStop(1, 'rgba(200, 220, 255, 0)');
                    ctx.fillStyle = glow;
                    ctx.arc(star.x, star.y, star.size * 4, 0, Math.PI * 2);
                } else {
                    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                }
                ctx.fill();
            }
        }

        // Draw shooting stars
        for (const ss of this.shootingStars) {
            const tailX = ss.x - Math.cos(ss.angle) * ss.length;
            const tailY = ss.y - Math.sin(ss.angle) * ss.length;

            const gradient = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
            gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
            gradient.addColorStop(1, `rgba(255, 255, 255, ${ss.opacity})`);

            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(ss.x, ss.y);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Bright head
            ctx.beginPath();
            ctx.arc(ss.x, ss.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${ss.opacity})`;
            ctx.fill();
        }

        // Draw hook base glow
        this.drawHookBaseGlow(ctx);
    }

    drawNebula(ctx: CanvasRenderingContext2D) {
        // Subtle nebula clouds
        const hue1 = (this.nebulaHue + 200) % 360;
        const hue2 = (this.nebulaHue + 280) % 360;

        ctx.globalAlpha = 0.03;

        // First nebula cloud
        const grad1 = ctx.createRadialGradient(
            this.width * 0.2, this.height * 0.4, 0,
            this.width * 0.2, this.height * 0.4, this.width * 0.4
        );
        grad1.addColorStop(0, `hsla(${hue1}, 70%, 50%, 1)`);
        grad1.addColorStop(1, 'transparent');
        ctx.fillStyle = grad1;
        ctx.fillRect(0, 0, this.width, this.height);

        // Second nebula cloud
        const grad2 = ctx.createRadialGradient(
            this.width * 0.8, this.height * 0.6, 0,
            this.width * 0.8, this.height * 0.6, this.width * 0.5
        );
        grad2.addColorStop(0, `hsla(${hue2}, 70%, 50%, 1)`);
        grad2.addColorStop(1, 'transparent');
        ctx.fillStyle = grad2;
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.globalAlpha = 1;
    }

    drawHookBaseGlow(ctx: CanvasRenderingContext2D) {
        const centerX = this.width / 2;
        const centerY = 80;
        const pulseScale = 1 + Math.sin(this.time * 3) * 0.2;

        const glow = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, 60 * pulseScale
        );
        glow.addColorStop(0, 'rgba(240, 185, 11, 0.4)');
        glow.addColorStop(0.5, 'rgba(240, 185, 11, 0.1)');
        glow.addColorStop(1, 'rgba(240, 185, 11, 0)');

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 60 * pulseScale, 0, Math.PI * 2);
        ctx.fill();
    }
}
