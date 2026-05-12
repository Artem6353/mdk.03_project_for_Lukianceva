/**
 * App.tsx
 * Главный компонент приложения Gold Clicker
 * Объединяет все компоненты игры
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  SafeAreaView, 
  StatusBar,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import { gameManager } from './src/GameConfig';
import { eventManager, GameEvents, Observer } from './src/Observer';
import { GoldCounter } from './src/GoldCounter';
import { GoldButton } from './src/GoldButton';
import { UpgradeShop } from './src/UpgradeShop';
import { PopupText } from './src/PopupText';

export default function App() {
  const [isGameLoaded, setIsGameLoaded] = useState<boolean>(false);
  const autoClickIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Обработчик загрузки игры
   */
  const handleGameLoaded = useCallback(() => {
    setIsGameLoaded(true);
  }, []);

  useEffect(() => {
    // Загрузка сохранённого прогресса
    const loaded = gameManager.loadGame();
    setIsGameLoaded(true);

    // Подписка на событие загрузки
    const observer = new Observer(handleGameLoaded);
    eventManager.subscribe(GameEvents.GAME_LOADED, observer);

    // Запуск авто-клика (раз в секунду)
    autoClickIntervalRef.current = setInterval(() => {
      gameManager.addAutoClickGold();
    }, 1000);

    // Автосохранение каждые 10 секунд
    saveIntervalRef.current = setInterval(() => {
      gameManager.saveGame();
    }, 10000);

    // Очистка при размонтировании
    return () => {
      eventManager.getSubject(GameEvents.GAME_LOADED).unsubscribe(observer);
      
      if (autoClickIntervalRef.current) {
        clearInterval(autoClickIntervalRef.current);
      }
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
      
      // Сохранение при выходе
      gameManager.saveGame();
    };
  }, [handleGameLoaded]);

  /**
   * Обработка покупки улучшения
   */
  const handleUpgradePurchase = useCallback((upgradeId: string) => {
    console.log(`Улучшение ${upgradeId} куплено!`);
    // Сохранение после покупки
    setTimeout(() => gameManager.saveGame(), 500);
  }, []);

  /**
   * Сброс прогресса игры
   */
  const handleResetGame = () => {
    Alert.alert(
      'Сброс прогресса',
      'Вы уверены, что хотите сбросить весь прогресс?',
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Сбросить',
          style: 'destructive',
          onPress: () => {
            gameManager.resetGame();
            gameManager.saveGame();
          },
        },
      ]
    );
  };

  /**
   * Принудительное сохранение
   */
  const handleSaveGame = () => {
    gameManager.saveGame();
    Alert.alert('Прогресс сохранён!', '✓');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      {/* Верхняя панель со счётчиком золота */}
      <GoldCounter />

      {/* Центральная часть с кнопкой */}
      <View style={styles.mainContent}>
        <GoldButton />
        
        {/* Всплывающие числа */}
        <PopupText />
      </View>

      {/* Нижняя панель с магазином */}
      <UpgradeShop onUpgradePurchase={handleUpgradePurchase} />

      {/* Панель управления (сохранение/сброс) */}
      <View style={styles.controlPanel}>
        <TouchableOpacity 
          onPress={handleSaveGame}
          style={styles.controlButton}
        >
          <Text style={styles.controlButtonText}>💾 Сохранить</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={handleResetGame}
          style={[styles.controlButton, styles.resetButton]}
        >
          <Text style={[styles.controlButtonText, styles.resetButtonText]}>
            🗑️ Сброс
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  mainContent: {
    flex: 1,
    position: 'relative',
  },
  controlPanel: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#16213e',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  controlButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  resetButton: {
    backgroundColor: 'rgba(255, 100, 100, 0.15)',
    borderColor: 'rgba(255, 100, 100, 0.3)',
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffd700',
  },
  resetButtonText: {
    color: '#ff6464',
  },
});
