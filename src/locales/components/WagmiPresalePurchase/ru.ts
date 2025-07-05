export const wagmiPresalePurchaseLocale = {
    header: {
      title: "🦊 ПРЕДПРОДАЖА CRFX",
      subtitle: "Лунная Миссия Скоро Начнется"
    },
    countdown: {
      title: "🚀 Запуск Миссии Через:",
      labels: {
        days: "Дни",
        hours: "Часы",
        minutes: "Мин",
        seconds: "Сек"
      },
      endDate: "Окончание: 18 сентября 2025 (UTC)"
    },
    progress: {
      stage: "Этап 2/6",
      raised: "Собрано {amount}",
      complete: "32.5% Завершено"
    },
    price: {
      current: "Текущая: $0.006",
      next: "Следующая: $0.007"
    },
    connection: {
      connected: "Подключен: {address}",
      wallet: "Кошелек: {walletName}",
      balance: "Баланс: {balance} BNB",
      switchToBSC: "⚠️ Переключить на BSC",
      optimizedFor: "✨ Оптимизировано для {walletName}",
      gasRequirement: "🛡️ Trust Wallet с ценой газа 3+ gwei"
    },
    transactionStatus: {
      confirmBinance: "🔶 Подтвердите в Binance Wallet...",
      confirmTrust: "🛡️ Подтвердите в Trust Wallet...",
      confirmWallet: "🔄 Ожидание подтверждения кошелька...",
      confirming: "⏳ Подтверждение транзакции в блокчейне BSC..."
    },
    pendingTransactions: {
      title: "⏳ Ожидающие Транзакции",
      amount: "Сумма: {amount} BNB",
      hash: "Хеш: {hash}...",
      status: "Статус: {status}",
      wallet: "Кошелек: {walletType}",
      retryButton: "Повторить API Вызов",
      removeButton: "Удалить"
    },
    connectWallet: {
      title: "Подключите кошелек для участия:",
      connectButton: "🌈 Подключить Кошелек",
      wrongNetwork: "⚠️ Неправильная сеть"
    },
    walletBenefits: {
      binance: {
        title: "🔶 Преимущества Binance Wallet",
        benefits: [
          "⚡ Нативная интеграция с BSC",
          "💰 Более низкие комиссии за транзакции",
          "🚀 Более быстрые подтверждения"
        ]
      },
      trustWallet: {
        title: "🛡️ Требования к Газу Trust Wallet",
        requirements: [
          "✅ Цена Газа: 3+ gwei (Обновлено)",
          "✅ Лимит Газа: 21,000-23,000",
          "✅ Буфер: Рекомендуется 0.01 BNB"
        ]
      }
    },
    form: {
      quickAmountsLabel: "Быстрые суммы (BNB):",
      amountLabel: "Сумма (BNB):",
      amountPlaceholder: "0.0",
      invalidAmount: "Пожалуйста, введите корректную сумму (0.0001 - 100 BNB)",
      trustWalletGasFee: "🛡️ Trust Wallet: {fee} BNB комиссия за газ (3 gwei)",
      youReceive: "Вы получите:",
      tokensAmount: "{amount} CRFX 🦊",
      rate: "Курс: {rate} CRFX за BNB"
    },
    buyButton: {
      confirmBinance: "🔶 Подтвердите в Binance Wallet...",
      confirmTrust: "🛡️ Подтвердите в Trust Wallet...",
      confirmWallet: "🔄 Подтвердите в Кошельке...",
      confirming: "⏳ Подтверждение на BSC...",
      processing: "🔄 Обработка...",
      switchNetwork: "⚠️ Переключить на Сеть BSC",
      invalidAmount: "❌ Неверная Сумма",
      buyWithBinance: "🔶 Купить через Binance Wallet",
      buyWithTrust: "🛡️ Купить через Trust Wallet (3+ gwei)",
      buyWithWagmi: "🚀 Купить через Wagmi"
    },
    networkHelper: {
      binance: "🔶 Обнаружен Binance Wallet! Нажмите кнопку выше для автоматического переключения на сеть BSC.",
      trust: "🛡️ Обнаружен Trust Wallet! Нажмите кнопку выше для автоматического переключения на сеть BSC с оптимизированными настройками газа."
    },
    gasInfo: {
      title: "⛽ Текущие Настройки Газа",
      trustWallet: "🛡️ Trust Wallet: Оптимизировано для 3-5 gwei (требование BSC)",
      binanceWallet: "🔶 Binance Wallet: Нативная интеграция BSC с оптимальным газом",
      standardWallet: "⚡ Стандартный кошелек: Авто-оптимизированный газ для BSC"
    },
    messages: {
      connectFirst: "Пожалуйста, сначала подключите кошелек! 🦊",
      contractNotLoaded: "Адрес контракта не загружен",
      minimumAmount: "Минимальная сумма 0.0001 BNB",
      maximumAmount: "Максимальная сумма 100 BNB",
      insufficientBalance: "Недостаточный баланс BNB. Нужно {amount} BNB (включая газ)",
      switchingToBSC: "🔄 Автоматическое переключение на сеть BSC для оптимального опыта...",
      switchedSuccessfully: "✅ Успешно переключен на BSC в {walletName}!",
      binanceOptimal: "🔶 Теперь вы используете Binance Wallet на BSC - оптимальная настройка!",
      switchCancelled: "⚠️ Переключение сети было отменено. Пожалуйста, переключитесь на BSC вручную для лучшего опыта.",
      switchManually: "Пожалуйста, переключитесь на сеть BSC вручную в настройках кошелька.",
      switchFailed: "⚠️ Не удалось автоматически переключиться на BSC. Пожалуйста, переключитесь вручную.",
      switchTip: "💡 Совет: Переключитесь на сеть BSC в кошельке для полного опыта CrazyFox!",
      welcome: "🦊 Добро пожаловать в CrazyFox! Подключен через {walletName}",
      perfectBSC: "🚀 Отлично! Вы уже в сети BSC!",
      wrongNetwork: "⚠️ Вы не в сети BSC. Некоторые функции могут работать неправильно.",
      binanceOptimalSetup: "🔶 Binance Wallet + BSC = Оптимальная настройка для CrazyFox! Меньше комиссий и быстрее транзакции.",
      trustWalletTips: "🛡️ Советы Trust Wallet: Минимальная цена газа 3 gwei требуется для транзакций BSC",
      trustWalletDetected: "🛡️ Обнаружен Trust Wallet - используются оптимизированные параметры BSC...",
      transactionSent: "🛡️ Транзакция Trust Wallet отправлена! Хеш: {hash}...",
      fallbackMethod: "🛡️ Используется резервный метод Trust Wallet...",
      fallbackSubmitted: "🛡️ Резервная транзакция отправлена!",
      binanceProcessing: "🔶 Обработка через Binance Wallet...",
      transactionSubmitted: "📝 Транзакция отправлена!",
      binanceSubmitted: "📝 Транзакция отправлена в Binance Wallet!",
      transactionCancelled: "🛡️ Транзакция отменена",
      insufficientBNB: "🛡️ Недостаточно BNB. Нужно 0.01+ BNB для комиссий за газ.",
      transactionConfirmed: "✅ Транзакция подтверждена! Хеш: {hash}...",
      tokensDistributed: "🎉 Токены успешно распределены!",
      backendFailed: "Обработка бекенда не удалась. TX: {hash}...",
      transactionRejected: "Транзакция была отклонена",
      transactionFailed: "Транзакция не удалась: {message}",
      receiptFailed: "Транзакция не смогла подтвердиться. Пожалуйста, проверьте ваш кошелек.",
      retryFailed: "Повторная попытка не удалась. Пожалуйста, свяжитесь с поддержкой с хешем вашей транзакции."
    },
    trustWalletErrors: {
      solutions: "🛡️ Решения Ошибок BSC Trust Wallet (Обновлено):",
      solutionsList: [
        "• Цена газа теперь требует 3+ gwei (увеличено с 1 gwei)",
        "• Попробуйте сумму ≤ 0.01 BNB сначала",
        "• Обновите Trust Wallet до последней версии",
        "• Убедитесь в наличии 0.01+ BNB для комиссий за газ",
        "• Используйте авто-настройки комиссий BSC"
      ],
      internalError: "🛡️ Внутренняя Ошибка Trust Wallet - Обновленные Решения:",
      internalSolutions: [
        "1. Обновите Trust Wallet (самое важное)",
        "2. Используйте цену газа 3+ gwei (требование BSC увеличено)",
        "3. Попробуйте меньшую сумму (0.005-0.01 BNB)",
        "4. Настройки → Дополнительно → Сбросить Аккаунт",
        "5. Переключитесь на авто-настройки комиссий за газ"
      ],
      tryAmount005: "🧪 Попробуйте 0.005 BNB",
      tryAmount01: "🔄 Попробуйте 0.01 BNB"
    }
  } as const;