import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { usePoints, Reward, PointsTransaction } from '../hooks/usePoints';
import { AccountLayout } from './AccountLayout';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { motion } from 'motion/react';

interface RewardsPageProps {
  user: any;
  onBackToAccount: () => void;
  onProfileClick: () => void;
  onOrdersClick: () => void;
  onAddressesClick: () => void;
  onPaymentMethodsClick: () => void;
  onWishlistClick: () => void;
  onRewardsClick: () => void;
  onSettingsClick: () => void;
  onAdminClick?: () => void;
  onLogout: () => void;
  onLoginClick?: () => void;
}

export function RewardsPage({
  user,
  onBackToAccount,
  onProfileClick,
  onOrdersClick,
  onAddressesClick,
  onPaymentMethodsClick,
  onWishlistClick,
  onRewardsClick,
  onSettingsClick,
  onAdminClick,
  onLogout,
  onLoginClick
}: RewardsPageProps) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const {
    userPoints,
    pointsHistory,
    availableRewards,
    isLoading,
    isEnabled,
    error,
    redeemReward
  } = usePoints(user);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showHistory, setShowHistory] = useState(false);
  const [redeemingReward, setRedeemingReward] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleRedeemReward = async (reward: Reward) => {
    if (!userPoints || userPoints.currentPoints < reward.pointsCost) {
      showMessage('error', t('insufficientPoints'));
      return;
    }

    setRedeemingReward(reward.id);
    const success = await redeemReward(reward.id);
    
    if (success) {
      showMessage('success', t('redeemSuccess', { reward: reward.name }));
    } else {
      showMessage('error', t('redeemError'));
    }
    
    setRedeemingReward(null);
  };

  const filteredRewards = availableRewards.filter(reward => {
    if (selectedCategory === 'all') return reward.isActive;
    return reward.isActive && reward.category === selectedCategory;
  });

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/20';
      case 'silver': return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
      case 'gold': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'platinum': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
    }
  };

  const getTierBenefits = (tier: string) => {
    switch (tier) {
      case 'bronze': return { multiplier: 1, name: t('tierBronze') };
      case 'silver': return { multiplier: 1.1, name: t('tierSilver') };
      case 'gold': return { multiplier: 1.25, name: t('tierGold') };
      case 'platinum': return { multiplier: 1.5, name: t('tierPlatinum') };
      default: return { multiplier: 1, name: t('tierBronze') };
    }
  };

  const TIER_THRESHOLDS = [
    { tier: 'bronze', min: 0, label: 'Bronze' },
    { tier: 'silver', min: 500, label: 'Silver' },
    { tier: 'gold', min: 2000, label: 'Gold' },
    { tier: 'platinum', min: 5000, label: 'Platinum' },
  ];

  const getTierProgress = () => {
    if (!userPoints) return { current: 'bronze', next: 'silver', progress: 0, pointsNeeded: 500 };
    const earned = userPoints.lifetimeEarned;
    const currentIdx = TIER_THRESHOLDS.findIndex(t => t.tier === userPoints.tier);
    const nextIdx = Math.min(currentIdx + 1, TIER_THRESHOLDS.length - 1);
    if (currentIdx === TIER_THRESHOLDS.length - 1) return { current: 'platinum', next: null, progress: 100, pointsNeeded: 0 };
    const currentMin = TIER_THRESHOLDS[currentIdx].min;
    const nextMin = TIER_THRESHOLDS[nextIdx].min;
    const progress = Math.min(100, Math.round(((earned - currentMin) / (nextMin - currentMin)) * 100));
    return { current: userPoints.tier, next: TIER_THRESHOLDS[nextIdx].tier, progress, pointsNeeded: Math.max(0, nextMin - earned) };
  };

  return (
    <AccountLayout
      user={user}
      currentPage="rewards"
      onProfileClick={onProfileClick}
      onOrdersClick={onOrdersClick}
      onAddressesClick={onAddressesClick}
      onPaymentMethodsClick={onPaymentMethodsClick}
      onWishlistClick={onWishlistClick}
      onRewardsClick={onRewardsClick}
      onSettingsClick={onSettingsClick}
      onAdminClick={onAdminClick}
      onLogout={onLogout}
      pageTitle={t('rewardsTitle')}
      pageDescription={t('rewardsSubtitle')}
    >
      {/* Success/Error Message */}
      {message && (
        <div className={`fixed top-24 right-4 z-50 p-4 rounded-lg shadow-lg ${
          message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {message.text}
        </div>
      )}

      {!isEnabled ? (
                  <div className="text-center py-16">
                    <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Sistema de puntos no disponible
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      El programa de puntos y recompensas no está activo en este momento. Vuelve pronto para ver las novedades.
                    </p>
                  </div>
                ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  
                  {/* Points Summary Sidebar */}
                  <div className="lg:col-span-1 space-y-6">
                    
                    {/* Points Summary Card */}
                    <div className="bg-muted/50 rounded-xl border border-border p-6" aria-label={userPoints ? `${userPoints.currentPoints.toLocaleString()} ${t('currentPoints')}` : undefined}>
                      <div className="text-center">
                        <div className="bg-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        
                        {isLoading ? (
                          <div className="animate-pulse">
                            <div className="h-8 bg-muted rounded mb-2"></div>
                            <div className="h-4 bg-muted rounded mb-4"></div>
                          </div>
                        ) : userPoints ? (
                          <>
                            <h3 className="text-2xl font-bold text-foreground mb-1">
                              {userPoints.currentPoints.toLocaleString()}
                            </h3>
                            <p className="text-muted-foreground mb-4">
                              {t('currentPoints')}
                            </p>
                            
                            {/* Tier Badge */}
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTierColor(userPoints.tier)}`}>
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" />
                              </svg>
                              {getTierBenefits(userPoints.tier).name}
                            </div>
                          </>
                        ) : (
                          <p className="text-muted-foreground">{t('noPointsYet')}</p>
                        )}
                      </div>

                      {userPoints && (
                        <div className="mt-6 space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{t('lifetimeEarned')}</span>
                            <span className="font-medium text-foreground">
                              {userPoints.lifetimeEarned.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{t('lifetimeRedeemed')}</span>
                            <span className="font-medium text-foreground">
                              {userPoints.lifetimeRedeemed.toLocaleString()}
                            </span>
                          </div>

                          {/* Tier Progress Bar */}
                          {(() => {
                            const tp = getTierProgress();
                            return (
                              <div className="mt-4 pt-4 border-t border-border">
                                <div className="flex justify-between items-center text-xs mb-2">
                                  <span className="font-medium text-foreground capitalize">{tp.current}</span>
                                  {tp.next && (
                                    <span className="text-muted-foreground capitalize">{tp.next}</span>
                                  )}
                                </div>
                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                  <motion.div
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${tp.progress}%` }}
                                    transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                                  />
                                </div>
                                {tp.next && tp.pointsNeeded > 0 && (
                                  <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
                                    {t('pointsToNextTier', { points: tp.pointsNeeded.toLocaleString(), tier: tp.next || '' })}
                                  </p>
                                )}
                                {!tp.next && (
                                  <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-1.5 text-center font-medium">
                                    {t('maxTierReached')}
                                  </p>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Points History Toggle */}
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="w-full bg-muted/50 border border-border rounded-xl p-4 text-left hover:bg-muted transition-colors"
                      aria-expanded={showHistory}
                      aria-controls="points-history"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">
                          {showHistory ? t('hideHistory') : t('viewHistory')}
                        </span>
                        <svg 
                          className={`w-5 h-5 text-muted-foreground transform transition-transform ${showHistory ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {/* Points History */}
                    {showHistory && (
                      <div 
                        id="points-history"
                        className="bg-muted/50 border border-border rounded-xl p-4 max-h-64 overflow-y-auto"
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                            <span className="ml-2 text-sm text-muted-foreground">
                              {t('loadingHistory')}
                            </span>
                          </div>
                        ) : pointsHistory.length > 0 ? (
                          <div className="space-y-3">
                            {pointsHistory.slice(0, 10).map((transaction) => (
                              <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-foreground">
                                    {transaction.description}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(transaction.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className={`text-sm font-medium ${
                                    transaction.type === 'earned'
                                      ? 'text-green-600 dark:text-green-400'
                                      : 'text-red-600 dark:text-red-400'
                                  }`} aria-label={`${transaction.type === 'earned' ? '+' : '-'}${transaction.amount} ${t('rewardPoints')}`}>
                                    {transaction.type === 'earned' ? '+' : '-'}{transaction.amount}
                                  </span>
                                  <p className="text-xs text-muted-foreground">
                                    {t('rewardPoints')}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <svg className="w-12 h-12 text-muted-foreground mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="text-sm text-muted-foreground">
                              {t('noHistoryYet')}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Rewards Catalog */}
                  <div className="lg:col-span-3">
                    
                    {/* Category Filter */}


                    {/* Rewards Grid */}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-foreground">
                        {t('rewardsCatalog')}
                      </h3>
                      {filteredRewards.length > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {filteredRewards.length === 1 
                            ? t('availableRewards', { count: filteredRewards.length })
                            : t('availableRewardsPlural', { count: filteredRewards.length })
                          }
                        </p>
                      )}
                    </div>

                    {isLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="animate-pulse">
                            <div className="bg-muted h-48 rounded-lg mb-4"></div>
                            <div className="h-4 bg-muted rounded mb-2"></div>
                            <div className="h-4 bg-muted rounded w-2/3 mb-2"></div>
                            <div className="h-8 bg-muted rounded"></div>
                          </div>
                        ))}
                      </div>
                    ) : error ? (
                      <div className="text-center py-12">
                        <div className="text-red-500 text-6xl mb-4" aria-hidden="true">⚠️</div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {t('errorLoadingRewards')}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          {error}
                        </p>
                        <button
                          onClick={() => window.location.reload()}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          {t('tryAgain')}
                        </button>
                      </div>
                    ) : filteredRewards.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredRewards.map((reward) => (
                          <div key={reward.id} className="border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow bg-card">
                            <div className="aspect-w-16 aspect-h-9 bg-muted">
                              {reward.imageUrl ? (
                                <ImageWithFallback
                                  src={reward.imageUrl}
                                  alt={reward.name}
                                  className="w-full h-32 object-cover"
                                />
                              ) : (
                                <div className="w-full h-32 flex items-center justify-center bg-muted">
                                  <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            
                            <div className="p-4">
                              <h3 className="font-semibold text-foreground mb-2">
                                {reward.name}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-3">
                                {reward.description}
                              </p>
                              
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-1">
                                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" />
                                  </svg>
                                  <span className="text-sm font-medium text-foreground">
                                    {reward.pointsCost.toLocaleString()} {t('rewardPoints')}
                                  </span>
                                </div>
                                
                                {reward.category === 'discount' && reward.value && (
                                  <span className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                                    <span aria-hidden="true">💰</span>
                                    {formatPrice(reward.value)} {t('discountOff')}
                                  </span>
                                )}
                                
                                {reward.category === 'shipping' && (
                                  <span className="text-sm text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                                    <span aria-hidden="true">🚚</span>
                                    {t('freeShipping')}
                                  </span>
                                )}
                                
                                {reward.category === 'exclusive' && (
                                  <span className="text-sm text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
                                    <span aria-hidden="true">⭐</span>
                                    {t('exclusiveAccess')}
                                  </span>
                                )}
                              </div>

                              {reward.stock !== undefined && reward.stock <= 10 && reward.stock > 0 && (
                                <div className="mb-3 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                  <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                                    <span aria-hidden="true">⚠️</span>
                                    {t('limitedStock', { stock: reward.stock })}
                                  </p>
                                </div>
                              )}
                              
                              {reward.stock !== undefined && reward.stock === 0 && (
                                <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                    <span aria-hidden="true">❌</span>
                                    {t('outOfStock')}
                                  </p>
                                </div>
                              )}
                              
                              <button
                                onClick={() => handleRedeemReward(reward)}
                                disabled={
                                  !userPoints || 
                                  userPoints.currentPoints < reward.pointsCost || 
                                  redeemingReward === reward.id ||
                                  (reward.stock !== undefined && reward.stock <= 0)
                                }
                                className={`w-full py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                                  userPoints && userPoints.currentPoints >= reward.pointsCost && redeemingReward !== reward.id && (reward.stock === undefined || reward.stock > 0)
                                    ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transform hover:scale-105'
                                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                                }`}
                                aria-label={`${t('redeemReward')}: ${reward.name}`}
                              >
                                {redeemingReward === reward.id ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>{t('redeemingButton')}</span>
                                  </div>
                                ) : reward.stock !== undefined && reward.stock <= 0 ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <span aria-hidden="true">❌</span>
                                    <span>{t('outOfStock')}</span>
                                  </div>
                                ) : !userPoints || userPoints.currentPoints < reward.pointsCost ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <span aria-hidden="true">💰</span>
                                    <span>{t('insufficientPoints')}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center gap-2">
                                    <span aria-hidden="true">🎁</span>
                                    <span>{t('redeemReward')}</span>
                                  </div>
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4" aria-hidden="true">🎁</div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {selectedCategory === 'all' ? t('noRewardsFound') : t('noRewardsAvailable')}
                        </h3>
                        <p className="text-muted-foreground mb-6">
                          {selectedCategory === 'all' 
                            ? t('comingSoon')
                            : `No rewards available in the ${selectedCategory} category`
                          }
                        </p>
                        {selectedCategory !== 'all' && (
                          <button
                            onClick={() => setSelectedCategory('all')}
                            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            {t('allRewards')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
      )}
    </AccountLayout>
  );
}