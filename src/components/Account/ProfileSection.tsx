import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
}

interface ProfileSectionProps {
  profileData: ProfileData;
  setProfileData: (data: ProfileData) => void;
  isEditing: boolean;
  isLoadingProfile: boolean;
  isSaving: boolean;
  onEditClick: () => void;
  onCancelEdit: () => void;
  onSaveProfile: () => void;
}

export function ProfileSection({
  profileData,
  setProfileData,
  isEditing,
  isLoadingProfile,
  isSaving,
  onEditClick,
  onCancelEdit,
  onSaveProfile
}: ProfileSectionProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          {t('account.profileInformation')}
        </h2>
        {!isEditing && !isLoadingProfile && (
          <button
            onClick={onEditClick}
            className="flex items-center gap-2 text-primary hover:text-primary/80"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {t('account.edit')}
          </button>
        )}
      </div>

      {isLoadingProfile ? (
        <div className="flex items-center justify-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="ml-4 text-muted-foreground">{t('general.loading')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('account.firstName')}
            </label>
            <input
              type="text"
              value={profileData.firstName}
              onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-border rounded-lg bg-muted text-foreground disabled:opacity-60 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('account.lastName')}
            </label>
            <input
              type="text"
              value={profileData.lastName}
              onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-border rounded-lg bg-muted text-foreground disabled:opacity-60 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('account.emailAddress')}
            </label>
            <input
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({...profileData, email: e.target.value})}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-border rounded-lg bg-muted text-foreground disabled:opacity-60 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('account.phoneNumber')}
            </label>
            <input
              type="tel"
              value={profileData.phone}
              onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-border rounded-lg bg-muted text-foreground disabled:opacity-60 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('account.dateOfBirth')}
            </label>
            <input
              type="date"
              value={profileData.dateOfBirth}
              onChange={(e) => setProfileData({...profileData, dateOfBirth: e.target.value})}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-border rounded-lg bg-muted text-foreground disabled:opacity-60 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      )}

      {isEditing && (
        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={onCancelEdit}
            className="px-6 py-2 border border-border text-muted-foreground rounded-lg hover:bg-muted transition-colors"
          >
            {t('general.cancel')}
          </button>
          <button
            onClick={onSaveProfile}
            disabled={isSaving}
            className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving && (
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
            )}
            {t('general.save')}
          </button>
        </div>
      )}
    </div>
  );
}