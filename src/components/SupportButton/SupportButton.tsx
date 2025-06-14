// components/SupportButton/SupportButton.tsx
'use client';

import { useState } from 'react';
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.message) {
      toast.error('Please fill in required fields!');
      return;
    }

    setIsSubmitting(true);

    try {
      // Формируем сообщение для Telegram
      const telegramMessage = `🦊 NEW SUPPORT REQUEST 🦊

👤 Name: ${formData.name}
📧 Email: ${formData.email || 'Not provided'}
📝 Subject: ${formData.subject || 'General Support'}

💬 Message:
${formData.message}

---
Sent from CrazyFox Website`;

      // Encode message for URL
      const encodedMessage = encodeURIComponent(telegramMessage);
      
      // Open Telegram with pre-filled message
      const telegramUrl = `https://t.me/MemeCrazyFox?text=${encodedMessage}`;
      window.open(telegramUrl, '_blank');

      // Success feedback
      toast.success('🎉 Redirecting to Telegram! Your message is ready to send.');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      setShowForm(false);

    } catch (error) {
      console.error('Error:', error);
      toast.error('Something went wrong. Please try again or contact us directly on Telegram.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectTelegram = () => {
    window.open('https://t.me/MemeCrazyFox', '_blank');
  };

  return (
    <>
      <motion.div 
        className={styles.supportButton}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <button 
          onClick={() => setShowForm(true)} 
          className={styles.supportButtonInner} 
          title="Support & Help"
          aria-label="Open Support Form"
        >
          💬
        </button>
      </motion.div>

      {/* Support Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowForm(false)}
          >
            <motion.div 
              className={styles.supportModal}
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className={styles.modalHeader}>
                <div className={styles.headerContent}>
                  <h3>🦊 CrazyFox Support</h3>
                  <p>We're here to help! Fill out the form below or contact us directly.</p>
                </div>
                <button 
                  className={styles.closeButton}
                  onClick={() => setShowForm(false)}
                  aria-label="Close support form"
                >
                  ✕
                </button>
              </div>

              {/* Support Options */}
              <div className={styles.supportOptions}>
                <button 
                  className={styles.directTelegramButton}
                  onClick={handleDirectTelegram}
                >
                  <span className={styles.telegramIcon}>📱</span>
                  Contact us directly on Telegram
                </button>
                
                <div className={styles.divider}>
                  <span>OR</span>
                </div>
              </div>

              {/* Support Form */}
              <form onSubmit={handleSubmit} className={styles.supportForm}>
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="name">
                      Name <span className={styles.required}>*</span>
                    </label>
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
                      placeholder="your@email.com (optional)"
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
                    <option value="">Select a topic...</option>
                    <option value="🔧 Technical Support">🔧 Technical Support</option>
                    <option value="💰 Token Purchase Help">💰 Token Purchase Help</option>
                    <option value="🦊 General Questions">🦊 General Questions</option>
                    <option value="🤝 Partnership Inquiry">🤝 Partnership Inquiry</option>
                    <option value="🐛 Bug Report">🐛 Bug Report</option>
                    <option value="💡 Feature Request">💡 Feature Request</option>
                    <option value="❓ Other">❓ Other</option>
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="message">
                    Message <span className={styles.required}>*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Describe your question or issue in detail..."
                    rows={5}
                    required
                  />
                  <div className={styles.charCount}>
                    {formData.message.length}/1000
                  </div>
                </div>

                {/* Form Actions */}
                <div className={styles.formActions}>
                  <motion.button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => setShowForm(false)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  
                  <motion.button
                    type="submit"
                    className={styles.submitButton}
                    disabled={isSubmitting || !formData.name || !formData.message}
                    whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                    whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                  >
                    {isSubmitting ? (
                      <span>
                        🔄 Preparing...
                      </span>
                    ) : (
                      <span>
                        📨 Send to Telegram
                      </span>
                    )}
                  </motion.button>
                </div>

                {/* Footer Info */}
                <div className={styles.formFooter}>
                  <p>
                    🔒 Your information is secure and will only be used to help you.
                  </p>
                  <p>
                    📞 For urgent issues, contact us directly: <strong>@MemeCrazyFox</strong>
                  </p>
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