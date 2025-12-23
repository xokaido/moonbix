import { i18n } from '../i18n';

export class UIManager {
    container: HTMLElement;
    startScreen: HTMLElement;
    hud: HTMLElement;
    gameOverScreen: HTMLElement;

    onStart: () => void = () => { };
    onRestart: () => void = () => { };

    constructor() {
        this.container = document.getElementById('app')!;
        this.startScreen = this.createStartScreen();
        this.hud = this.createHUD();
        this.gameOverScreen = this.createGameOverScreen();

        this.container.appendChild(this.startScreen);
        this.container.appendChild(this.hud);
        this.container.appendChild(this.gameOverScreen);

        this.showStartScreen();

        i18n.subscribe(() => this.updateTexts());
    }

    createStartScreen() {
        const el = document.createElement('div');
        el.className = 'screen start-screen glass';
        el.innerHTML = `
      <h1 class="title glow">${i18n.t('start.title')}</h1>
      <div class="lang-selector">
        <button data-lang="en">EN</button>
        <button data-lang="ka">GE</button>
        <button data-lang="ru">RU</button>
      </div>
      <div class="high-score-display">${i18n.t('start.highScore')}: <span id="start-high-score">0</span></div>
      <button class="btn-primary pulse" id="start-btn">${i18n.t('start.play')}</button>
    `;

        el.querySelector('#start-btn')?.addEventListener('click', () => this.onStart());
        el.querySelectorAll('[data-lang]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lang = (e.target as HTMLElement).dataset.lang;
                if (lang) i18n.loadTranslations(lang);
            });
        });

        return el;
    }

    createHUD() {
        const el = document.createElement('div');
        el.className = 'hud hidden';
        el.innerHTML = `
      <div class="score-pill glass">
        <span class="label">${i18n.t('game.score')}</span>
        <span class="value" id="hud-score">0</span>
      </div>
      <div class="timer-pill glass">
        <span class="label">${i18n.t('game.time')}</span>
        <span class="value" id="hud-time">45</span>
      </div>
    `;
        return el;
    }

    createGameOverScreen() {
        const el = document.createElement('div');
        el.className = 'screen game-over-screen glass hidden';
        el.innerHTML = `
      <h2 class="title sticky">${i18n.t('game.gameOver')}</h2>
      <div class="final-score">
        <div class="label">${i18n.t('game.finalScore')}</div>
        <div class="value" id="final-score">0</div>
      </div>
      <button class="btn-primary" id="restart-btn">${i18n.t('game.replay')}</button>
    `;

        el.querySelector('#restart-btn')?.addEventListener('click', () => this.onRestart());
        return el;
    }

    updateTexts() {
        // Re-render or update text content for key elements
        // For simplicity, just updating mostly static ones logic would go here
        this.startScreen.querySelector('h1')!.textContent = i18n.t('start.title');
        this.startScreen.querySelector('#start-btn')!.textContent = i18n.t('start.play');
        this.startScreen.querySelector('.high-score-display')!.childNodes[0].textContent = i18n.t('start.highScore') + ': ';

        this.hud.querySelector('.score-pill .label')!.textContent = i18n.t('game.score');
        this.hud.querySelector('.timer-pill .label')!.textContent = i18n.t('game.time');

        this.gameOverScreen.querySelector('h2')!.textContent = i18n.t('game.gameOver');
        this.gameOverScreen.querySelector('.final-score .label')!.textContent = i18n.t('game.finalScore');
        this.gameOverScreen.querySelector('#restart-btn')!.textContent = i18n.t('game.replay');
    }

    showStartScreen() {
        this.startScreen.classList.remove('hidden');
        this.hud.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');

        const highScore = localStorage.getItem('moonbix_highscore') || '0';
        this.startScreen.querySelector('#start-high-score')!.textContent = highScore;
    }

    showGame() {
        this.startScreen.classList.add('hidden');
        this.hud.classList.remove('hidden');
        this.gameOverScreen.classList.add('hidden');
    }

    showGameOver(score: number) {
        this.startScreen.classList.add('hidden');
        this.hud.classList.add('hidden');
        this.gameOverScreen.classList.remove('hidden');
        this.gameOverScreen.querySelector('#final-score')!.textContent = score.toString();
    }

    updateHUD(score: number, time: number) {
        this.hud.querySelector('#hud-score')!.textContent = score.toString();
        this.hud.querySelector('#hud-time')!.textContent = Math.ceil(time).toString();

        if (time <= 10) {
            this.hud.querySelector('.timer-pill')!.classList.add('danger');
        } else {
            this.hud.querySelector('.timer-pill')!.classList.remove('danger');
        }
    }
}
