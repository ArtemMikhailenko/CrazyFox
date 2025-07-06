export const wagmiPresalePurchaseLocale = {
    header: {
      title: "🦊 CRFX PRESALE",
      subtitle: "Moon Mission Starting Soon"
    },
    countdown: {
      title: "🚀 Mission Launch In:",
      labels: {
        days: "Days",
        hours: "Hours",
        minutes: "Min",
        seconds: "Sec"
      },
      endDate: "Ends: September 18, 2025 (UTC)"
    },
    progress: {
      stage: "Stage 2/6",
      raised: "Raised",
      complete: "32.5% Complete"
    },
    price: {
      current: "Current: $0.006",
      next: "Next: $0.007"
    },
    connection: {
      connected: "Connected: {address}",
      wallet: "Wallet: {walletName}",
      balance: "Balance: {balance} BNB",
      switchToBSC: "⚠️ Switch to BSC",
      optimizedFor: "✨ Optimized for {walletName}",
      gasRequirement: "🛡️ Trust Wallet with 3+ gwei gas pricing"
    },
    transactionStatus: {
      confirmBinance: "🔶 Confirm in Binance Wallet...",
      confirmTrust: "🛡️ Confirm in Trust Wallet...",
      confirmWallet: "🔄 Waiting for wallet confirmation...",
      confirming: "⏳ Confirming transaction on BSC blockchain..."
    },
    pendingTransactions: {
      title: "⏳ Pending Transactions",
      amount: "Amount: {amount} BNB",
      hash: "Hash: {hash}...",
      status: "Status: {status}",
      wallet: "Wallet: {walletType}",
      retryButton: "Retry API Call",
      removeButton: "Remove"
    },
    connectWallet: {
      title: "Connect your wallet to participate:",
      connectButton: "🌈 Connect Wallet",
      wrongNetwork: "⚠️ Wrong network"
    },
    walletBenefits: {
      binance: {
        title: "🔶 Binance Wallet Benefits",
        benefits: [
          "⚡ Native BSC integration",
          "💰 Lower transaction fees", 
          "🚀 Faster confirmations"
        ]
      },
      trustWallet: {
        title: "🛡️ Trust Wallet Gas Requirements",
        requirements: [
          "✅ Gas Price: 3+ gwei (Updated)",
          "✅ Gas Limit: 21,000-23,000",
          "✅ Buffer: 0.01 BNB recommended"
        ]
      }
    },
    form: {
      quickAmountsLabel: "Quick amounts (BNB):",
      amountLabel: "Amount (BNB):",
      amountPlaceholder: "0.0",
      invalidAmount: "Please enter a valid amount (0.0001 - 100 BNB)",
      trustWalletGasFee: "🛡️ Trust Wallet: {fee} BNB gas fee (3 gwei)",
      youReceive: "You receive:",
      tokensAmount: "{amount} CRFX 🦊",
      rate: "Rate: {rate} CRFX per BNB"
    },
    buyButton: {
      confirmBinance: "🔶 Confirm in Binance Wallet...",
      confirmTrust: "🛡️ Confirm in Trust Wallet...",
      confirmWallet: "🔄 Confirm in Wallet...",
      confirming: "⏳ Confirming on BSC...",
      processing: "🔄 Processing...",
      switchNetwork: "⚠️ Switch to BSC Network",
      invalidAmount: "❌ Invalid Amount",
      buyWithBinance: "🔶 Buy with Binance Wallet",
      buyWithTrust: "🛡️ Buy with Trust Wallet (3+ gwei)",
      buyWithWagmi: "🚀 Buy with Wagmi"
    },
    networkHelper: {
      binance: "🔶 Binance Wallet detected! Click the button above to automatically switch to BSC network.",
      trust: "🛡️ Trust Wallet detected! Click the button above to automatically switch to BSC network with optimized gas settings."
    },
    gasInfo: {
      title: "⛽ Current Gas Settings",
      trustWallet: "🛡️ Trust Wallet: Optimized for 3-5 gwei (BSC requirement)",
      binanceWallet: "🔶 Binance Wallet: Native BSC integration with optimal gas",
      standardWallet: "⚡ Standard wallet: Auto-optimized gas for BSC"
    },
    messages: {
      connectFirst: "Please connect your wallet first! 🦊",
      contractNotLoaded: "Contract address not loaded",
      minimumAmount: "Minimum amount is 0.0001 BNB",
      maximumAmount: "Maximum amount is 100 BNB",
      insufficientBalance: "Insufficient BNB balance. Need {amount} BNB (including gas)",
      switchingToBSC: "🔄 Auto-switching to BSC network for optimal experience...",
      switchedSuccessfully: "✅ Successfully switched to BSC in {walletName}!",
      binanceOptimal: "🔶 You're now using Binance Wallet on BSC - the optimal setup!",
      switchCancelled: "⚠️ Network switch was cancelled. Please switch to BSC manually for the best experience.",
      switchManually: "Please switch to BSC network manually in your wallet settings.",
      switchFailed: "⚠️ Could not auto-switch to BSC. Please switch manually.",
      switchTip: "💡 Tip: Switch to BSC network in your wallet for the full CrazyFox experience!",
      welcome: "🦊 Welcome to CrazyFox! Connected with {walletName}",
      perfectBSC: "🚀 Perfect! You're already on BSC network!",
      wrongNetwork: "⚠️ You're not on BSC network. Some features may not work properly.",
      binanceOptimalSetup: "🔶 Binance Wallet + BSC = Optimal setup for CrazyFox! Lower fees and faster transactions.",
      trustWalletTips: "🛡️ Trust Wallet Tips: Minimum 3 gwei gas price required for BSC transactions",
      trustWalletDetected: "🛡️ Trust Wallet detected - using optimized BSC parameters...",
      transactionSent: "🛡️ Trust Wallet transaction sent! Hash: {hash}...",
      fallbackMethod: "🛡️ Using Trust Wallet fallback method...",
      fallbackSubmitted: "🛡️ Fallback transaction submitted!",
      binanceProcessing: "🔶 Processing with Binance Wallet...",
      transactionSubmitted: "📝 Transaction submitted!",
      binanceSubmitted: "📝 Transaction submitted to Binance Wallet!",
      transactionCancelled: "🛡️ Transaction cancelled",
      insufficientBNB: "🛡️ Insufficient BNB. Need 0.01+ BNB for gas fees.",
      transactionConfirmed: "✅ Transaction confirmed! Hash: {hash}...",
      tokensDistributed: "🎉 Tokens distributed successfully!",
      backendFailed: "Backend processing failed. TX: {hash}...",
      transactionRejected: "Transaction was rejected",
      transactionFailed: "Transaction failed: {message}",
      receiptFailed: "Transaction failed to confirm. Please check your wallet.",
      retryFailed: "Retry failed. Please contact support with your transaction hash."
    },
    trustWalletErrors: {
      solutions: "🛡️ Trust Wallet BSC Error Solutions (Updated):",
      solutionsList: [
        "• Gas price now requires 3+ gwei (increased from 1 gwei)",
        "• Try amount ≤ 0.01 BNB first", 
        "• Update Trust Wallet to latest version",
        "• Ensure 0.01+ BNB for gas fees",
        "• Use BSC network auto-fee settings"
      ],
      internalError: "🛡️ Trust Wallet Internal Error - Updated Solutions:",
      internalSolutions: [
        "1. Update Trust Wallet (most important)",
        "2. Use 3+ gwei gas price (BSC requirement increased)",
        "3. Try smaller amount (0.005-0.01 BNB)",
        "4. Settings → Advanced → Reset Account",
        "5. Switch to auto gas fee settings"
      ],
      tryAmount005: "🧪 Try 0.005 BNB",
      tryAmount01: "🔄 Try 0.01 BNB"
    }
  } as const;
  