/**
 * GoldButton.tsx
 * Главная кнопка для добычи золота
 * С визуальным фидбеком и обработкой нажатий
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated,
  GestureResponderEvent,
} from 'react-native';
import { gameManager } from './GameConfig';
import { popupPool } from './ObjectPool';
import { eventManager, GameEvents } from './Observer';

interface GoldButtonProps {
  onPopupCreate?: (x: number, y: number, value: number) => void;
}

export const GoldButton: React.FC<GoldButtonProps> = ({ onPopupCreate }) => {
  // Анимации кнопки
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // Состояние для силы клика (обновляется через Observer)
  const [clickPower, setClickPower] = useState<number>(1);

  /**
   * Обработчик изменения силы клика
   */
  const handleClickPowerChange = useCallback((data: { clickPower: number }) => {
    setClickPower(data.clickPower);
  }, []);

  useEffect(() => {
    // Подписка на событие изменения силы клика
    const subscription = eventManager.subscribe(
      GameEvents.CLICK_POWER_CHANGED,
      handleClickPowerChange
    );

    // Получение начального значения
    const currentState = eventManager.getSubject(GameEvents.CLICK_POWER_CHANGED).getData();
    if (currentState.clickPower !== undefined) {
      setClickPower(currentState.clickPower);
    }

    return () => {
      eventManager.getSubject(GameEvents.CLICK_POWER_CHANGED).unsubscribe(subscription);
    };
  }, [handleClickPowerChange]);

  /**
   * Анимация нажатия кнопки
   */
  const animatePress = () => {
    // Анимация сжатия
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Небольшое вращение для эффекта
    Animated.sequence([
      Animated.timing(rotateAnim, {
        toValue: 0.1,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /**
   * Обработка нажатия на кнопку
   */
  const handlePress = (event: GestureResponderEvent) => {
    // Воспроизведение анимации
    animatePress();

    // Обработка клика через GameManager
    const earnedGold = gameManager.handleClick();

    // Получение координат нажатия для всплывающего текста
    const { locationX, locationY } = event.nativeEvent;
    
    // Создание всплывающего текста через Object Pool
    const popup = popupPool.acquire();
    popup.text = `+${earnedGold}`;
    popup.x = locationX || 150; // Центр по умолчанию
    popup.y = locationY || 200;
    
    // Публикация события для отображения popup
    eventManager.publish(GameEvents.POPUP_CREATED, {
      popup,
      x: popup.x,
      y: popup.y,
      value: earnedGold,
    });

    // Вызов внешнего обработчика если есть
    if (onPopupCreate) {
      onPopupCreate(popup.x, popup.y, earnedGold);
    }
  };

  // Интерполяция вращения
  const rotate = rotateAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-5deg', '5deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.buttonWrapper,
          {
            transform: [
              { scale: scaleAnim },
              { rotate },
            ],
          },
        ]}
      >
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.9}
          style={styles.button}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <View style={styles.goldCoin}>
            <Text style={styles.coinIcon}>🪙</Text>
            <Text style={styles.tapText}>TAP!</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Индикатор силы клика */}
      <View style={styles.powerIndicator}>
        <Text style={styles.powerLabel}>Сила клика:</Text>
        <Text style={styles.powerValue}>{clickPower}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    flex: 1,
  },
  buttonWrapper: {
    marginBottom: 20,
  },
  button: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#ffd700',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 4,
    borderColor: '#b8860b',
  },
  goldCoin: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinIcon: {
    fontSize: 80,
    marginBottom: -10,
  },
  tapText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8b6914',
    marginTop: 5,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  powerIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  powerLabel: {
    fontSize: 16,
    color: '#888',
  },
  powerValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffd700',
  },
});
