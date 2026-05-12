/**
 * GoldCounter.tsx
 * Компонент отображения счётчика золота
 * Обновляется только при изменении данных через паттерн Observer
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { eventManager, GameEvents, Observer } from './Observer';
import { formatNumber } from './GameConfig';

interface GoldCounterProps {
  initialGold?: number;
}

export const GoldCounter: React.FC<GoldCounterProps> = ({ initialGold = 0 }) => {
  // Состояние для золота - обновляется только при событии
  const [gold, setGold] = useState<number>(initialGold);
  const [lastEarned, setLastEarned] = useState<number | null>(null);
  const [isAutoEarn, setIsAutoEarn] = useState<boolean>(false);

  /**
   * Обработчик события изменения золота
   * Вызывается только когда данные изменились (не каждый кадр)
   */
  const handleGoldChange = useCallback((data: { 
    gold: number; 
    earned?: number; 
    autoEarned?: number 
  }) => {
    setGold(data.gold);
    
    if (data.earned !== undefined) {
      setLastEarned(data.earned);
      setIsAutoEarn(false);
      // Сбрасываем индикатор через короткое время
      setTimeout(() => setLastEarned(null), 500);
    } else if (data.autoEarned !== undefined) {
      setLastEarned(data.autoEarned);
      setIsAutoEarn(true);
      setTimeout(() => setLastEarned(null), 500);
    }
  }, []);

  useEffect(() => {
    // Подписка на событие изменения золота
    const observer = new Observer(handleGoldChange);
    eventManager.subscribe(GameEvents.GOLD_CHANGED, observer);

    // Получение начального значения
    const currentState = eventManager.getSubject(GameEvents.GOLD_CHANGED).getData();
    if (currentState.gold !== undefined) {
      setGold(currentState.gold);
    }

    // Очистка подписки при размонтировании
    return () => {
      eventManager.getSubject(GameEvents.GOLD_CHANGED).unsubscribe(observer);
    };
  }, [handleGoldChange]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>ЗОЛОТО</Text>
      <View style={styles.goldContainer}>
        <Text style={styles.goldIcon}>💰</Text>
        <Text style={styles.goldValue}>{formatNumber(gold)}</Text>
      </View>
      
      {/* Индикатор последнего заработка */}
      {lastEarned !== null && (
        <View style={[
          styles.earnIndicator,
          isAutoEarn ? styles.autoEarn : styles.clickEarn
        ]}>
          <Text style={styles.earnText}>
            {isAutoEarn ? '⏱️' : '+️⃣'}{formatNumber(lastEarned)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#1a1a2e',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  label: {
    fontSize: 14,
    color: '#888',
    letterSpacing: 2,
    marginBottom: 5,
  },
  goldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  goldIcon: {
    fontSize: 32,
  },
  goldValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffd700',
    textShadowColor: '#b8860b',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  earnIndicator: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  clickEarn: {
    borderLeftWidth: 3,
    borderLeftColor: '#00ff88',
  },
  autoEarn: {
    borderLeftWidth: 3,
    borderLeftColor: '#00bfff',
  },
  earnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffd700',
  },
});
