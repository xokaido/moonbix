import { Item } from './Item';

export type HookState = 'swinging' | 'extending' | 'retracting';

export class Hook {
    x: number;
    y: number;
    length: number = 50;
    maxLength: number = 800; // Will be dynamic based on screen height
    angle: number = Math.PI / 2; // Pointing down
    swingSpeed: number = 0.03;
    extendSpeed: number = 15;
    retractSpeed: number = 20; // Faster retract
    state: HookState = 'swinging';
    swingDirection: number = 1; // 1 for right, -1 for left
    caughtItem: Item | null = null;

    // 120 degrees arc: 60 left, 60 right from vertical (PI/2)
    // PI/2 = 90 deg. 
    // Min = 90 - 60 = 30 deg = PI/6
    // Max = 90 + 60 = 150 deg = 5*PI/6
    readonly minAngle = Math.PI / 6;
    readonly maxAngle = 5 * Math.PI / 6;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    update(dt: number) {
        if (this.state === 'swinging') {
            // Adjust speed by dt (60fps baseline: 0.016s)
            // Original speed 0.03 per frame. 0.03 * 60 = 1.8 rad/s
            this.angle += (1.8 * dt) * this.swingDirection;
            if (this.angle >= this.maxAngle || this.angle <= this.minAngle) {
                this.swingDirection *= -1;
            }
        } else if (this.state === 'extending') {
            this.length += this.extendSpeed * (dt * 60); // Keep similar feel
            // Max length check or bounds check should be handled by Game to know screen boundaries
            // but we can set a safe max
        } else if (this.state === 'retracting') {
            this.length -= this.retractSpeed * (dt * 60);
            if (this.caughtItem) {
                this.caughtItem.x = this.x + Math.cos(this.angle) * this.length;
                this.caughtItem.y = this.y + Math.sin(this.angle) * this.length;
            }

            if (this.length <= 50) {
                this.length = 50;
                this.state = 'swinging';
                // Item processing happens in Game loop when state changes back to swinging
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

        // Line
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(tip.x, tip.y);
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Hook head
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();

        // Hook claws
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 15, this.angle, this.angle + Math.PI, false);
        ctx.strokeStyle = '#fff';
        ctx.stroke();
    }
}
