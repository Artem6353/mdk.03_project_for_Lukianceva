/**
 * GameConfig.ts
 * Конфигурация игры, формулы экономики и константы
 */

import { eventManager, GameEvents } from './Observer';

/**
 * Интерфейс для данных улучшения
 */
export interface UpgradeData {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  multiplier: number;
  level: number;
  bonus: number; // Бонус к силе клика или авто-доходу
  type: 'click' | 'auto'; // Тип улучшения
  icon: string;
}

/**
 * Интерфейс игрового состояния
 */
export interface GameState {
  gold: number;
  clickPower: number;
  autoClickPerSecond: number;
  upgrades: Record<string, UpgradeData>;
  totalClicks: number;
  startTime: number;
}

/**
 * Начальное состояние игры
 */
export const initialGameState: GameState = {
  gold: 0,
  clickPower: 1,
  autoClickPerSecond: 0,
  totalClicks: 0,
  startTime: Date.now(),
  upgrades: {
    'pickaxe': {
      id: 'pickaxe',
      name: 'Кирка',
      description: '+1 к силе клика',
      baseCost: 15,
      multiplier: 1.5,
      level: 0,
      bonus: 1,
      type: 'click',
      icon: '⛏️',
    },
    'miner': {
      id: 'miner',
      name: 'Шахтёр',
      description: '+1 золота в секунду',
      baseCost: 50,
      multiplier: 1.4,
      level: 0,
      bonus: 1,
      type: 'auto',
      icon: '👷',
    },
    'drill': {
      id: 'drill',
      name: 'Буровая установка',
      description: '+5 золота в секунду',
      baseCost: 250,
      multiplier: 1.45,
      level: 0,
      bonus: 5,
      type: 'auto',
      icon: '🚜',
    },
    'dynamite': {
      id: 'dynamite',
      name: 'Динамит',
      description: '+5 к силе клика',
      baseCost: 500,
      multiplier: 1.6,
      level: 0,
      bonus: 5,
      type: 'click',
      icon: '🧨',
    },
    'goldMine': {
      id: 'goldMine',
      name: 'Золотой рудник',
      description: '+20 золота в секунду',
      baseCost: 1500,
      multiplier: 1.5,
      level: 0,
      bonus: 20,
      type: 'auto',
      icon: '🏭',
    },
  },
};

/**
 * Класс GameManager - управляет игровой логикой и экономикой
 */
class GameManager {
  private static instance: GameManager;
  private state: GameState;

  private constructor() {
    this.state = { ...initialGameState };
  }

  static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  /**
   * Получение текущего состояния
   */
  getState(): GameState {
    return { ...this.state };
  }

  /**
   * Расчёт стоимости улучшения по экспоненциальной формуле:
   * Price = BaseCost × (Multiplier ^ Level)
   */
  calculateUpgradeCost(upgrade: UpgradeData): number {
    const cost = upgrade.baseCost * Math.pow(upgrade.multiplier, upgrade.level);
    return Math.floor(cost);
  }

  /**
   * Обработка клика по главной кнопке
   */
  handleClick(): number {
    const earnedGold = this.state.clickPower;
    this.state.gold += earnedGold;
    this.state.totalClicks++;
    
    // Публикуем событие изменения золота
    eventManager.publish(GameEvents.GOLD_CHANGED, { 
      gold: this.state.gold,
      earned: earnedGold,
    });
    
    return earnedGold;
  }

