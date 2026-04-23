import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { apiClient } from '../lib/apiClient';

interface Session {
  id: string;
  device_info: {
    browser: string;
    os: string;
    device_type: string;
  };
  ip_address: string;
  location: string;
  last_active: string;
  last_active_relative: string;
  is_current: boolean;
  created_at: string;
}

interface SessionsManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSuccess: () => void;
}

export function SessionsManagementModal({ isOpen, onClose, user, onSuccess }: SessionsManagementModalProps) {
  const { t } = useLanguage();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSessions();
    }
  }, [isOpen]);

  const fetchSessions = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await apiClient.get<any>('/auth/sessions');

      setSessions(data.sessions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setActionLoading(sessionId);
    setError('');

    try {
      const data = await apiClient.delete<any>(`/auth/sessions/${sessionId}`);

      // Refresh sessions after successful revocation
      await fetchSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke session');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    setActionLoading('all');
    setError('');

    try {
      const data = await apiClient.delete<any>('/auth/sessions');

      // Refresh sessions after successful revocation
      await fetchSessions();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke sessions');
    } finally {
      setActionLoading(null);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'tablet':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('sessions.activeSessions')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">{t('general.loading')}</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="font-medium text-blue-800 dark:text-blue-300">
                      {t('sessions.sessionsInfo')}
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                      {t('sessions.sessionsInfoDesc')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sessions List */}
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div 
                    key={session.id} 
                    className={`border rounded-lg p-4 ${
                      session.is_current 
                        ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20' 
                        : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          session.is_current 
                            ? 'bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-300' 
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {getDeviceIcon(session.device_info.device_type)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {session.device_info.browser} on {session.device_info.os}
                            </h4>
                            {session.is_current && (
                              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full dark:bg-green-800 dark:text-green-200">
                                {t('sessions.currentSession')}
                              </span>
                            )}
                          </div>
                          
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            <div className="flex items-center gap-4">
                              <span>{session.device_info.device_type}</span>
                              <span>IP: {session.ip_address}</span>
                              <span>{t('sessions.lastActive')}: {session.last_active_relative}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {!session.is_current && (
                        <button
                          onClick={() => handleRevokeSession(session.id)}
                          disabled={actionLoading === session.id}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                        >
                          {actionLoading === session.id ? (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin"></div>
                              {t('sessions.revoking')}
                            </div>
                          ) : (
                            t('sessions.revoke')
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('sessions.totalSessions', { count: sessions.length })}
                  </p>
                  
                  {sessions.filter(s => !s.is_current).length > 0 && (
                    <button
                      onClick={handleRevokeAllOtherSessions}
                      disabled={actionLoading === 'all'}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {actionLoading === 'all' ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
                          {t('general.loading')}
                        </div>
                      ) : (
                        t('sessions.revokeAllOthers')
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}