// components/SupportButton/SupportButton.tsx
'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import styles from './SupportButton.module.css';

const SupportButton = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.message) {
      toast.error('Please fill in required fields!');
      return;
    }

    setIsSubmitting(true);

    try {
      const telegramMessage = `🦊 NEW SUPPORT REQUEST 🦊

👤 Name: ${formData.name}
📧 Email: ${formData.email || 'Not provided'}
📝 Subject: ${formData.subject || 'General Support'}

💬 Message:
${formData.message}

---
Sent from CrazyFox Website`;

      const encodedMessage = encodeURIComponent(telegramMessage);
      const telegramUrl = `https://t.me/MemeCrazyFox?text=${encodedMessage}`;
      window.open(telegramUrl, '_blank');

      toast.success('🎉 Redirecting to Telegram!');
      
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      setShowForm(false);

    } catch (error) {
      console.error('Error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData]);

  const handleDirectTelegram = useCallback(() => {
    window.open('https://t.me/MemeCrazyFox', '_blank');
  }, []);

  const closeModal = useCallback(() => {
    setShowForm(false);
  }, []);

  const openModal = useCallback(() => {
    setShowForm(true);
  }, []);

  return (
    <>
      {/* Упрощенная кнопка без сложных анимаций */}
      <div className={styles.supportButton}>
        <button 
          onClick={openModal} 
          className={styles.supportButtonInner} 
          title="Support & Help"
          aria-label="Open Support Form"
        >
          💬
        </button>
      </div>

      {/* Оптимизированная модалка */}
      <AnimatePresence mode="wait">
        {showForm && (
          <motion.div 
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeModal}
          >
            <motion.div 
              className={styles.supportModal}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Упрощенный хедер */}
              <div className={styles.modalHeader}>
                <div className={styles.headerContent}>
                  <h3>🦊 CrazyFox Support</h3>
                  <p>We're here to help!</p>
                </div>
                <button 
                  className={styles.closeButton}
                  onClick={closeModal}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {/* Прямая связь */}
              <div className={styles.supportOptions}>
                <button 
                  className={styles.directTelegramButton}
                  onClick={handleDirectTelegram}
                >
                  📱 Contact us on Telegram
                </button>
                <div className={styles.divider}>OR</div>
              </div>

              {/* Упрощенная форма */}
              <form onSubmit={handleSubmit} className={styles.supportForm}>
                <div className={styles.formRow}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="name">Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Your name"
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="subject">Subject</label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                  >
                    <option value="">Select topic...</option>
                    <option value="Technical Support">🔧 Technical Support</option>
                    <option value="Token Purchase">💰 Token Purchase</option>
                    <option value="General Questions">🦊 General Questions</option>
                    <option value="Partnership">🤝 Partnership</option>
                    <option value="Bug Report">🐛 Bug Report</option>
                    <option value="Feature Request">💡 Feature Request</option>
                    <option value="Other">❓ Other</option>
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Describe your question..."
                    rows={4}
                    required
                  />
                  <div className={styles.charCount}>
                    {formData.message.length}/1000
                  </div>
                </div>

                {/* Упрощенные кнопки */}
                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={isSubmitting || !formData.name || !formData.message}
                  >
                    {isSubmitting ? '🔄 Sending...' : '📨 Send to Telegram'}
                  </button>
                </div>

                <div className={styles.formFooter}>
                  <p>🔒 Secure • Direct contact: <strong>@MemeCrazyFox</strong></p>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SupportButton;