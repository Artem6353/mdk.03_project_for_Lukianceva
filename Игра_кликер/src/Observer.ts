/**
 * Observer.ts
 * Реализация паттерна Observer (Наблюдатель) для реактивного обновления UI
 * Интерфейс обновляется только при изменении данных, а не в каждом кадре
 */

// Тип функции обратного вызова
type Callback = (data: any) => void;

/**
 * Класс Observer - представляет наблюдателя
 */
export class Observer {
  private callback: Callback;

  constructor(callback: Callback) {
    this.callback = callback;
  }

  update(data: any): void {
    this.callback(data);
  }
}

/**
 * Класс Subject - представляет наблюдаемый объект
 */
export class Subject {
  private observers: Observer[] = [];
  private data: any = {};

  /**
   * Подписка наблюдателя
   */
  subscribe(observer: Observer): void {
    this.observers.push(observer);
    // Сразу уведомляем о текущем состоянии
    observer.update(this.data);
  }

  /**
   * Отписка наблюдателя
   */
  unsubscribe(observer: Observer): void {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  /**
   * Уведомление всех наблюдателей об изменении данных
   */
  notify(data?: any): void {
    if (data !== undefined) {
      this.data = { ...this.data, ...data };
    }
    this.observers.forEach(observer => observer.update(this.data));
  }

  /**
   * Получение текущих данных
   */
  getData(): any {
    return { ...this.data };
  }

  /**
   * Очистка всех наблюдателей
   */
  clear(): void {
    this.observers = [];
  }
}

/**
 * Глобальный менеджер событий для игровой экономики
 */
class EventManager {
  private static instance: EventManager;
  private subjects: Map<string, Subject> = new Map();

  private constructor() {}

  static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }

  /**
   * Получение или создание subject по имени события
   */
  getSubject(eventName: string): Subject {
    if (!this.subjects.has(eventName)) {
      this.subjects.set(eventName, new Subject());
    }
    return this.subjects.get(eventName)!;
  }

  /**
   * Публикация события с данными
   */
  publish(eventName: string, data: any): void {
    const subject = this.getSubject(eventName);
    subject.notify(data);
  }

  /**
   * Подписка на событие
   */
  subscribe(eventName: string, callback: Callback): Observer {
    const subject = this.getSubject(eventName);
    const observer = new Observer(callback);
    subject.subscribe(observer);
    return observer;
  }

  /**
   * Очистка всех событий
   */
  clearAll(): void {
    this.subjects.forEach(subject => subject.clear());
    this.subjects.clear();
  }
}

// Экспорт singleton экземпляра
export const eventManager = EventManager.getInstance();

// Названия событий для игры
export const GameEvents = {
  GOLD_CHANGED: 'goldChanged',
  CLICK_POWER_CHANGED: 'clickPowerChanged',
  AUTO_CLICK_CHANGED: 'autoClickChanged',
  UPGRADE_PURCHASED: 'upgradePurchased',
  POPUP_CREATED: 'popupCreated',
  GAME_LOADED: 'gameLoaded',
  GAME_SAVED: 'gameSaved',
};
