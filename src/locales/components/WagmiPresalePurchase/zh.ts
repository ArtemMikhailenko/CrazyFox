export const wagmiPresalePurchaseLocale = {
    header: {
      title: "🦊 CRFX预售",
      subtitle: "登月任务即将开始"
    },
    countdown: {
      title: "🚀 任务启动倒计时:",
      labels: {
        days: "天",
        hours: "小时", 
        minutes: "分钟",
        seconds: "秒"
      },
      endDate: "结束时间：2025年9月18日（UTC）"
    },
    progress: {
      stage: "阶段 2/6",
      raised: "已筹集",
      complete: "完成32.5%"
    },
    price: {
      current: "当前：$0.006",
      next: "下一个：$0.007"
    },
    connection: {
      connected: "已连接：{address}",
      wallet: "钱包：{walletName}",
      balance: "余额：{balance} BNB",
      switchToBSC: "⚠️ 切换到BSC",
      optimizedFor: "✨ 为{walletName}优化",
      gasRequirement: "🛡️ Trust Wallet，3+ gwei燃气定价"
    },
    transactionStatus: {
      confirmBinance: "🔶 在Binance Wallet中确认...",
      confirmTrust: "🛡️ 在Trust Wallet中确认...",
      confirmWallet: "🔄 等待钱包确认...",
      confirming: "⏳ 在BSC区块链上确认交易..."
    },
    pendingTransactions: {
      title: "⏳ 待处理交易",
      amount: "金额：{amount} BNB",
      hash: "哈希：{hash}...",
      status: "状态：{status}",
      wallet: "钱包：{walletType}",
      retryButton: "重试API调用",
      removeButton: "移除"
    },
    connectWallet: {
      title: "连接您的钱包以参与：",
      connectButton: "🌈 连接钱包",
      wrongNetwork: "⚠️ 错误网络"
    },
    walletBenefits: {
      binance: {
        title: "🔶 Binance Wallet优势",
        benefits: [
          "⚡ 原生BSC集成",
          "💰 更低的交易费用",
          "🚀 更快的确认"
        ]
      },
      trustWallet: {
        title: "🛡️ Trust Wallet燃气要求",
        requirements: [
          "✅ 燃气价格：3+ gwei（已更新）",
          "✅ 燃气限制：21,000-23,000",
          "✅ 缓冲：推荐0.01 BNB"
        ]
      }
    },
    form: {
      quickAmountsLabel: "快速金额（BNB）：",
      amountLabel: "金额（BNB）：",
      amountPlaceholder: "0.0",
      invalidAmount: "请输入有效金额（0.0001 - 100 BNB）",
      trustWalletGasFee: "🛡️ Trust Wallet：{fee} BNB燃气费（3 gwei）",
      youReceive: "您将收到：",
      tokensAmount: "{amount} CRFX 🦊",
      rate: "汇率：{rate} CRFX 每 BNB"
    },
    buyButton: {
      confirmBinance: "🔶 在Binance Wallet中确认...",
      confirmTrust: "🛡️ 在Trust Wallet中确认...",
      confirmWallet: "🔄 在钱包中确认...",
      confirming: "⏳ 在BSC上确认...",
      processing: "🔄 处理中...",
      switchNetwork: "⚠️ 切换到BSC网络",
      invalidAmount: "❌ 无效金额",
      buyWithBinance: "🔶 使用Binance Wallet购买",
      buyWithTrust: "🛡️ 使用Trust Wallet购买（3+ gwei）",
      buyWithWagmi: "🚀 使用Wagmi购买"
    },
    networkHelper: {
      binance: "🔶 检测到Binance Wallet！点击上面的按钮自动切换到BSC网络。",
      trust: "🛡️ 检测到Trust Wallet！点击上面的按钮自动切换到BSC网络并使用优化的燃气设置。"
    },
    gasInfo: {
      title: "⛽ 当前燃气设置",
      trustWallet: "🛡️ Trust Wallet：为3-5 gwei优化（BSC要求）",
      binanceWallet: "🔶 Binance Wallet：原生BSC集成，最优燃气",
      standardWallet: "⚡ 标准钱包：为BSC自动优化燃气"
    },
    messages: {
      connectFirst: "请先连接您的钱包！🦊",
      contractNotLoaded: "合约地址未加载",
      minimumAmount: "最小金额为0.0001 BNB",
      maximumAmount: "最大金额为100 BNB",
      insufficientBalance: "BNB余额不足。需要{amount} BNB（包括燃气费）",
      switchingToBSC: "🔄 自动切换到BSC网络以获得最佳体验...",
      switchedSuccessfully: "✅ 在{walletName}中成功切换到BSC！",
      binanceOptimal: "🔶 您现在在BSC上使用Binance Wallet - 最佳设置！",
      switchCancelled: "⚠️ 网络切换被取消。请手动切换到BSC以获得最佳体验。",
      switchManually: "请在钱包设置中手动切换到BSC网络。",
      switchFailed: "⚠️ 无法自动切换到BSC。请手动切换。",
      switchTip: "💡 提示：在钱包中切换到BSC网络以获得完整的CrazyFox体验！",
      welcome: "🦊 欢迎来到CrazyFox！已通过{walletName}连接",
      perfectBSC: "🚀 完美！您已经在BSC网络上了！",
      wrongNetwork: "⚠️ 您不在BSC网络上。某些功能可能无法正常工作。",
      binanceOptimalSetup: "🔶 Binance Wallet + BSC = CrazyFox的最佳设置！更低费用和更快交易。",
      trustWalletTips: "🛡️ Trust Wallet提示：BSC交易需要最低3 gwei燃气价格",
      trustWalletDetected: "🛡️ 检测到Trust Wallet - 使用优化的BSC参数...",
      transactionSent: "🛡️ Trust Wallet交易已发送！哈希：{hash}...",
      fallbackMethod: "🛡️ 使用Trust Wallet备用方法...",
      fallbackSubmitted: "🛡️ 备用交易已提交！",
      binanceProcessing: "🔶 通过Binance Wallet处理...",
      transactionSubmitted: "📝 交易已提交！",
      binanceSubmitted: "📝 交易已提交到Binance Wallet！",
      transactionCancelled: "🛡️ 交易已取消",
      insufficientBNB: "🛡️ BNB不足。需要0.01+ BNB用于燃气费。",
      transactionConfirmed: "✅ 交易已确认！哈希：{hash}...",
      tokensDistributed: "🎉 代币分发成功！",
      backendFailed: "后端处理失败。TX：{hash}...",
      transactionRejected: "交易被拒绝",
      transactionFailed: "交易失败：{message}",
      receiptFailed: "交易确认失败。请检查您的钱包。",
      retryFailed: "重试失败。请联系客服并提供您的交易哈希。"
    },
    trustWalletErrors: {
      solutions: "🛡️ Trust Wallet BSC错误解决方案（已更新）：",
      solutionsList: [
        "• 燃气价格现在需要3+ gwei（从1 gwei增加）",
        "• 首先尝试金额≤0.01 BNB",
        "• 将Trust Wallet更新到最新版本",
        "• 确保有0.01+ BNB用于燃气费",
        "• 使用BSC网络自动费用设置"
      ],
      internalError: "🛡️ Trust Wallet内部错误 - 更新解决方案：",
      internalSolutions: [
        "1. 更新Trust Wallet（最重要）",
        "2. 使用3+ gwei燃气价格（BSC要求已增加）",
        "3. 尝试较小金额（0.005-0.01 BNB）",
        "4. 设置→高级→重置账户",
        "5. 切换到自动燃气费设置"
      ],
      tryAmount005: "🧪 尝试0.005 BNB",
      tryAmount01: "🔄 尝试0.01 BNB"
    }
  } as const;