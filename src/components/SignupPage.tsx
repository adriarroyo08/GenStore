import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Mail, ArrowLeft, User, ShieldCheck, MapPin, Globe, ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { apiClient } from '../lib/apiClient';
import { PHONE_PREFIXES, COUNTRIES, SPAIN_PROVINCES, flagUrl } from '../constants/locationData';

interface SignupPageProps {
  onBackToLogin: () => void;
  onSignupSuccess: () => void;
  onVerificationRequired: (email: string) => void;
}

export function SignupPage({ onBackToLogin, onSignupSuccess, onVerificationRequired }: SignupPageProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    phoneCountry: 'ES',
    country: 'ES',
    address: '',
    city: '',
    postalCode: '',
    province: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [phonePrefixOpen, setPhonePrefixOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const phonePrefixRef = React.useRef<HTMLDivElement>(null);
  const countryRef = React.useRef<HTMLDivElement>(null);
  const [customCity, setCustomCity] = useState(false);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (phonePrefixRef.current && !phonePrefixRef.current.contains(e.target as Node)) {
        setPhonePrefixOpen(false);
      }
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setCountryOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  React.useEffect(() => {
    const username = formData.username.trim();

    if (!username || username.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/auth/check-username?username=${encodeURIComponent(username)}`);
        const data = await res.json();
        if (!cancelled) setUsernameStatus(data.available ? 'available' : 'taken');
      } catch {
        if (!cancelled) setUsernameStatus('idle');
      }
    }, 600);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [formData.username]);

  const getPasswordStrength = (password: string): { level: 'none' | 'weak' | 'medium' | 'strong'; score: number; label: string; color: string; tips: string[] } => {
    if (!password) return { level: 'none', score: 0, label: '', color: '', tips: [] };

    let score = 0;
    const tips: string[] = [];

    if (password.length >= 8) score++;
    else tips.push('Al menos 8 caracteres');

    if (password.length >= 12) score++;

    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    else tips.push('Mayúsculas y minúsculas');

    if (/\d/.test(password)) score++;
    else tips.push('Al menos un número');

    if (/[^a-zA-Z0-9]/.test(password)) score++;
    else tips.push('Un carácter especial (!@#$...)');

    // Penalize common patterns
    if (/^(123|abc|password|qwerty|000)/i.test(password)) score = Math.max(0, score - 2);
    if (/(.)\1{2,}/.test(password)) score = Math.max(0, score - 1); // repeated chars

    if (score <= 1) return { level: 'weak', score: 1, label: 'Débil', color: 'bg-red-500', tips };
    if (score <= 3) return { level: 'medium', score: 2, label: 'Media', color: 'bg-yellow-500', tips };
    return { level: 'strong', score: 3, label: 'Fuerte', color: 'bg-emerald-500', tips };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = t('errors.required');
    }

    if (!formData.username.trim()) {
      newErrors.username = t('errors.required');
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
      newErrors.username = 'Entre 3 y 20 caracteres (letras, números y _)';
    } else if (usernameStatus === 'taken') {
      newErrors.username = 'Este nombre de usuario ya está en uso';
    } else if (usernameStatus === 'checking') {
      newErrors.username = 'Espera a que se compruebe la disponibilidad';
    }

    if (!formData.email.trim()) {
      newErrors.email = t('errors.required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('errors.invalidEmail');
    }

    if (!formData.password) {
      newErrors.password = t('errors.required');
    } else if (passwordStrength.level === 'weak') {
      newErrors.password = 'La contraseña es demasiado débil. Debe ser al menos de nivel medio.';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('errors.required');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.passwordMismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const nameParts = formData.name.trim().split(/\s+/);
      const nombre = nameParts[0] || '';
      const apellidos = nameParts.slice(1).join(' ') || '';

      await apiClient.post('/auth/signup', {
        email: formData.email.trim(),
        password: formData.password,
        nombre,
        apellidos,
        username: formData.username.trim().toLowerCase(),
        telefono: formData.phone.trim()
          ? `${phonePrefix} ${formData.phone.trim()}`
          : undefined,
        direccion: formData.address.trim() || undefined,
        ciudad: formData.city.trim() || undefined,
        codigo_postal: formData.postalCode.trim() || undefined,
        provincia: formData.province.trim() || undefined,
        pais: formData.country || undefined,
      });

      // Signup successful — verification email sent via Resend
      onVerificationRequired(formData.email);
    } catch (error: any) {
      const msg = error?.message || '';
      if (msg.includes('ya está registrado') || msg.includes('already registered')) {
        setErrors({ email: 'Ya existe una cuenta con este email' });
      } else if (msg.includes('nombre de usuario ya está en uso') || msg.includes('username')) {
        setErrors({ username: 'Este nombre de usuario ya está en uso' });
      } else if (msg.includes('password') || msg.includes('contraseña')) {
        setErrors({ password: msg });
      } else if (msg.includes('email')) {
        setErrors({ email: msg });
      } else if (error instanceof TypeError && msg.includes('fetch')) {
        setErrors({ general: 'Error de conexión. Comprueba tu conexión a internet.' });
      } else {
        setErrors({ general: msg || 'Ha ocurrido un error inesperado. Inténtalo de nuevo.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const phonePrefix = PHONE_PREFIXES.find(p => p.code === formData.phoneCountry)?.prefix ?? '+34';

  const availableCities = React.useMemo(() => {
    if (formData.country !== 'ES' || !formData.province) return [];
    const found = SPAIN_PROVINCES.find(p => p.province === formData.province);
    return found?.cities ?? [];
  }, [formData.country, formData.province]);

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-600 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="signup-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#signup-grid)" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.317a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-2xl font-bold">GenStore</span>
          </div>

          {/* Main message */}
          <div className="space-y-6">
            <h2 className="text-4xl xl:text-5xl font-bold leading-tight">
              Únete a nuestra<br />comunidad
            </h2>
            <p className="text-lg text-white/80 max-w-md leading-relaxed">
              Crea tu cuenta y accede a productos de calidad con precios exclusivos.
            </p>

            {/* Feature highlights */}
            <div className="space-y-4 pt-4">
              {[
                { icon: '✨', text: 'Ofertas exclusivas para miembros' },
                { icon: '📦', text: 'Seguimiento de pedidos en tiempo real' },
                { icon: '🎯', text: 'Recomendaciones personalizadas' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xl" aria-hidden="true">{item.icon}</span>
                  <span className="text-white/90">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trust badge */}
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Registro seguro · Datos protegidos con SSL</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex flex-col bg-background">
        {/* Top bar */}
        <div className="flex items-center justify-between p-6">
          <button
            onClick={onBackToLogin}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Volver al inicio de sesión"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            <span className="text-sm hidden sm:inline">Iniciar sesión</span>
          </button>

          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="bg-emerald-500 p-2 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.317a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="font-bold text-lg text-foreground">GenStore</span>
          </div>

          <div />
        </div>

        {/* Form centered */}
        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm overflow-y-auto max-h-[calc(100vh-6rem)] sm:max-h-none">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {t('auth.createAccount')}
              </h1>
              <p className="text-muted-foreground">
                Únete a nuestra comunidad de bienestar
              </p>
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6">
                <span role="alert">{errors.general}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <label htmlFor="field-signup-name" className="text-sm font-medium text-foreground">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
                  <input
                    id="field-signup-name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ej: María García López"
                    required
                    aria-required="true"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "field-signup-name-error" : undefined}
                    disabled={isLoading}
                    className={`w-full pl-11 pr-4 py-3 min-h-[44px] bg-card border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors ${
                      errors.name ? 'border-destructive' : 'border-border'
                    }`}
                  />
                </div>
                {errors.name && (
                  <span id="field-signup-name-error" role="alert" className="text-sm text-destructive">{errors.name}</span>
                )}
              </div>

              {/* Username */}
              <div className="space-y-2">
                <label htmlFor="field-signup-username" className="text-sm font-medium text-foreground">
                  Nombre de usuario
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">@</span>
                  <input
                    id="field-signup-username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="tu_usuario"
                    required
                    autoComplete="username"
                    aria-required="true"
                    aria-invalid={!!errors.username}
                    aria-describedby={errors.username ? "field-signup-username-error" : undefined}
                    disabled={isLoading}
                    className={`w-full pl-9 pr-4 py-3 min-h-[44px] bg-card border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors ${
                      errors.username ? 'border-destructive' : 'border-border'
                    }`}
                  />
                </div>
                {errors.username && (
                  <span id="field-signup-username-error" role="alert" className="text-sm text-destructive">{errors.username}</span>
                )}
                {!errors.username && usernameStatus !== 'idle' && (
                  <span className={`text-xs flex items-center gap-1 ${
                    usernameStatus === 'available' ? 'text-emerald-600' :
                    usernameStatus === 'taken' ? 'text-destructive' :
                    usernameStatus === 'invalid' ? 'text-amber-600' :
                    'text-muted-foreground'
                  }`}>
                    {usernameStatus === 'checking' && (
                      <>
                        <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Comprobando disponibilidad...
                      </>
                    )}
                    {usernameStatus === 'available' && '✓ Disponible'}
                    {usernameStatus === 'taken' && '✗ Ya está en uso'}
                    {usernameStatus === 'invalid' && '✗ Solo letras, números y _ (3–20 caracteres)'}
                  </span>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="field-signup-email" className="text-sm font-medium text-foreground">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
                  <input
                    id="field-signup-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="usuario@ejemplo.com"
                    required
                    aria-required="true"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "field-signup-email-error" : undefined}
                    disabled={isLoading}
                    className={`w-full pl-11 pr-4 py-3 min-h-[44px] bg-card border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors ${
                      errors.email ? 'border-destructive' : 'border-border'
                    }`}
                  />
                </div>
                {errors.email && (
                  <span id="field-signup-email-error" role="alert" className="text-sm text-destructive">{errors.email}</span>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label htmlFor="field-signup-phone" className="text-sm font-medium text-foreground">
                  Teléfono <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <div className="flex">
                  <div ref={phonePrefixRef} className="relative">
                    <button
                      type="button"
                      aria-label="Seleccionar prefijo telefónico"
                      aria-expanded={phonePrefixOpen}
                      onClick={() => setPhonePrefixOpen(prev => !prev)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3 py-3 min-h-[44px] border border-r-0 border-border rounded-l-xl bg-card text-foreground text-sm hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      <img src={flagUrl(formData.phoneCountry)} alt={formData.phoneCountry} className="w-5 h-3.5 object-cover rounded-sm" />
                      <span className="text-xs text-muted-foreground">{phonePrefix}</span>
                      <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${phonePrefixOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {phonePrefixOpen && (
                      <ul className="absolute z-50 top-full left-0 mt-1 w-56 max-h-60 overflow-y-auto bg-card border border-border rounded-xl shadow-lg py-1">
                        {PHONE_PREFIXES.map(p => (
                          <li key={p.code}>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, phoneCountry: p.code }));
                                setPhonePrefixOpen(false);
                              }}
                              className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-primary/10 transition-colors ${
                                formData.phoneCountry === p.code ? 'bg-primary/10 font-medium' : ''
                              }`}
                            >
                              <img src={flagUrl(p.code)} alt={p.code} className="w-6 h-4 object-cover rounded-sm" />
                              <span className="text-foreground">{p.name}</span>
                              <span className="text-muted-foreground ml-auto">{p.prefix}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <input
                    id="field-signup-phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="612 345 678"
                    disabled={isLoading}
                    className="flex-1 pl-4 pr-4 py-3 min-h-[44px] bg-card border border-border rounded-r-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  />
                </div>
              </div>

              {/* Country */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  País <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <div ref={countryRef} className="relative">
                  <button
                    type="button"
                    aria-label="Seleccionar país"
                    aria-expanded={countryOpen}
                    onClick={() => setCountryOpen(prev => !prev)}
                    disabled={isLoading}
                    className="w-full flex items-center gap-3 px-4 py-3 min-h-[44px] bg-card border border-border rounded-xl text-foreground text-sm hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    <img src={flagUrl(formData.country)} alt={formData.country} className="w-6 h-4 object-cover rounded-sm" />
                    <span className="flex-1 text-left">
                      {COUNTRIES.find(c => c.code === formData.country)?.name ?? formData.country}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${countryOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {countryOpen && (
                    <ul className="absolute z-50 top-full left-0 mt-1 w-full max-h-56 overflow-y-auto bg-card border border-border rounded-xl shadow-lg py-1">
                      {COUNTRIES.map(c => (
                        <li key={c.code}>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, country: c.code, province: '', city: '' }));
                              setCustomCity(false);
                              setCountryOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-primary/10 transition-colors ${
                              formData.country === c.code ? 'bg-primary/10 font-medium' : ''
                            }`}
                          >
                            <img src={flagUrl(c.code)} alt={c.code} className="w-6 h-4 object-cover rounded-sm" />
                            <span className="text-foreground">{c.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label htmlFor="field-signup-address" className="text-sm font-medium text-foreground">
                  Dirección <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
                  <input
                    id="field-signup-address"
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Calle, número, piso..."
                    disabled={isLoading}
                    className="w-full pl-11 pr-4 py-3 min-h-[44px] bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  />
                </div>
              </div>

              {/* Provincia + Ciudad */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label htmlFor="field-signup-province" className="text-sm font-medium text-foreground">
                    Provincia
                  </label>
                  {formData.country === 'ES' ? (
                    <select
                      id="field-signup-province"
                      name="province"
                      value={formData.province}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, province: e.target.value, city: '' }));
                        setCustomCity(false);
                      }}
                      disabled={isLoading}
                      className="w-full px-3 py-3 min-h-[44px] bg-card border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm appearance-none"
                    >
                      <option value="">Selecciona provincia</option>
                      {SPAIN_PROVINCES.map(p => (
                        <option key={p.province} value={p.province}>{p.province}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="field-signup-province"
                      name="province"
                      type="text"
                      value={formData.province}
                      onChange={handleInputChange}
                      placeholder="Región / Estado"
                      disabled={isLoading}
                      className="w-full px-3 py-3 min-h-[44px] bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="field-signup-city" className="text-sm font-medium text-foreground">
                    Ciudad
                  </label>
                  {formData.country === 'ES' && availableCities.length > 0 && !customCity ? (
                    <select
                      id="field-signup-city"
                      name="city"
                      value={formData.city}
                      onChange={(e) => {
                        if (e.target.value === '__other') {
                          setCustomCity(true);
                          setFormData(prev => ({ ...prev, city: '' }));
                        } else {
                          setFormData(prev => ({ ...prev, city: e.target.value }));
                        }
                      }}
                      disabled={isLoading}
                      className="w-full px-3 py-3 min-h-[44px] bg-card border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm appearance-none"
                    >
                      <option value="">Selecciona municipio</option>
                      {availableCities.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="__other">Otro municipio...</option>
                    </select>
                  ) : (
                    <div className="relative">
                      <input
                        id="field-signup-city"
                        name="city"
                        type="text"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder={
                          formData.country === 'ES' && !formData.province
                            ? 'Elige provincia primero'
                            : 'Escribe tu municipio'
                        }
                        disabled={isLoading}
                        className="w-full px-3 py-3 min-h-[44px] bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
                      />
                      {customCity && availableCities.length > 0 && (
                        <button
                          type="button"
                          onClick={() => { setCustomCity(false); setFormData(prev => ({ ...prev, city: '' })); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-primary hover:text-primary/80"
                        >
                          Ver lista
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Código Postal */}
              <div className="space-y-2">
                <label htmlFor="field-signup-postal" className="text-sm font-medium text-foreground">
                  Código Postal
                </label>
                <input
                  id="field-signup-postal"
                  name="postalCode"
                  type="text"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  placeholder="28001"
                  disabled={isLoading}
                  className="w-full px-3 py-3 min-h-[44px] bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="field-signup-password" className="text-sm font-medium text-foreground">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
                  <input
                    id="field-signup-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Mínimo 8 caracteres"
                    required
                    aria-required="true"
                    aria-invalid={!!errors.password}
                    aria-describedby={`${errors.password ? 'field-signup-password-error ' : ''}field-signup-password-hint`}
                    disabled={isLoading}
                    className={`w-full pl-11 pr-12 py-3 min-h-[44px] bg-card border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors ${
                      errors.password ? 'border-destructive' : 'border-border'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <span id="field-signup-password-error" role="alert" className="text-sm text-destructive">{errors.password}</span>
                )}
                {formData.password && (
                  <div id="field-signup-password-hint" className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex gap-1">
                        {[1, 2, 3].map((bar) => (
                          <div
                            key={bar}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                              bar <= passwordStrength.score ? passwordStrength.color : 'bg-border'
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`text-xs font-medium ${
                        passwordStrength.level === 'weak' ? 'text-red-500' :
                        passwordStrength.level === 'medium' ? 'text-yellow-600' :
                        'text-emerald-600'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    {passwordStrength.tips.length > 0 && passwordStrength.level !== 'strong' && (
                      <p className="text-xs text-muted-foreground">
                        Consejo: {passwordStrength.tips[0]}
                      </p>
                    )}
                  </div>
                )}
                {!formData.password && (
                  <p id="field-signup-password-hint" className="text-xs text-muted-foreground">
                    Mínimo 8 caracteres, combinando mayúsculas, números y símbolos
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label htmlFor="field-signup-confirm" className="text-sm font-medium text-foreground">
                  {t('auth.confirmPassword')}
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
                  <input
                    id="field-signup-confirm"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Repite tu contraseña"
                    required
                    aria-required="true"
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={errors.confirmPassword ? "field-signup-confirm-error" : undefined}
                    disabled={isLoading}
                    className={`w-full pl-11 pr-12 py-3 min-h-[44px] bg-card border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors ${
                      errors.confirmPassword ? 'border-destructive' : 'border-border'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span id="field-signup-confirm-error" role="alert" className="text-sm text-destructive">{errors.confirmPassword}</span>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || !formData.name || !formData.email || !formData.password || !formData.confirmPassword || passwordStrength.level === 'weak'}
                className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creando cuenta...
                  </span>
                ) : (
                  'Crear Mi Cuenta'
                )}
              </button>

              {/* Login link */}
              <p className="text-center text-sm text-muted-foreground pt-2">
                {t('auth.alreadyHaveAccount')}{' '}
                <button
                  type="button"
                  onClick={onBackToLogin}
                  disabled={isLoading}
                  className="text-primary hover:underline font-semibold"
                >
                  {t('auth.signIn')}
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
