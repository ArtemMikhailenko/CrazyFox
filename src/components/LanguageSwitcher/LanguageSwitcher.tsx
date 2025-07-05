// src/components/LanguageSwitcher/LanguageSwitcher.tsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/hooks/useLanguage';
import { LanguageCode } from '@/locales/i18n';
import styles from './LanguageSwitcher.module.css';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'default' | 'compact';
  showLabel?: boolean;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  className = '', 
  variant = 'default',
  showLabel = true 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const {
    currentLanguage,
    currentLanguageInfo,
    supportedLanguages,
    changeLanguage,
    isLanguageLoading
  } = useLanguage();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside as any, { passive: true });
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as any);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          setIsOpen(false);
          buttonRef.current?.focus();
          break;
        case 'ArrowDown':
        case 'ArrowUp':
          event.preventDefault();
          // Focus first/last option
          const options = dropdownRef.current?.querySelectorAll('button[role="option"]');
          if (options && options.length > 0) {
            const firstOption = options[0] as HTMLElement;
            const lastOption = options[options.length - 1] as HTMLElement;
            if (event.key === 'ArrowDown') {
              firstOption.focus();
            } else {
              lastOption.focus();
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleLanguageChange = useCallback(async (languageCode: LanguageCode) => {
    if (languageCode === currentLanguage || isChanging) return;

    setIsChanging(true);
    setIsOpen(false);

    try {
      const success = await changeLanguage(languageCode);
      if (success) {
        // Optional: Add success feedback
        console.log(`Language changed to ${languageCode}`);
      }
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsChanging(false);
    }
  }, [currentLanguage, changeLanguage, isChanging]);

  const toggleDropdown = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const isLoading = isLanguageLoading || isChanging;

  return (
    <div className={`${styles.languageSwitcher} ${className} ${isLoading ? styles.loading : ''}`}>
      <motion.button
        ref={buttonRef}
        onClick={toggleDropdown}
        className={`${styles.currentLanguage} ${isOpen ? styles.open : ''}`}
        disabled={isLoading}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Current language: ${currentLanguageInfo.name}. Click to change language`}
        whileHover={!isLoading ? { scale: 1.02 } : {}}
        whileTap={!isLoading ? { scale: 0.98 } : {}}
      >
        <span className={styles.flag} aria-hidden="true">
          {currentLanguageInfo.flag}
        </span>
        {showLabel && variant === 'default' && (
          <span className={styles.languageCode}>
            {currentLanguageInfo.code}
          </span>
        )}
        <span className={styles.dropdownIcon} aria-hidden="true">
          ▼
        </span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            className={styles.dropdown}
            role="listbox"
            aria-label="Select language"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className={styles.dropdownHeader}>
              Choose Language
            </div>
            
            {supportedLanguages.map((language, index) => {
              const isActive = language.code === currentLanguage;
              
              return (
                <motion.button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  className={`${styles.languageOption} ${isActive ? styles.active : ''}`}
                  role="option"
                  aria-selected={isActive}
                  tabIndex={0}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ backgroundColor: 'rgba(78, 205, 196, 0.15)' }}
                >
                  <span className={styles.optionFlag} aria-hidden="true">
                    {language.flag}
                  </span>
                  <span className={styles.optionName}>
                    {language.name}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSwitcher;