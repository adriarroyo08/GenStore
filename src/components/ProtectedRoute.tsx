import type { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types/auth'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRoles?: UserRole[]
  fallback?: ReactNode
  onUnauthorized?: () => void
}

/**
 * Componente que protege rutas requiriendo autenticación y, opcionalmente, roles específicos.
 *
 * Uso:
 * <ProtectedRoute requiredRoles={['admin']}>
 *   <AdminPanel />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  requiredRoles,
  fallback,
  onUnauthorized,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    if (onUnauthorized) {
      onUnauthorized()
      return null
    }
    return fallback ?? <UnauthorizedMessage tipo="no-autenticado" />
  }

  if (requiredRoles && user && !requiredRoles.includes(user.rol)) {
    return fallback ?? <UnauthorizedMessage tipo="sin-permisos" />
  }

  return <>{children}</>
}

function LoadingScreen() {
  return (
    <div style={styles.centered}>
      <div style={styles.spinner} />
      <p style={styles.loadingText}>Verificando sesión...</p>
    </div>
  )
}

interface UnauthorizedMessageProps {
  tipo: 'no-autenticado' | 'sin-permisos'
}

function UnauthorizedMessage({ tipo }: UnauthorizedMessageProps) {
  return (
    <div style={styles.centered}>
      <div style={styles.card}>
        <span style={styles.icon}>{tipo === 'no-autenticado' ? '🔒' : '⛔'}</span>
        <h2 style={styles.title}>
          {tipo === 'no-autenticado' ? 'Acceso restringido' : 'Sin permisos'}
        </h2>
        <p style={styles.message}>
          {tipo === 'no-autenticado'
            ? 'Debes iniciar sesión para acceder a esta página.'
            : 'No tienes permisos para acceder a esta sección.'}
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  centered: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '4px solid #e2e8f0',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: '2rem',
    textAlign: 'center',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    maxWidth: 320,
  },
  icon: {
    fontSize: 48,
    display: 'block',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 600,
    color: '#1e293b',
    margin: '0 0 8px',
  },
  message: {
    fontSize: 14,
    color: '#64748b',
    margin: 0,
  },
}
