// utils/hooks.ts
import { useState, useEffect, useRef, useCallback } from 'react';

// Advanced Mouse Tracking Hook
export const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, []);

  return mousePosition;
};

// Advanced Intersection Observer Hook
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      { threshold: 0.1, ...options }
    );

    observer.observe(element);
    return () => observer.unobserve(element);
  }, [hasIntersected, options]);

  return { elementRef, isIntersecting, hasIntersected };
};

// Parallax Scroll Hook
export const useParallax = (speed: number = 0.5) => {
  const [scrollY, setScrollY] = useState(0);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY * speed);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return { elementRef, scrollY };
};

// Audio Hook for Music Player
export const useAudio = (url: string) => {
  const [audio] = useState(new Audio(url));
  const [playing, setPlaying] = useState(false);

  const toggle = () => setPlaying(!playing);

  useEffect(() => {
    playing ? audio.play() : audio.pause();
  }, [playing, audio]);

  useEffect(() => {
    audio.addEventListener('ended', () => setPlaying(false));
    return () => {
      audio.removeEventListener('ended', () => setPlaying(false));
    };
  }, [audio]);

  return [playing, toggle] as const;
};

// Device Detection Hook
export const useDeviceDetect = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsDesktop(width >= 1024);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { isMobile, isTablet, isDesktop };
};

// Battery Status Hook
export const useBattery = () => {
  const [battery, setBattery] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;

    // @ts-ignore
    if ('getBattery' in navigator) {
      // @ts-ignore
      navigator.getBattery().then((battery: any) => {
        if (isMounted) {
          setBattery(battery);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, []);

  return battery;
};

// Network Status Hook
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState('unknown');

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    const updateConnectionType = () => {
      // @ts-ignore
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        setConnectionType(connection.effectiveType || 'unknown');
      }
    };

    updateOnlineStatus();
    updateConnectionType();

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  return { isOnline, connectionType };
};

// Geolocation Hook
export const useGeolocation = () => {
  const [location, setLocation] = useState<{
    latitude: number | null;
    longitude: number | null;
    error: string | null;
  }>({
    latitude: null,
    longitude: null,
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        error: 'Geolocation is not supported by this browser.',
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
        });
      },
      (error) => {
        setLocation(prev => ({
          ...prev,
          error: error.message,
        }));
      }
    );
  }, []);

  return location;
};

// Performance Monitor Hook
export const usePerformance = () => {
  const [performance, setPerformance] = useState({
    fps: 0,
    memory: 0,
    timing: 0,
  });

  useEffect(() => {
    let frameCount = 0;
    let lastTime = Date.now();

    const measureFPS = () => {
      frameCount++;
      const currentTime = Date.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        setPerformance(prev => ({
          ...prev,
          fps,
          // @ts-ignore
          memory: (performance.memory?.usedJSHeapSize / 1048576) || 0,
          timing: window.performance.now(),
        }));

        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(measureFPS);
    };

    measureFPS();
  }, []);

  return performance;
};

// Color Theme Hook
export const useColorTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateTheme = () => {
      if (theme === 'auto') {
        setIsDark(mediaQuery.matches);
      } else {
        setIsDark(theme === 'dark');
      }
    };

    updateTheme();
    mediaQuery.addEventListener('change', updateTheme);
    
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [theme]);

  return { theme, setTheme, isDark };
};

// utils/animations.ts
export const animationVariants = {
  // Page transitions
  pageTransition: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },

  // Stagger animations
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  },

  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  },

  // Hover animations
  hoverScale: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
  },

  // Floating animation
  floating: {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  },

  // Pulse animation
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  },

  // Slide animations
  slideInLeft: {
    initial: { x: -100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    transition: { duration: 0.8, ease: "easeOut" },
  },

  slideInRight: {
    initial: { x: 100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    transition: { duration: 0.8, ease: "easeOut" },
  },

  slideInUp: {
    initial: { y: 100, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.8, ease: "easeOut" },
  },

  slideInDown: {
    initial: { y: -100, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.8, ease: "easeOut" },
  },

  // Rotation animations
  rotate360: {
    animate: {
      rotate: 360,
      transition: {
        duration: 20,
        repeat: Infinity,
        ease: "linear",
      },
    },
  },

  // Text animations
  typewriter: {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  },

  typewriterChar: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  },
};

