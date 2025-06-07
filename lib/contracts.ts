// lib/contracts.ts
import { createThirdwebClient, getContract } from "thirdweb";
import { bsc } from "thirdweb/chains";

// ThirdWeb client
export const client = createThirdwebClient({
  clientId: "d28d89a66e8eb5e73d6a9c8eeaa0645a"
});

// ⭐ УКАЖИТЕ АДРЕС ВАШЕГО КОНТРАКТА
const PRESALE_CONTRACT_ADDRESS = "0xD80AC08a2effF26c4465aAF6ff00BE3DaecFF476";

// ABI контракта пресейла
export const PRESALE_ABI = [
  {
    "inputs": [],
    "name": "buyWithBNB",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "wethAmount",
        "type": "uint256"
      }
    ],
    "name": "buyWithWETH",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPresaleInfo",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "_totalSoldTokens",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_totalRaisedUSD",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_tokenPriceUSD",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_paymentWallet",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_tokenWallet",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_bnbPrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_ethPrice",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "bnbAmount",
        "type": "uint256"
      }
    ],
    "name": "calculateTokensForBNB",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "wethAmount",
        "type": "uint256"
      }
    ],
    "name": "calculateTokensForWETH",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCurrentPrices",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "bnbPrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "ethPrice",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_newPriceUSD",
        "type": "uint256"
      }
    ],
    "name": "setTokenPrice",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "buyer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "paymentAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "tokensReceived",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "usdValue",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "currency",
        "type": "string"
      }
    ],
    "name": "TokensPurchased",
    "type": "event"
  }
] as const;

// Создаем контракт с ABI
export const presaleContract = getContract({
  client,
  chain: bsc,
  address: PRESALE_CONTRACT_ADDRESS,
  abi: PRESALE_ABI
});