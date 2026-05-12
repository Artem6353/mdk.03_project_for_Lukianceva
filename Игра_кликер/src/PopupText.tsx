/**
 * PopupText.tsx
 * Компонент для отображения всплывающих чисел
 * Использует Object Pooling для оптимизации производительности
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { Text, StyleSheet, Animated, View } from 'react-native';
import { PopupTextObject, popupPool } from './ObjectPool';
import { eventManager, GameEvents, Observer } from './Observer';

interface PopupTextProps {
  containerWidth?: number;
  containerHeight?: number;
}

export const PopupText: React.FC<PopupTextProps> = ({ 
  containerWidth = 400, 
  containerHeight = 600 
}) => {
  // Хранилище для активных popup объектов
  const [activePopups, setActivePopups] = React.useState<PopupTextObject[]>([]);

  /**
   * Обработчик создания нового popup
   */
  const handlePopupCreated = useCallback((data: { 
    popup: PopupTextObject; 
    x: number; 
    y: number; 
    value: number 
  }) => {
    // Запускаем анимацию для нового popup
    animatePopup(data.popup, data.y);
    
    // Добавляем в список активных
    setActivePopups(prev => [...prev, data.popup]);
  }, []);

  useEffect(() => {
    // Подписка на событие создания popup
    const observer = new Observer(handlePopupCreated);
    eventManager.subscribe(GameEvents.POPUP_CREATED, observer);

    return () => {
      eventManager.getSubject(GameEvents.POPUP_CREATED).unsubscribe(observer);
    };
  }, [handlePopupCreated]);

  /**
   * Анимация всплывающего текста
   * Поднимается вверх и исчезает
   */
  const animatePopup = (popup: PopupTextObject, startY: number) => {
    // Сброс позиций
    popup.translateY.setValue(0);
    popup.opacity.setValue(1);
    popup.scale.setValue(1);

    // Параллельная анимация подъёма и исчезновения
    Animated.parallel([
      Animated.timing(popup.translateY, {
        toValue: -80, // Поднимается на 80 пикселей вверх
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(popup.opacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(popup.scale, {
        toValue: 1.3,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // После завершения анимации возвращаем объект в пул
      popupPool.release(popup);
      
      // Удаляем из списка активных
      setActivePopups(prev => prev.filter(p => p.id !== popup.id));
    });
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {activePopups.map((popup) => (
        <Animated.View
          key={popup.id}
          style={[
            styles.popup,
            {
              left: popup.x - 20, // Центрируем относительно точки клика
              top: popup.y - 20,
              opacity: popup.opacity,
              transform: [
                { translateY: popup.translateY },
                { scale: popup.scale },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.popupText}>{popup.text}</Text>
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  popup: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  popupText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
    textAlign: 'center',
  },
});
