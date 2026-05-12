/**
 * ObjectPool.ts
 * Реализация Object Pooling для эффектов всплывающих чисел
 * Позволяет переиспользовать объекты вместо создания новых, что улучшает производительность
 */

import { Animated } from 'react-native';

/**
 * Интерфейс для объекта всплывающего текста
 */
export interface PopupTextObject {
  id: number;
  text: string;
  x: number;
  y: number;
  opacity: Animated.Value;
  translateY: Animated.Value;
  scale: Animated.Value;
  isActive: boolean;
}

/**
 * Класс ObjectPool для управления пулом объектов всплывающего текста
 */
export class PopupTextPool {
  private pool: PopupTextObject[] = [];
  private nextId: number = 0;
  private initialSize: number;

  /**
   * Конструктор с указанием начального размера пула
   */
  constructor(initialSize: number = 20) {
    this.initialSize = initialSize;
    this.initializePool();
  }

  /**
   * Инициализация пула объектами
   */
  private initializePool(): void {
    for (let i = 0; i < this.initialSize; i++) {
      this.pool.push(this.createPopupObject());
    }
  }

  /**
   * Создание нового объекта всплывающего текста
   */
  private createPopupObject(): PopupTextObject {
    return {
      id: this.nextId++,
      text: '',
      x: 0,
      y: 0,
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(0),
      scale: new Animated.Value(1),
      isActive: false,
    };
  }

  /**
   * Получение свободного объекта из пула
   * Если все объекты заняты, создаётся новый
   */
  acquire(): PopupTextObject {
    const inactiveObject = this.pool.find(obj => !obj.isActive);
    
    if (inactiveObject) {
      inactiveObject.isActive = true;
      // Сбрасываем анимации
      inactiveObject.opacity.setValue(1);
      inactiveObject.translateY.setValue(0);
      inactiveObject.scale.setValue(1);
      return inactiveObject;
    }

    // Если нет свободных объектов, создаём новый
    const newObject = this.createPopupObject();
    newObject.isActive = true;
    this.pool.push(newObject);
    return newObject;
  }

  /**
   * Возврат объекта в пул после завершения анимации
   */
  release(object: PopupTextObject): void {
    object.isActive = false;
    object.text = '';
    object.x = 0;
    object.y = 0;
  }

  /**
   * Получение всех активных объектов
   */
  getActiveObjects(): PopupTextObject[] {
    return this.pool.filter(obj => obj.isActive);
  }

  /**
   * Получение общего размера пула
   */
  getPoolSize(): number {
    return this.pool.length;
  }

  /**
   * Получение количества активных объектов
   */
  getActiveCount(): number {
    return this.pool.filter(obj => obj.isActive).length;
  }

  /**
   * Очистка всех активных объектов
   */
  clearAll(): void {
    this.pool.forEach(obj => {
      obj.isActive = false;
      obj.text = '';
      obj.opacity.setValue(0);
      obj.translateY.setValue(0);
      obj.scale.setValue(1);
    });
  }

  /**
   * Предварительное расширение пула (если ожидается много одновременных эффектов)
   */
  expand(additionalSize: number): void {
    for (let i = 0; i < additionalSize; i++) {
      this.pool.push(this.createPopupObject());
    }
  }
}

// Экспорт singleton экземпляра пула
export const popupPool = new PopupTextPool(30);