// utils/constants.ts
export const SOCIAL_LINKS = {
  telegram: 'https://t.me/crazyfoxcoin',
  twitter: 'https://twitter.com/crazyfoxcoin',
  discord: 'https://discord.gg/crazyfox',
  youtube: 'https://youtube.com/@crazyfox',
  reddit: 'https://reddit.com/r/crazyfox',
  instagram: 'https://instagram.com/crazyfoxcoin',
};

export const TOKENOMICS_DATA = [
  { name: 'Liquidity Pool', value: 40, color: '#FF6B35' },
  { name: 'Marketing', value: 25, color: '#4ECDC4' },
  { name: 'Development', value: 20, color: '#45B7D1' },
  { name: 'Team', value: 10, color: '#96CEB4' },
  { name: 'Airdrops', value: 5, color: '#FECA57' },
];

export const ROADMAP_PHASES = [
  {
    phase: 'Phase 1',
    title: 'Launch & Community Building',
    status: 'completed',
    items: [
      { task: 'Token Launch', status: 'completed' },
      { task: 'Website & Social Media', status: 'completed' },
      { task: 'Initial Marketing Campaign', status: 'completed' },
      { task: 'CoinGecko & CoinMarketCap Listing', status: 'in-progress' },
    ],
  },
  {
    phase: 'Phase 2',
    title: 'Exchange Listings & Partnerships',
    status: 'in-progress',
    items: [
      { task: 'CEX Listings', status: 'in-progress' },
      { task: 'Influencer Partnerships', status: 'planned' },
      { task: 'Strategic Collaborations', status: 'planned' },
      { task: 'Community Contests', status: 'planned' },
    ],
  },
  {
    phase: 'Phase 3',
    title: 'Utility & Innovation',
    status: 'planned',
    items: [
      { task: 'CrazyFox NFT Collection', status: 'planned' },
      { task: 'P2E Game Development', status: 'planned' },
      { task: 'Staking Platform', status: 'planned' },
      { task: 'Mobile App', status: 'planned' },
    ],
  },
  {
    phase: 'Phase 4',
    title: 'Ecosystem Expansion',
    status: 'planned',
    items: [
      { task: 'Multi-chain Bridge', status: 'planned' },
      { task: 'DeFi Integration', status: 'planned' },
      { task: 'Metaverse Presence', status: 'planned' },
      { task: 'Global Domination', status: 'planned' },
    ],
  },
];

export const FEATURES_DATA = [
  {
    icon: '🔥',
    title: 'Community Driven',
    description: 'Built by the community, for the community. Every decision is made together!',
    color: '#FF6B35',
  },
  {
    icon: '💎',
    title: 'Diamond Hands',
    description: 'Strong tokenomics designed to reward long-term holders and punish paper hands.',
    color: '#4ECDC4',
  },
  {
    icon: '🚀',
    title: 'To The Moon',
    description: 'Aggressive marketing campaigns and partnerships to ensure maximum visibility.',
    color: '#45B7D1',
  },
  {
    icon: '🦊',
    title: 'Crazy Utility',
    description: 'NFTs, games, and DeFi integration coming soon to add real utility to $CFOX.',
    color: '#96CEB4',
  },
];

// utils/helpers.ts
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy: ', err);
    return false;
  }
};

export const generateParticles = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 1,
    speedX: (Math.random() - 0.5) * 2,
    speedY: (Math.random() - 0.5) * 2,
    color: ['#FF6B35', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'][
      Math.floor(Math.random() * 5)
    ],
  }));
};

export const triggerConfetti = () => {
  // Dynamic import to avoid SSR issues
  import('canvas-confetti').then((confetti) => {
    confetti.default({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF6B35', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'],
    });
  });
};

export const playSound = (frequency: number = 800, duration: number = 200) => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration / 1000);
};

export const detectWebGLSupport = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && 
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
};

export const getRandomFloat = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

export const lerp = (start: number, end: number, factor: number): number => {
  return start + (end - start) * factor;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};