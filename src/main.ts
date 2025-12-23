import './styles/main.css';
import { Game } from './game/Game';

document.addEventListener('DOMContentLoaded', () => {
  new Game('gameCanvas');
});
