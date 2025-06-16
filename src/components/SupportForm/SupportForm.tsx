// components/SupportForm/SupportForm.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import styles from './SupportForm.module.css';

interface SupportFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const SupportForm: React.FC<SupportFormProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.message) {
      toast.error('Please fill in your name and message');
      return;
    }

    // Create Telegram message
    const telegramMessage = encodeURIComponent(`🦊 CrazyFox Support Request

👤 Name: ${formData.name}
${formData.email ? `📧 Email: ${formData.email}` : ''}
${formData.subject ? `📋 Subject: ${formData.subject}` : ''}

💬 Message:
${formData.message}

---
Sent from CrazyFox website`);
    
    // Open Telegram with pre-filled message
    const telegramUrl = `https://t.me/MemeCrazyFox?text=${telegramMessage}`;
    window.open(telegramUrl, '_blank');
    
    toast.success('Opening Telegram chat... 📱');
    
    // Close modal and reset form
    onClose();
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
  };

  // Quick actions
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'telegram':
        window.open('https://t.me/MemeCrazyFox', '_blank');
        toast.success('Opening Telegram chat... 📱');
        break;
      case 'contract':
        navigator.clipboard.writeText('0xa2c959a7Fbf6d96eA4170e724D871E0556cd8556');
        toast.success('Contract address copied! 📋');
        break;
      case 'whitepaper':
        window.open('/whitepaper.pdf', '_blank');
        break;
      case 'website':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        onClose();
        break;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className={styles.modalOverlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            className={styles.supportModal}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className={styles.headerContent}>
                <span className={styles.supportIcon}>🦊</span>
                <h2>CrazyFox Support</h2>
              </div>
              <button 
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Close support form"
              >
                ✕
              </button>
            </div>

            <div className={styles.modalContent}>
              {/* Quick Actions */}
              <div className={styles.quickActions}>
                <h3>Quick Help</h3>
                <div className={styles.actionButtons}>
                  <motion.button
                    className={styles.actionButton}
                    onClick={() => handleQuickAction('telegram')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className={styles.actionIcon}>📱</span>
                    Direct Chat
                  </motion.button>
                  <motion.button
                    className={styles.actionButton}
                    onClick={() => handleQuickAction('contract')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className={styles.actionIcon}>📋</span>
                    Copy Contract
                  </motion.button>
                  <motion.button
                    className={styles.actionButton}
                    onClick={() => handleQuickAction('whitepaper')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className={styles.actionIcon}>📄</span>
                    Whitepaper
                  </motion.button>
                  <motion.button
                    className={styles.actionButton}
                    onClick={() => handleQuickAction('website')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className={styles.actionIcon}>🏠</span>
                    Back to Top
                  </motion.button>
                </div>
              </div>

              {/* Support Form */}
              <div className={styles.formSection}>
                <h3>Send Message to Telegram</h3>
                <p className={styles.formDescription}>
                  Fill out the form below and we'll open Telegram with your message ready to send to our support team.
                </p>
                
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
                      <label htmlFor="email">Email (optional)</label>
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
                    <label htmlFor="subject">Subject (optional)</label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                    >
                      <option value="">Choose a topic...</option>
                      <option value="Token Purchase Help">Token Purchase Help</option>
                      <option value="Wallet Connection Issue">Wallet Connection Issue</option>
                      <option value="Transaction Problem">Transaction Problem</option>
                      <option value="Presale Question">Presale Question</option>
                      <option value="Technical Support">Technical Support</option>
                      <option value="Partnership Inquiry">Partnership Inquiry</option>
                      <option value="General Question">General Question</option>
                      <option value="Bug Report">Bug Report</option>
                    </select>
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="message">Message *</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Describe your issue or question in detail..."
                      rows={4}
                      required
                    />
                  </div>

                  <div className={styles.formActions}>
                    <motion.button
                      type="button"
                      className={styles.cancelButton}
                      onClick={onClose}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="submit"
                      className={styles.submitButton}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span>📱</span>
                      Open Telegram Chat
                    </motion.button>
                  </div>
                </form>
              </div>

              {/* Contact Info */}
              <div className={styles.contactInfo}>
                <div className={styles.contactHeader}>
                  <span className={styles.contactIcon}>📱</span>
                  <div>
                    <strong>Telegram Support</strong>
                    <span>@MemeCrazyFox</span>
                  </div>
                </div>
                <p className={styles.contactNote}>
                  💡 <strong>Tip:</strong> For fastest support, send us a message directly on Telegram with your wallet address and transaction hash if applicable.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Обновляем импорт в главном файле (замените старый SupportButton)
// import SupportButton from '@/components/SupportForm/SupportForm';

// Support Button Component для замены в главном файле
const SupportButton = () => {
  const handleSupportClick = () => {
    // Прямая ссылка на Telegram
    window.open('https://t.me/MemeCrazyFox', '_blank');
  };

  return (
    <motion.div 
      className={styles.supportButton}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <button 
        onClick={handleSupportClick} 
        className={styles.supportButtonInner} 
        title="Contact Support via Telegram"
      >
        💬
      </button>
      <div className={styles.pulseRing}></div>
    </motion.div>
  );
};

export default SupportButton;