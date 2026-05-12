/**
 * UpgradeShop.tsx
 * Компонент магазина улучшений
 * Список апгрейдов с экспоненциальным ростом цен
 */

import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Animated,
} from 'react-native';
import { gameManager, formatNumber, UpgradeData } from './GameConfig';
import { eventManager, GameEvents, Observer } from './Observer';

interface UpgradeShopProps {
  onUpgradePurchase?: (upgradeId: string) => void;
}

export const UpgradeShop: React.FC<UpgradeShopProps> = ({ onUpgradePurchase }) => {
  // Состояние для золота и улучшений
  const [gold, setGold] = useState<number>(0);
  const [upgrades, setUpgrades] = useState<Record<string, UpgradeData>>({});
  const [autoClickPerSecond, setAutoClickPerSecond] = useState<number>(0);

  /**
   * Обработчик изменения золота
   */
  const handleGoldChange = useCallback((data: { gold: number }) => {
    setGold(data.gold);
  }, []);

  /**
   * Обработчик изменения авто-клика
   */
  const handleAutoClickChange = useCallback((data: { autoClick: number }) => {
    setAutoClickPerSecond(data.autoClick);
  }, []);

  /**
   * Обработчик покупки улучшения
   */
  const handleUpgradePurchased = useCallback(() => {
    // Обновляем состояние улучшений после покупки
    const state = gameManager.getState();
    setUpgrades(state.upgrades);
  }, []);

  useEffect(() => {
    // Подписка на события
    const goldObserver = new Observer(handleGoldChange);
    const autoClickObserver = new Observer(handleAutoClickChange);
    
    eventManager.subscribe(GameEvents.GOLD_CHANGED, goldObserver);
    eventManager.subscribe(GameEvents.AUTO_CLICK_CHANGED, autoClickObserver);
    eventManager.subscribe(GameEvents.UPGRADE_PURCHASED, { update: handleUpgradePurchased } as any);

    // Получение начальных данных
    const state = gameManager.getState();
    setGold(state.gold);
    setUpgrades(state.upgrades);
    setAutoClickPerSecond(state.autoClickPerSecond);

    return () => {
      eventManager.getSubject(GameEvents.GOLD_CHANGED).unsubscribe(goldObserver);
      eventManager.getSubject(GameEvents.AUTO_CLICK_CHANGED).unsubscribe(autoClickObserver);
    };
  }, [handleGoldChange, handleAutoClickChange, handleUpgradePurchased]);

  /**
   * Обработка нажатия на улучшение
   */
  const handlePurchase = (upgradeId: string) => {
    const success = gameManager.purchaseUpgrade(upgradeId);
    if (success && onUpgradePurchase) {
      onUpgradePurchase(upgradeId);
    }
  };

  /**
   * Проверка доступности улучшения
   */
  const canAffordUpgrade = (upgrade: UpgradeData): boolean => {
    const cost = gameManager.calculateUpgradeCost(upgrade);
    return gold >= cost;
  };

  return (
    <View style={styles.container}>
      {/* Заголовок магазина */}
      <View style={styles.header}>
        <Text style={styles.title}>🏪 МАГАЗИН</Text>
        <View style={styles.incomeIndicator}>
          <Text style={styles.incomeLabel}>Доход/сек:</Text>
          <Text style={styles.incomeValue}>{formatNumber(autoClickPerSecond)}</Text>
        </View>
      </View>

      {/* Список улучшений */}
      <ScrollView 
        style={styles.upgradesList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.upgradesContent}
      >
        {Object.values(upgrades).map((upgrade) => {
          const cost = gameManager.calculateUpgradeCost(upgrade);
          const canAfford = canAffordUpgrade(upgrade);

          return (
            <TouchableOpacity
              key={upgrade.id}
              onPress={() => handlePurchase(upgrade.id)}
              activeOpacity={0.7}
              disabled={!canAfford}
              style={[
                styles.upgradeCard,
                !canAfford && styles.upgradeCardDisabled,
              ]}
            >
              <View style={styles.upgradeLeft}>
                <View style={styles.upgradeIcon}>
                  <Text style={styles.iconEmoji}>{upgrade.icon}</Text>
                </View>
                <View style={styles.upgradeInfo}>
                  <Text style={styles.upgradeName}>{upgrade.name}</Text>
                  <Text style={styles.upgradeDescription}>{upgrade.description}</Text>
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelText}>Ур. {upgrade.level}</Text>
                  </View>
                </View>
              </View>

              <View style={[
                styles.costContainer,
                canAfford ? styles.canAfford : styles.cantAfford,
              ]}>
                <Text style={styles.costIcon}>💰</Text>
                <Text style={[
                  styles.costValue,
                  canAfford ? styles.canAffordText : styles.cantAffordText,
                ]}>
                  {formatNumber(cost)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#16213e',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 15,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffd700',
    letterSpacing: 1,
  },
  incomeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 191, 255, 0.15)',
    borderRadius: 12,
  },
  incomeLabel: {
    fontSize: 12,
    color: '#888',
  },
  incomeValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00bfff',
  },
  upgradesList: {
    flex: 1,
  },
  upgradesContent: {
    padding: 15,
    gap: 12,
  },
  upgradeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  upgradeCardDisabled: {
    opacity: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  upgradeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  upgradeIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: 28,
  },
  upgradeInfo: {
    flex: 1,
    gap: 4,
  },
  upgradeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  upgradeDescription: {
    fontSize: 12,
    color: '#888',
  },
  levelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 8,
    marginTop: 4,
  },
  levelText: {
    fontSize: 11,
    color: '#ffd700',
    fontWeight: '600',
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 90,
    justifyContent: 'center',
  },
  canAfford: {
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },
  cantAfford: {
    backgroundColor: 'rgba(255, 100, 100, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 100, 100, 0.2)',
  },
  costIcon: {
    fontSize: 14,
  },
  costValue: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  canAffordText: {
    color: '#00ff88',
  },
  cantAffordText: {
    color: '#ff6464',
  },
});
