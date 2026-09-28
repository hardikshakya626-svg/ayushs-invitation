/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  Clock,
  ChevronDown,
  Copy,
  Check,
  Navigation,
  RotateCcw,
  Smartphone,
  Maximize2,
  Wifi,
  QrCode as QrIcon,
  Play,
  Pause
} from 'lucide-react';
import QRCode from 'qrcode';
import { FloralDivider, CornerFloral } from './components/FloralMotifs';
import { EnvelopeCanvas, EnvelopeCanvasRef } from './components/EnvelopeCanvas';

export default function App() {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [introState, setIntroState] = useState<'ready' | 'opening' | 'revealed'>('ready');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isPhoneFrame, setIsPhoneFrame] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 520;
    }
    return true;
  });

  const envelopeRef = useRef<EnvelopeCanvasRef | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [watermarkPos, setWatermarkPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.7;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    // Safari iOS unlocking listener: first interaction primes and plays audio
    const unlockAudio = () => {
      if (audio.paused && introState !== 'ready') {
        audio.volume = 0.7;
        audio.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    };
    window.addEventListener('touchstart', unlockAudio, { passive: true, once: true });
    window.addEventListener('click', unlockAudio, { passive: true, once: true });

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('click', unlockAudio);
    };
  }, [introState]);

  const toggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.volume = 0.7;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(console.warn);
    }
  };

  const phoneNetworkUrl = 'https://ccd-situated-liked-brook.trycloudflare.com';

  useEffect(() => {
    QRCode.toDataURL(phoneNetworkUrl, {
      margin: 1,
      width: 180,
      color: {
        dark: '#3A141E',
        light: '#FFFFFF'
      }
    })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error('Failed to generate QR code', err));
  }, []);

  const safeCopy = (text: string, onSuccess: () => void) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(text).then(onSuccess).catch(() => {
          fallbackCopy(text, onSuccess);
        });
      } else {
        fallbackCopy(text, onSuccess);
      }
    } catch {
      fallbackCopy(text, onSuccess);
    }
  };

  const fallbackCopy = (text: string, onSuccess: () => void) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.top = '0';
      textarea.style.left = '0';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      onSuccess();
    } catch {
      onSuccess();
    }
  };

  const copyAddress = () => {
    safeCopy("The Mewar Palace and Resort, Shivpuri, Madhya Pradesh 473551", () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const copyPhoneLink = () => {
    safeCopy(phoneNetworkUrl, () => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    });
  };

  const handleTapToOpen = (e?: React.SyntheticEvent) => {
    // Synchronously start audio on direct user gesture to satisfy Safari's security rules
    if (audioRef.current) {
      audioRef.current.volume = 0.7;
      audioRef.current.currentTime = 0;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('Audio play on tap error:', err);
          });
      }
    }

    if (introState === 'ready') {
      setIntroState('opening');
      envelopeRef.current?.startOpening();
    }
  };

  const handleReplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
    setIntroState('ready');
    envelopeRef.current?.replay();
    if (isPhoneFrame && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleTransitionReady = () => {
    setIntroState('revealed');
  };

  // Auto-detect viewport on resize: mobile screens <= 520px render natively full-screen
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 520) {
        setIsPhoneFrame(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lock scroll while intro is active; unlock once revealed
  useEffect(() => {
    if (!isPhoneFrame) {
      if (introState !== 'revealed') {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'auto';
      }
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [introState, isPhoneFrame]);

  // Main Wedding Content inside the phone or full screen
  const renderInvitationContent = () => (
    <div
      className={`relative z-10 w-full flex flex-col transition-all duration-1000 ${
        introState === 'revealed'
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-8 pointer-events-none'
      }`}
    >
      {/* ========================================================================= */}
      {/* 1. HERO SECTION (White & Champagne Radiant Text for Video Background) */}
      {/* ========================================================================= */}
      <section
        id="hero"
        className="relative w-full min-h-[92vh] py-10 sm:py-16 px-4 sm:px-6 flex flex-col items-center justify-center text-center overflow-hidden bg-transparent"
      >
        <div className="w-full max-w-xl mx-auto relative bg-transparent border-none shadow-none pt-2 pb-6 px-4 flex flex-col items-center justify-center">
          {/* Floral line-art illustration ABOVE names with Sanskrit inscription */}
          <div className="mb-2 relative z-10 flex flex-col items-center">
            <span className="font-cinzel text-[11px] sm:text-xs uppercase tracking-[0.35em] text-[#FDF3E3] font-semibold block mb-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
              ॥ श्री गणेशाय नमः ॥
            </span>
            <FloralDivider className="w-56 sm:w-72 h-7 text-[#FCECD7] drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" />
          </div>

          <p className="font-cinzel text-xs sm:text-sm uppercase tracking-[0.35em] text-white/95 font-semibold mb-1 relative z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
            Wedding Celebration
          </p>

          {/* Couple Names - Radiant Crisp White Calligraphy */}
          <div className="my-1 space-y-1 relative z-10 w-full">
            <h1 className="text-6xl sm:text-8xl md:text-9xl font-normal text-white font-script tracking-wide leading-none drop-shadow-[0_4px_18px_rgba(20,10,15,0.7)]">
              Ayush
            </h1>

            <div className="flex items-center justify-center gap-4 my-1">
              <div className="h-[1px] w-16 sm:w-24 bg-gradient-to-r from-transparent via-[#FCECD7] to-transparent drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]" />
              <span className="font-cinzel text-base sm:text-xl text-[#FCECD7] italic font-serif drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                &amp;
              </span>
              <div className="h-[1px] w-16 sm:w-24 bg-gradient-to-l from-transparent via-[#FCECD7] to-transparent drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]" />
            </div>

            <h1 className="text-6xl sm:text-8xl md:text-9xl font-normal text-white font-script tracking-wide leading-none drop-shadow-[0_4px_18px_rgba(20,10,15,0.7)]">
              Somya
            </h1>
          </div>

          <div className="my-2 relative z-10">
            <FloralDivider className="w-56 sm:w-72 h-7 text-[#FCECD7] rotate-180 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" />
          </div>

          <div className="mt-1 space-y-1 relative z-10">
            <p className="font-cinzel text-sm sm:text-base tracking-[0.25em] text-white uppercase font-semibold drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)]">
              24th &amp; 25th October 2026
            </p>
            <p className="text-sm sm:text-base text-[#FDF3E3] italic drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)]">
              The Mewar Palace and Resort, Shivpuri (M.P.)
            </p>
          </div>
        </div>

        {/* Scroll Down Indicator */}
        <a
          href="#family-invite"
          className="mt-6 sm:mt-8 inline-flex flex-col items-center gap-1.5 text-xs font-sans-clean tracking-[0.25em] uppercase text-white/90 hover:text-white transition-colors group cursor-pointer drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
        >
          <span>Scroll to Explore</span>
          <ChevronDown className="w-4 h-4 text-[#FCECD7] group-hover:translate-y-1 transition-transform animate-bounce drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]" />
        </a>
      </section>

      {/* ========================================================================= */}
      {/* 2. FAMILY INVITE TEXT SECTION (Parchment Card with Royal Wine Accents) */}
      {/* ========================================================================= */}
      <section
        id="family-invite"
        className="w-full py-16 sm:py-24 px-4 bg-[#FAF7F2]/92 backdrop-blur-md border-y border-[#C5A580]/30 shadow-sm"
      >
        <div className="max-w-xl mx-auto">
          <div className="relative bg-white/95 border border-[#C5A580]/40 rounded-3xl p-6 sm:p-10 text-center shadow-lg">
            <CornerFloral position="top-left" className="absolute top-2 left-2 w-12 sm:w-16 h-12 sm:h-16 text-[#C5A580]" />
            <CornerFloral position="top-right" className="absolute top-2 right-2 w-12 sm:w-16 h-12 sm:h-16 text-[#C5A580]" />
            <CornerFloral position="bottom-left" className="absolute bottom-2 left-2 w-12 sm:w-16 h-12 sm:h-16 text-[#C5A580]" />
            <CornerFloral position="bottom-right" className="absolute bottom-2 right-2 w-12 sm:w-16 h-12 sm:h-16 text-[#C5A580]" />

            <div className="relative z-10 space-y-5 my-2">
              <div className="inline-flex items-center justify-center gap-2">
                <div className="w-8 h-[1px] bg-[#C5A580]/50" />
                <span className="font-cinzel text-xs uppercase tracking-[0.3em] text-[#C5A580] font-semibold">
                  With The Blessings of Elders
                </span>
                <div className="w-8 h-[1px] bg-[#C5A580]/50" />
              </div>

              <div className="space-y-3.5 text-base sm:text-lg font-normal leading-relaxed text-[#4A1E27]">
                <p className="font-serif italic text-2xl sm:text-3xl text-[#5A2430] font-semibold">
                  Ayush
                </p>
                <p className="text-sm sm:text-base text-[#4A1E27]/85">
                  Son of <strong className="text-[#4A1E27] font-semibold">Mrs. Sushma &amp; Mr. Jaipal Kathuria</strong>
                </p>
                <p className="text-xs sm:text-sm text-[#4A1E27]/75">
                  Grandson of <strong className="text-[#4A1E27] font-semibold">Late Smt. Sheelavanti &amp; Late Shri Sundar Lal Kathuria</strong>
                </p>

                <div className="py-2 flex items-center justify-center gap-3">
                  <div className="h-[1px] w-14 bg-[#C5A580]/35" />
                  <span className="font-script text-3xl sm:text-4xl text-[#5A2430]">weds</span>
                  <div className="h-[1px] w-14 bg-[#C5A580]/35" />
                </div>

                <p className="font-serif italic text-2xl sm:text-3xl text-[#5A2430] font-semibold">
                  Somya
                </p>
                <p className="text-sm sm:text-base text-[#4A1E27]/85">
                  Daughter of <strong className="text-[#4A1E27] font-semibold">Mrs. Uma Paliwal &amp; Late Shri Pawan Kumar Sharma</strong>
                </p>
              </div>

              <div className="pt-5 border-t border-[#C5A580]/20 max-w-lg mx-auto">
                <p className="text-xs sm:text-sm text-[#5A2430]/80 italic leading-relaxed">
                  &ldquo;We cordially invite you and your family to grace the auspicious occasion with your presence and shower your warm blessings upon the couple as they begin their beautiful journey together.&rdquo;
                </p>
                <p className="font-cinzel text-xs uppercase tracking-[0.2em] text-[#C5A580] font-bold mt-3">
                  — Kathuria &amp; Sharma Families
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. EVENT TIMELINE SECTION (Transparent Section with Website-Matching Parchment Cards) */}
      {/* ========================================================================= */}
      <section
        id="events"
        className="relative w-full py-16 sm:py-24 px-4 bg-transparent overflow-hidden"
      >
        <div className="max-w-xl mx-auto relative z-10">
          <div className="text-center space-y-2 mb-10">
            <span className="font-cinzel text-xs uppercase tracking-[0.35em] text-[#FCECD7] font-semibold drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
              Program &amp; Celebrations
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif-title font-medium text-white drop-shadow-[0_4px_16px_rgba(20,10,15,0.85)]">
              Wedding Itinerary
            </h2>
            <FloralDivider className="w-48 h-8 text-[#FCECD7] mx-auto mt-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]" />
          </div>

          <div className="space-y-6">
            {/* 1. Sangeet & Ring Ceremony (Royal Wine & Antique Gold on Luxury Parchment) */}
            <div className="bg-white/95 backdrop-blur-md border border-[#C5A580]/50 rounded-3xl p-6 sm:p-7 shadow-[0_15px_35px_rgba(0,0,0,0.25)] transition-all hover:shadow-[0_20px_45px_rgba(0,0,0,0.3)]">
              <div className="space-y-3.5">
                <span className="text-[11px] font-cinzel font-semibold uppercase tracking-wider px-3.5 py-1 rounded-full bg-[#5A2430] text-[#FCECD7] border border-[#C5A580]/40 shadow-sm inline-block">
                  Day 1 • Evening
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif-title font-bold text-[#5A2430]">
                  Sangeet &amp; Ring Ceremony
                </h3>
                <div className="space-y-2.5 text-xs sm:text-sm text-[#4A1E27] pt-3.5 border-t border-[#C5A580]/30">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-[#C5A580] shrink-0" />
                    <span className="font-bold text-[#4A1E27]">24th October 2026, Saturday</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-[#C5A580] shrink-0" />
                    <span className="font-semibold text-[#5A2430]">7:00 PM Onwards</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#C5A580] shrink-0 mt-0.5" />
                    <span className="font-medium text-[#4A1E27]/85">The Mewar Palace and Resort, Shivpuri MP</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Haldi Function (Antique Gold & Royal Wine on Luxury Parchment) */}
            <div className="bg-white/95 backdrop-blur-md border border-[#C5A580]/50 rounded-3xl p-6 sm:p-7 shadow-[0_15px_35px_rgba(0,0,0,0.25)] transition-all hover:shadow-[0_20px_45px_rgba(0,0,0,0.3)]">
              <div className="space-y-3.5">
                <span className="text-[11px] font-cinzel font-bold uppercase tracking-wider px-3.5 py-1 rounded-full bg-[#C5A580] text-[#3B0E16] border border-[#D4AF37]/50 shadow-sm inline-block">
                  Day 2 • Morning
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif-title font-bold text-[#5A2430]">
                  Haldi Function
                </h3>
                <div className="space-y-2.5 text-xs sm:text-sm text-[#4A1E27] pt-3.5 border-t border-[#C5A580]/30">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-[#C5A580] shrink-0" />
                    <span className="font-bold text-[#4A1E27]">25th October 2026, Sunday</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-[#C5A580] shrink-0" />
                    <span className="font-semibold text-[#5A2430]">11:00 AM Onwards</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#C5A580] shrink-0 mt-0.5" />
                    <span className="font-medium text-[#4A1E27]/85">The Mewar Palace and Resort Lawn</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Wedding Ceremony (Imperial Royal Wine & Gold on Luxury Parchment) */}
            <div className="bg-white/95 backdrop-blur-md border border-[#C5A580]/60 rounded-3xl p-6 sm:p-7 shadow-[0_15px_35px_rgba(0,0,0,0.25)] transition-all hover:shadow-[0_20px_45px_rgba(0,0,0,0.3)]">
              <div className="space-y-3.5">
                <span className="text-[11px] font-cinzel font-semibold uppercase tracking-wider px-3.5 py-1 rounded-full bg-[#5A2430] text-[#FCECD7] border border-[#C5A580]/40 shadow-sm inline-block">
                  Day 2 • Evening
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif-title font-bold text-[#5A2430]">
                  Wedding Ceremony
                </h3>
                <div className="space-y-3 text-xs sm:text-sm text-[#4A1E27] pt-3.5 border-t border-[#C5A580]/30">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-[#C5A580] shrink-0" />
                    <span className="font-bold text-[#5A2430]">25th October 2026, Sunday</span>
                  </div>
                  
                  {/* Detailed Auspicious Timings Card */}
                  <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#C5A580]/35 shadow-inner space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#5A2430]">Sehrabandi:</span>
                      <span className="font-mono font-bold text-[#5A2430] bg-white px-2.5 py-0.5 rounded-md border border-[#C5A580]/30 shadow-sm">
                        6:00 PM
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#5A2430]">Baraat:</span>
                      <span className="font-mono font-bold text-[#5A2430] bg-white px-2.5 py-0.5 rounded-md border border-[#C5A580]/30 shadow-sm">
                        7:30 PM
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#5A2430]">Jaimala:</span>
                      <span className="font-mono font-bold text-[#5A2430] bg-white px-2.5 py-0.5 rounded-md border border-[#C5A580]/30 shadow-sm">
                        10:00 PM
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#C5A580] shrink-0 mt-0.5" />
                    <span className="font-medium text-[#4A1E27]/85">The Mewar Palace and Resort, Shivpuri MP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. VENUE SECTION (Parchment Card with Interactive Google Map) */}
      {/* ========================================================================= */}
      <section
        id="venue"
        className="w-full py-16 sm:py-24 px-4 bg-[#FAF7F2]/95 backdrop-blur-md border-t border-[#C5A580]/30 shadow-sm"
      >
        <div className="max-w-xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="font-cinzel text-xs uppercase tracking-[0.3em] text-[#C5A580] font-semibold">
              Venue &amp; Location
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif-title font-normal text-[#5A2430]">
              The Mewar Palace and Resort
            </h2>
            <p className="text-sm sm:text-base text-[#5A2430]/75 font-medium">
              Shivpuri, Madhya Pradesh
            </p>
            <FloralDivider className="w-48 h-8 text-[#C5A580] mx-auto mt-2" />
          </div>

          <div className="bg-white border border-[#C5A580]/35 rounded-3xl overflow-hidden shadow-lg">
            <div className="relative w-full py-8 px-6 bg-gradient-to-b from-[#F9F4EE] to-[#F1E8DC] flex flex-col items-center justify-center text-center border-b border-[#C5A580]/20">
              <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center border border-[#C5A580] bg-white text-[#5A2430] shadow-sm mb-3">
                <MapPin className="w-6 h-6" />
              </div>
              <h4 className="font-serif-title text-xl font-semibold text-[#5A2430]">
                Royal Palace Lawns &amp; Grand Banquet
              </h4>
              <p className="text-xs sm:text-sm text-[#4A1E27]/75 font-sans-clean mt-1">
                The Mewar Palace and Resort, Shivpuri (M.P.)
              </p>
            </div>

            <div className="p-6 bg-white flex flex-col items-center justify-between gap-4">
              <div className="space-y-1 text-center">
                <p className="font-cinzel text-xs uppercase tracking-wider text-[#C5A580] font-bold">
                  Official Venue Address
                </p>
                <p className="text-sm font-medium text-[#4A1E27]">
                  The Mewar Palace and Resort, Shivpuri, Madhya Pradesh 473551
                </p>
              </div>

              <div className="flex items-center gap-2.5 w-full">
                <button
                  type="button"
                  onClick={copyAddress}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#C5A580]/40 hover:bg-[#FAF6F2] text-xs font-sans-clean font-semibold text-[#5A2430] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? "Address Copied!" : "Copy Address"}</span>
                </button>

                <a
                  href="https://www.google.com/maps/search/?api=1&query=The+Mewar+Palace+and+Resort+Shivpuri+MP"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#5A2430] hover:bg-[#4A1E27] text-white text-xs font-sans-clean font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Get Directions</span>
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="font-cinzel text-xs uppercase tracking-wider text-[#5A2430] font-semibold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C5A580]" /> Location Map
              </span>
              <a
                href="https://www.google.com/maps/search/?api=1&query=The+Mewar+Palace+and+Resort+Shivpuri+MP"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#5A2430] hover:underline font-sans-clean font-medium"
              >
                Open in Google Maps ↗
              </a>
            </div>

            <div className="w-full h-72 rounded-3xl overflow-hidden border border-[#C5A580]/35 shadow-md bg-white relative">
              <iframe
                title="The Mewar Palace and Resort Shivpuri Location Map"
                src="https://maps.google.com/maps?q=The%20Mewar%20Palace%20and%20Resort%2C%20Shivpuri%2C%20Madhya%20Pradesh&t=&z=14&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. FOOTER */}
      {/* ========================================================================= */}
      <footer className="w-full py-12 px-4 border-t border-[#C5A580]/30 bg-[#FAF7F2]/95 backdrop-blur-md text-center space-y-3">
        <FloralDivider className="w-48 h-8 text-[#C5A580] mx-auto" />
        <h3 className="font-script text-5xl text-[#5A2430]">
          Ayush &amp; Somya
        </h3>
        <p className="font-cinzel text-xs uppercase tracking-[0.25em] text-[#5A2430] font-semibold">
          24th &amp; 25th October 2026 • The Mewar Palace and Resort, Shivpuri
        </p>
        <p className="text-xs text-[#4A1E27]/60 font-sans-clean pt-1">
          Kathuria &amp; Sharma Families
        </p>
      </footer>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-[#080309] text-[#4A1E27] font-body-serif flex flex-col items-center justify-center antialiased selection:bg-[#E8BAC0]/30 selection:text-[#4A1E27] relative overflow-x-hidden">

      {/* Desktop Mode Switcher Bar */}
      {typeof window !== 'undefined' && window.innerWidth > 520 && (
        <header className="fixed top-3 z-50 flex flex-wrap items-center justify-center gap-2.5 bg-black/70 backdrop-blur-xl border border-white/20 py-1.5 px-4 rounded-full shadow-2xl transition-all">
          <button
            type="button"
            onClick={() => setIsPhoneFrame(true)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-cinzel tracking-wider uppercase transition-all cursor-pointer ${
              isPhoneFrame
                ? 'bg-[#d4af37] text-[#3b0e16] font-bold shadow-md'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Phone View</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPhoneFrame(false)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-cinzel tracking-wider uppercase transition-all cursor-pointer ${
              !isPhoneFrame
                ? 'bg-[#d4af37] text-[#3b0e16] font-bold shadow-md'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Full Screen</span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-white/80 pl-2.5 border-l border-white/20 font-sans-clean">
            <Wifi className="w-3 h-3 text-[#d4af37]" />
            <span>Wi-Fi:</span>
            <span className="font-mono text-[#d4af37]">{phoneNetworkUrl}</span>
          </div>
        </header>
      )}

      {/* Main Viewport: Either inside Phone Simulator Frame or Full Screen */}
      {isPhoneFrame ? (
        <main className="py-14 sm:py-16 flex items-center justify-center gap-8 w-full min-h-screen px-4">
          {/* Realistic iPhone Titanium Mockup Frame */}
          <div
            style={{
              height: 'min(844px, 86vh)',
              width: 'calc(min(844px, 86vh) * (390 / 844))'
            }}
            className="relative rounded-[50px] bg-black border-[11px] border-[#221c27] shadow-[0_25px_80px_rgba(0,0,0,0.9),0_0_0_2px_rgba(212,175,55,0.35),0_0_40px_rgba(212,175,55,0.15)] flex flex-col overflow-hidden shrink-0"
          >
            {/* Dynamic Island Notch */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-50 flex items-center justify-end px-2.5 pointer-events-none shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-[#15121b] border border-[#2a2435]" />
            </div>

            {/* Pinned Background Video Canvas inside phone frame */}
            <div className="absolute inset-0 w-full h-full rounded-[38px] overflow-hidden pointer-events-none z-0">
              <EnvelopeCanvas ref={envelopeRef} onOpened={handleTransitionReady} onWatermarkPos={setWatermarkPos} />
            </div>

            {/* Small Circled Play/Pause Button covering Gemini Watermark */}
            <button
              type="button"
              id="bgm-toggle-btn-frame"
              onClick={toggleAudio}
              title={isPlaying ? "Pause Music" : "Play Music"}
              aria-label={isPlaying ? "Pause Music" : "Play Music"}
              style={
                watermarkPos
                  ? {
                      position: 'absolute',
                      left: `${watermarkPos.x}px`,
                      top: `${watermarkPos.y}px`,
                      transform: 'translate(-50%, -50%)',
                      zIndex: 70
                    }
                  : {
                      position: 'absolute',
                      right: '24px',
                      bottom: '28px',
                      zIndex: 70
                    }
              }
              className={`w-12 h-12 rounded-full bg-[#FAF7F2] hover:bg-white border-2 border-[#d4af37] shadow-[0_6px_25px_rgba(0,0,0,0.6),0_0_15px_rgba(212,175,55,0.7)] flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 group ${
                introState === 'ready' ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
              }`}
            >
              {isPlaying && (
                <span className="absolute inset-0 rounded-full border border-[#d4af37]/70 animate-ping pointer-events-none opacity-40" />
              )}
              {isPlaying ? (
                <Pause className="w-5 h-5 text-[#5A2430] fill-[#5A2430] transition-colors" />
              ) : (
                <Play className="w-5 h-5 text-[#5A2430] fill-[#5A2430] translate-x-0.5 transition-colors" />
              )}
            </button>

            {/* Tap to Open Overlay inside phone screen */}
            <div
              id="tap-overlay-frame"
              onClick={handleTapToOpen}
              onTouchStart={handleTapToOpen}
              className={`absolute inset-0 z-40 flex flex-col items-center justify-center cursor-pointer transition-all duration-700 select-none ${
                introState === 'ready'
                  ? 'opacity-100 pointer-events-auto'
                  : introState === 'opening'
                  ? 'opacity-0 pointer-events-none scale-95'
                  : 'hidden'
              }`}
            >
              {/* Center Wax Seal Pulse */}
              <div className="absolute top-[52.4%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 pointer-events-none">
                <div className="absolute inset-0 rounded-full border-[1.5px] border-[#d4af37] animate-[sealPulse_2.6s_cubic-bezier(0.2,0.8,0.2,1)_infinite] opacity-0" />
                <div className="absolute inset-0 rounded-full border-[1.5px] border-[#d4af37] animate-[sealPulse_2.6s_cubic-bezier(0.2,0.8,0.2,1)_infinite_0.85s] opacity-0" />
                <div className="absolute inset-0 rounded-full border-[1.5px] border-[#d4af37] animate-[sealPulse_2.6s_cubic-bezier(0.2,0.8,0.2,1)_infinite_1.7s] opacity-0" />
                <div className="absolute inset-5 rounded-full bg-radial from-[#d4af37]/35 via-[#d4af37]/10 to-transparent shadow-[0_0_25px_rgba(212,175,55,0.5)] animate-pulse" />
              </div>

              {/* White Luxury Tap Button */}
              <div className="absolute top-[73%] left-1/2 -translate-x-1/2 pointer-events-auto cursor-pointer">
                <button
                  id="tap-to-open-btn-frame"
                  type="button"
                  onClick={handleTapToOpen}
                  className="group inline-flex flex-col items-center gap-1 bg-white/95 hover:bg-white border-[1.5px] border-[#d4af37] hover:border-[#ffd700] px-7 py-2.5 rounded-full backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.3),0_0_25px_rgba(255,255,255,0.5),inset_0_1px_0_rgba(255,255,255,0.9)] hover:shadow-[0_14px_40px_rgba(0,0,0,0.4),0_0_35px_rgba(212,175,55,0.4)] transition-all duration-300 hover:scale-105 active:scale-95 animate-[tapFloat_2.6s_ease-in-out_infinite]"
                >
                  <div className="font-cinzel text-xs font-semibold tracking-[0.26em] uppercase text-[#3b0e16] flex items-center gap-2 whitespace-nowrap">
                    <span className="text-[#d4af37]">✦</span>
                    <span>Tap To Open</span>
                    <span className="text-[#d4af37]">✦</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Floating Replay Button */}
            {introState === 'revealed' && (
              <button
                type="button"
                onClick={handleReplay}
                title="Replay Envelope Opening"
                className="absolute top-12 right-4 z-50 inline-flex items-center gap-1.5 bg-black/60 hover:bg-black/85 text-[#FCECD7] hover:text-white border border-[#d4af37]/50 px-3 py-1.5 rounded-full text-xs font-cinzel uppercase tracking-wider backdrop-blur-md shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Replay</span>
              </button>
            )}

            {/* Inner Phone Scrolling Content Container */}
            <div
              ref={scrollContainerRef}
              className="relative z-10 w-full h-full overflow-y-auto overflow-x-hidden rounded-[38px] scroll-smooth"
            >
              {renderInvitationContent()}
            </div>
          </div>

          {/* Desktop Companion Card: QR Code & Mobile Instructions */}
          <aside className="hidden xl:flex flex-col items-center justify-center max-w-xs p-6 rounded-3xl bg-[#170a14]/80 backdrop-blur-xl border border-[#d4af37]/30 shadow-2xl text-center space-y-4">
            <div className="w-10 h-10 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
              <QrIcon className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <h4 className="font-serif-title text-lg text-white font-medium">
                Open on Real Phone
              </h4>
              <p className="text-xs text-white/70 font-sans-clean leading-relaxed">
                Scan this QR code with your phone camera to experience the full edge-to-edge invitation.
              </p>
            </div>

            {/* Generated QR Code Image */}
            <div className="p-3 bg-white rounded-2xl shadow-inner border border-[#d4af37]/40">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="Scan to open on mobile"
                  className="w-36 h-36 rounded-lg object-contain"
                />
              ) : (
                <div className="w-36 h-36 flex items-center justify-center text-xs text-stone-500">
                  Generating QR...
                </div>
              )}
            </div>

            <div className="space-y-2 w-full pt-1">
              <button
                type="button"
                onClick={copyPhoneLink}
                className="w-full px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-sans-clean font-medium text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#d4af37]" />}
                <span>{linkCopied ? "Link Copied!" : "Copy Mobile Link"}</span>
              </button>

              <p className="text-[11px] text-[#FCECD7]/60 font-sans-clean leading-tight">
                Requires phone &amp; laptop to be on the same Wi-Fi network.
              </p>
            </div>
          </aside>
        </main>
      ) : (
        /* Fullscreen Mobile View (Native Phone Experience) */
        <main className="relative w-full min-h-[100dvh] bg-[#0d060e] flex flex-col overflow-x-hidden">
          {/* Background Video Canvas (Fixed edge-to-edge for mobile, locked height so it stays completely still on scroll) */}
          <div className="fixed inset-0 w-full h-full pointer-events-none z-0 bg-[#0d060e] overflow-hidden" style={{ height: '100lvh', minHeight: '100%' }}>
            <EnvelopeCanvas ref={envelopeRef} onOpened={handleTransitionReady} onWatermarkPos={setWatermarkPos} />
          </div>

          {/* Small Circled Play/Pause Button covering Gemini Watermark */}
          <button
            type="button"
            id="bgm-toggle-btn-mobile"
            onClick={toggleAudio}
            title={isPlaying ? "Pause Music" : "Play Music"}
            aria-label={isPlaying ? "Pause Music" : "Play Music"}
            style={
              watermarkPos
                ? {
                    position: 'fixed',
                    left: `${watermarkPos.x}px`,
                    top: `${watermarkPos.y}px`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 70
                  }
                : {
                    position: 'fixed',
                    right: '24px',
                    bottom: '28px',
                    zIndex: 70
                  }
            }
            className={`w-12 h-12 rounded-full bg-[#FAF7F2] hover:bg-white border-2 border-[#d4af37] shadow-[0_6px_25px_rgba(0,0,0,0.6),0_0_15px_rgba(212,175,55,0.7)] flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 group ${
              introState === 'ready' ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
            }`}
          >
            {isPlaying && (
              <span className="absolute inset-0 rounded-full border border-[#d4af37]/70 animate-ping pointer-events-none opacity-40" />
            )}
            {isPlaying ? (
              <Pause className="w-5 h-5 text-[#5A2430] fill-[#5A2430] transition-colors" />
            ) : (
              <Play className="w-5 h-5 text-[#5A2430] fill-[#5A2430] translate-x-0.5 transition-colors" />
            )}
          </button>

          {/* Tap to Open Overlay */}
          <div
            id="tap-overlay-mobile"
            onClick={handleTapToOpen}
            onTouchStart={handleTapToOpen}
            className={`fixed inset-0 z-40 flex flex-col items-center justify-center cursor-pointer transition-all duration-700 select-none ${
              introState === 'ready'
                ? 'opacity-100 pointer-events-auto'
                : introState === 'opening'
                ? 'opacity-0 pointer-events-none scale-95'
                : 'hidden'
            }`}
          >
            {/* Center Wax Seal Pulse */}
            <div className="absolute top-[52.4%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 pointer-events-none">
              <div className="absolute inset-0 rounded-full border-[1.5px] border-[#d4af37] animate-[sealPulse_2.6s_cubic-bezier(0.2,0.8,0.2,1)_infinite] opacity-0" />
              <div className="absolute inset-0 rounded-full border-[1.5px] border-[#d4af37] animate-[sealPulse_2.6s_cubic-bezier(0.2,0.8,0.2,1)_infinite_0.85s] opacity-0" />
              <div className="absolute inset-0 rounded-full border-[1.5px] border-[#d4af37] animate-[sealPulse_2.6s_cubic-bezier(0.2,0.8,0.2,1)_infinite_1.7s] opacity-0" />
              <div className="absolute inset-5 rounded-full bg-radial from-[#d4af37]/35 via-[#d4af37]/10 to-transparent shadow-[0_0_25px_rgba(212,175,55,0.5)] animate-pulse" />
            </div>

            {/* White Luxury Tap Button */}
            <div className="absolute top-[73%] left-1/2 -translate-x-1/2 pointer-events-auto cursor-pointer">
              <button
                id="tap-to-open-btn-mobile"
                type="button"
                onClick={handleTapToOpen}
                className="group inline-flex flex-col items-center gap-1 bg-white/95 hover:bg-white border-[1.5px] border-[#d4af37] hover:border-[#ffd700] px-7 py-2.5 rounded-full backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.3),0_0_25px_rgba(255,255,255,0.5),inset_0_1px_0_rgba(255,255,255,0.9)] hover:shadow-[0_14px_40px_rgba(0,0,0,0.4),0_0_35px_rgba(212,175,55,0.4)] transition-all duration-300 hover:scale-105 active:scale-95 animate-[tapFloat_2.6s_ease-in-out_infinite]"
              >
                <div className="font-cinzel text-xs sm:text-sm font-semibold tracking-[0.26em] uppercase text-[#3b0e16] flex items-center gap-2 whitespace-nowrap">
                  <span className="text-[#d4af37]">✦</span>
                  <span>Tap To Open</span>
                  <span className="text-[#d4af37]">✦</span>
                </div>
              </button>
            </div>
          </div>

          {/* Floating Replay Button */}
          {introState === 'revealed' && (
            <button
              type="button"
              onClick={handleReplay}
              title="Replay Envelope Opening"
              className="fixed top-4 right-4 z-50 inline-flex items-center gap-1.5 bg-black/60 hover:bg-black/85 text-[#FCECD7] hover:text-white border border-[#d4af37]/50 px-3.5 py-1.5 rounded-full text-xs font-cinzel uppercase tracking-wider backdrop-blur-md shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#d4af37]" />
              <span className="hidden sm:inline">Replay</span>
            </button>
          )}

          {/* Render Invitation Sections */}
          <div className="relative z-10 w-full flex flex-col">
            {renderInvitationContent()}
          </div>
        </main>
      )}

      {/* Native Safari-compatible Audio Element */}
      <audio
        ref={audioRef}
        src="/bgm.mp3"
        loop
        preload="auto"
        playsInline
      />
    </div>
  );
}