  /**
   * Покупка улучшения
   */
  purchaseUpgrade(upgradeId: string): boolean {
    const upgrade = this.state.upgrades[upgradeId];
    if (!upgrade) return false;

    const cost = this.calculateUpgradeCost(upgrade);
    
    if (this.state.gold >= cost) {
      // Списываем золото
      this.state.gold -= cost;
      
      // Увеличиваем уровень
      upgrade.level++;
      
      // Применяем бонус
      if (upgrade.type === 'click') {
        this.state.clickPower += upgrade.bonus;
        eventManager.publish(GameEvents.CLICK_POWER_CHANGED, { 
          clickPower: this.state.clickPower,
        });
      } else {
        this.state.autoClickPerSecond += upgrade.bonus;
        eventManager.publish(GameEvents.AUTO_CLICK_CHANGED, { 
          autoClick: this.state.autoClickPerSecond,
        });
      }
      
      // Публикуем событие о покупке
      eventManager.publish(GameEvents.UPGRADE_PURCHASED, {
        upgradeId,
        level: upgrade.level,
        cost,
      });
      
      // Обновляем золото после покупки
      eventManager.publish(GameEvents.GOLD_CHANGED, { gold: this.state.gold });
      
      return true;
    }
    
    return false;
  }

  /**
   * Добавление золота от авто-клика (вызывается раз в секунду)
   */
  addAutoClickGold(): void {
    if (this.state.autoClickPerSecond > 0) {
      this.state.gold += this.state.autoClickPerSecond;
      eventManager.publish(GameEvents.GOLD_CHANGED, { 
        gold: this.state.gold,
        autoEarned: this.state.autoClickPerSecond,
      });
    }
  }

  /**
   * Сохранение прогресса
   */
  saveGame(): void {
    try {
      const saveData = JSON.stringify(this.state);
      localStorage.setItem('goldClickerSave', saveData);
      eventManager.publish(GameEvents.GAME_SAVED, { success: true });
      console.log('Игра сохранена');
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      eventManager.publish(GameEvents.GAME_SAVED, { success: false, error });
    }
  }

  /**
   * Загрузка прогресса
   */
  loadGame(): boolean {
    try {
      const saveData = localStorage.getItem('goldClickerSave');
      if (saveData) {
        const loadedState = JSON.parse(saveData);
        // Объединяем с начальным состоянием на случай добавления новых полей
        this.state = {
          ...initialGameState,
          ...loadedState,
          upgrades: {
            ...initialGameState.upgrades,
            ...loadedState.upgrades,
          },
        };
        
        // Восстанавливаем рассчитанные значения
        this.recalculateStats();
        
        // Публикуем событие загрузки
        eventManager.publish(GameEvents.GAME_LOADED, { state: this.state });
        
        console.log('Игра загружена');
        return true;
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    }
    return false;
  }

  /**
   * Пересчёт статов на основе уровней улучшений
   */
  private recalculateStats(): void {
    let clickPower = 1;
    let autoClick = 0;

    Object.values(this.state.upgrades).forEach(upgrade => {
      if (upgrade.level > 0) {
        if (upgrade.type === 'click') {
          clickPower += upgrade.bonus * upgrade.level;
        } else {
          autoClick += upgrade.bonus * upgrade.level;
        }
      }
    });

    this.state.clickPower = clickPower;
    this.state.autoClickPerSecond = autoClick;
  }

  /**
   * Сброс прогресса
   */
  resetGame(): void {
    localStorage.removeItem('goldClickerSave');
    this.state = { ...initialGameState };
    
    // Публикуем все события для обновления UI
    eventManager.publish(GameEvents.GOLD_CHANGED, { gold: 0 });
    eventManager.publish(GameEvents.CLICK_POWER_CHANGED, { clickPower: 1 });
    eventManager.publish(GameEvents.AUTO_CLICK_CHANGED, { autoClick: 0 });
  }
}

// Экспорт singleton экземпляра
export const gameManager = GameManager.getInstance();

/**
 * Форматирование больших чисел для отображения
 * Использует суффиксы K, M, B, T для тысяч, миллионов, миллиардов, триллионов
 */
export function formatNumber(num: number): string {
  if (num < 1000) return num.toString();
  
  const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc'];
  const tier = Math.floor(Math.log10(num) / 3);
  
  if (tier >= suffixes.length) {
    return num.toExponential(2);
  }
  
  const scaled = num / Math.pow(1000, tier);
  return scaled.toFixed(2).replace(/\.00$/, '') + suffixes[tier];
}
