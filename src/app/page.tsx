'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { motion, useScroll, useSpring } from 'framer-motion';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { ThirdwebProvider } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";

import Header from '@/components/Header/Header';
import HeroSection from '@/components/HeroSection/HeroSection';
import CrazyTokenomics from '@/components/CrazyTokenomics/CrazyTokenomics';
import CrazyAbout from '@/components/CrazyAbout/CrazyAbout';
import CrazyCommunity from '@/components/CrazyCommunity/CrazyCommunity';
import CrazyRoadmapMap from '@/components/CrazyRoadmap/CrazyRoadmap';
import TokenPriceProgression from '@/components/TokenPriceProgression/TokenPriceProgression';
import SupportButton from '@/components/SupportButton/SupportButton';
import Footer from '@/components/Footer/Footer';

import styles from './page.module.css';
import CrazyTeam from '@/components/CrazyTeam/CrazyTeam';
import CrazyPartners from '@/components/CrazyPartners/CrazyPartners';

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "d28d89a66e8eb5e73d6a9c8eeaa0645a"
});

const HomeContent = () => {
  const [activeSection, setActiveSection] = useState('hero');
  const [isLoaded, setIsLoaded] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3 }
    );

    const sections = document.querySelectorAll('section');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className={styles.container}>
      <motion.div className={styles.progressBar} style={{ scaleX }} />

      <Header 
        activeSection={activeSection}
        scrollToSection={scrollToSection}
      />

      <SupportButton />

      <HeroSection isLoaded={isLoaded} />

      <TokenPriceProgression currentStage={2} />

      <motion.section 
        id="about" 
        className={styles.about}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <CrazyAbout />
      </motion.section>

      <motion.section 
        id="tokenomics" 
        className={styles.tokenomics}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <CrazyTokenomics />
      </motion.section>
      <CrazyTeam/>
      <motion.section 
        id="roadmap" 
        className={styles.roadmap}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <CrazyRoadmapMap />
      </motion.section>
      <CrazyPartners/>
      <motion.section 
        id="community" 
        className={styles.community}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <CrazyCommunity />
      </motion.section>

      <Footer />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
};

export default function Home() {
  return (
    <>
      <Head>
        <title>CrazyFox | The Wildest Meme Coin on BSC 🦊</title>
        <meta name="description" content="Join the CrazyFox revolution! The most exciting meme coin on Binance Smart Chain with locked liquidity and moon mission." />
        <meta name="keywords" content="CrazyFox, CRFX, meme coin, BSC, cryptocurrency, DeFi, moon mission" />
        <meta property="og:title" content="CrazyFox | The Wildest Meme Coin on BSC 🦊" />
        <meta property="og:description" content="Join the CrazyFox revolution! 65% liquidity locked forever, aggressive marketing, and moon mission ready!" />
        <meta property="og:image" content="/fox-full.png" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="CrazyFox | The Wildest Meme Coin on BSC 🦊" />
        <meta name="twitter:description" content="Join the CrazyFox revolution! The most secure and exciting meme coin on BSC." />
        <meta name="twitter:image" content="/fox-full.png" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/fox.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <ThirdwebProvider>
        <HomeContent />
      </ThirdwebProvider>
    </>
  );
}