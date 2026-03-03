import { useState, useEffect, useRef } from 'react';
import { API_URL, DISABLE_AUTH } from '../constants';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export const useAuth = () => {
  const [showAdmin, setShowAdmin] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Session timeout check
  useEffect(() => {
    if (!isAuthenticated) return;
    const checkSession = setInterval(() => {
      if (Date.now() - lastActivityRef.current > SESSION_TIMEOUT) {
        setIsAuthenticated(false);
        setAuthToken(null);
        setShowAdmin(false);
        sessionStorage.removeItem('admin_token');
        alert('Admin session expired due to inactivity. Please authenticate again.');
      }
    }, 60000);
    return () => clearInterval(checkSession);
  }, [isAuthenticated]);

  // Activity tracking
  useEffect(() => {
    const updateActivity = () => { lastActivityRef.current = Date.now(); };
    if (isAuthenticated) {
      window.addEventListener('click', updateActivity);
      window.addEventListener('keydown', updateActivity);
      window.addEventListener('scroll', updateActivity);
      return () => {
        window.removeEventListener('click', updateActivity);
        window.removeEventListener('keydown', updateActivity);
        window.removeEventListener('scroll', updateActivity);
      };
    }
  }, [isAuthenticated]);

  // Restore session on mount
  useEffect(() => {
    const savedToken = sessionStorage.getItem('admin_token');
    const savedTimestamp = sessionStorage.getItem('admin_timestamp');
    if (savedToken && savedTimestamp) {
      const timeSinceAuth = Date.now() - parseInt(savedTimestamp);
      if (timeSinceAuth < SESSION_TIMEOUT) {
        setIsAuthenticated(true);
        setAuthToken(savedToken);
        lastActivityRef.current = Date.now();
      } else {
        sessionStorage.removeItem('admin_token');
        sessionStorage.removeItem('admin_timestamp');
      }
    }
  }, []);

  const handleAdminUnlock = () => {
    if (DISABLE_AUTH) { setShowAdmin(!showAdmin); return; }
    if (lockoutUntil && Date.now() < lockoutUntil) {
      alert(`Too many failed attempts. Please wait ${Math.ceil((lockoutUntil - Date.now()) / 1000)} seconds.`);
      return;
    }
    if (isAuthenticated) { setShowAdmin(!showAdmin); }
    else { setShowPasswordModal(true); setPasswordInput(''); setPasswordError(''); }
  };

  const handlePasswordSubmit = async () => {
    if (!passwordInput.trim()) { setPasswordError('Please enter a password'); return; }
    try {
      const response = await fetch(`${API_URL}/verify-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      const data = await response.json();
      if (data.success) {
        setIsAuthenticated(true); setAuthToken(data.token); setShowAdmin(true);
        setShowPasswordModal(false); setPasswordInput(''); setPasswordError('');
        setFailedAttempts(0); setLockoutUntil(null);
        sessionStorage.setItem('admin_token', data.token);
        sessionStorage.setItem('admin_timestamp', Date.now().toString());
        lastActivityRef.current = Date.now();
      } else {
        const newFailed = failedAttempts + 1;
        setFailedAttempts(newFailed);
        if (newFailed >= 3) {
          setLockoutUntil(Date.now() + 60000);
          setPasswordError('Too many failed attempts. Locked out for 1 minute.');
          setShowPasswordModal(false); setPasswordInput('');
          setTimeout(() => { setFailedAttempts(0); setLockoutUntil(null); }, 60000);
        } else {
          setPasswordError(`Incorrect password. ${3 - newFailed} attempts remaining.`);
        }
      }
    } catch (error: any) {
      setPasswordError(`Error connecting to server: ${error.message}. Make sure server is running and ADMIN_PASSWORD is set.`);
    }
  };

  const handleAdminLock = () => {
    setIsAuthenticated(false); setAuthToken(null); setShowAdmin(false);
    sessionStorage.removeItem('admin_token'); sessionStorage.removeItem('admin_timestamp');
  };

  const dismissPasswordModal = () => {
    setShowPasswordModal(false); setPasswordInput(''); setPasswordError('');
  };

  return {
    showAdmin,
    isAuthenticated,
    showPasswordModal,
    passwordInput,
    passwordError,
    setPasswordInput,
    handleAdminUnlock,
    handlePasswordSubmit,
    handleAdminLock,
    dismissPasswordModal,
  };
};
