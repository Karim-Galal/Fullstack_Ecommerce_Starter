'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { motion, useScroll, useTransform } from 'motion/react';
import Link from 'next/link';
import { storeConfig } from '@/config/store';

const ease = [0.22, 1, 0.36, 1];

// Single source of truth for every Hero color. These are intentionally
// fixed values, independent of the global theme (light/dark mode), because
// the Hero always sits on its own dark background photo regardless of the
// site-wide theme. Change a color here and it updates everywhere it's used.
const HERO_COLORS = {
  brandName: '#f6f3ee', // top-left brand label
  eyebrow: '#d8c09a', // small label above the headline
  eyebrowLine: '#d8c09a', // short rule next to the eyebrow
  headline: '#f6f3ee', // main heading — brightest text in the Hero
  subtitle: '#e2ddd3', // supporting paragraph — slightly dimmer than headline
  note: '#a79f91', // bottom-bar caption — most muted text
  divider: 'rgba(246, 243, 238, 0.2)', // bottom-bar top border
  buttonBg: '#f1f3f6', // primary CTA background (light)
  buttonText: '#191815', // primary CTA text — always dark, never white
  buttonHoverBg: '#ffffff', // primary CTA background on hover
  buttonHoverText: '#191815', // primary CTA text on hover — stays dark
};

// Exposes HERO_COLORS as CSS custom properties on the section, so Tailwind's
// hover:/arbitrary-value utilities (e.g. hover:bg-[var(--hero-btn-hover-bg)])
// can reference them without needing inline onMouseEnter/Leave handlers.
const heroStyleVars = {
  '--hero-brand-name': HERO_COLORS.brandName,
  '--hero-eyebrow': HERO_COLORS.eyebrow,
  '--hero-eyebrow-line': HERO_COLORS.eyebrowLine,
  '--hero-headline': HERO_COLORS.headline,
  '--hero-subtitle': HERO_COLORS.subtitle,
  '--hero-note': HERO_COLORS.note,
  '--hero-divider': HERO_COLORS.divider,
  '--hero-btn-bg': HERO_COLORS.buttonBg,
  '--hero-btn-text': HERO_COLORS.buttonText,
  '--hero-btn-hover-bg': HERO_COLORS.buttonHoverBg,
  '--hero-btn-hover-text': HERO_COLORS.buttonHoverText,
};

// Slowed-down staggered entrance — fires on mount, independent of the
// scroll-driven parallax below.
const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.22,
      delayChildren: 0.3,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.3, ease },
  },
};

export function HomeHero() {
  const t = useTranslations('home');
  const heroRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  // Single source of truth for the parallax — only the wrapper moves/scales,
  // the image itself does not carry its own competing scale animation.
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const contentOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const imageY = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.04, 1.16]);

  return (
    <section
      ref={heroRef}
      style={heroStyleVars}
      className="relative isolate overflow-hidden bg-[#111110]"
    >
      {/* Full-bleed background photography — one scale source only */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, ease }}
        style={{ y: imageY, scale: imageScale }}
      >
        <img
          src="/images/hero-silver.webp"
          alt=""
          width={1000}
          height={1200}
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover object-[62%_center] sm:object-[68%_center] lg:object-[72%_center]"
        />
      </motion.div>

      {/* Blend the photograph into the dark background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] bg-[#111110]/35"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-[#111110] via-[#111110]/75 to-[#111110]/15"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-l from-[#111110]/35 via-transparent to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-[#111110] via-[#111110]/25 to-[#111110]/15"
      />

      {/* Atmospheric lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_72%_40%,rgba(184,160,119,0.15),transparent_55%)]"
      />

      <div className="shell relative z-10 flex min-h-0 flex-col justify-between py-7 sm:py-9 lg:min-h-[min(850px,calc(100svh-5rem))] lg:py-10">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.15, ease }}
          className="flex items-center justify-between"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--hero-brand-name)]">
            {storeConfig.name}
          </span>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          style={{ y: contentY, opacity: contentOpacity }}
          className="relative max-w-5xl pb-9 pt-16 sm:pb-14 sm:pt-24 lg:max-w-[68%] lg:pb-20 lg:pt-16"
        >
          {/* Eyebrow — accent color, fixed */}
          <motion.p
            variants={item}
            className="mb-6 flex items-center gap-3 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-[var(--hero-eyebrow)] sm:mb-9"
          >
            <span className="h-px w-9 bg-[var(--hero-eyebrow-line)]" />
            {t('eyebrow')}
          </motion.p>

          {/* Headline — brightest fixed light color */}
          <motion.h1
            variants={item}
            className="max-w-[11ch] text-balance text-[clamp(3.5rem,10.5vw,9.5rem)] font-medium leading-[0.88] tracking-[-0.065em] text-[var(--hero-headline)]"
          >
            {t('heroTitle')}
          </motion.h1>

          {/* Subtitle — fixed light color, dimmer than headline */}
          <motion.p
            variants={item}
            className="mt-6 max-w-md text-sm leading-7 text-[var(--hero-subtitle)] sm:mt-8 sm:text-base sm:leading-8"
          >
            {t('heroSubtitle')}
          </motion.p>

          <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-5 sm:mt-10">
            {/* Primary CTA — fixed light background, fixed dark text, always */}
            <Link
              href="/products"
              className="group inline-flex min-h-14 items-center justify-center rounded-lg bg-[var(--hero-btn-bg)] px-7 py-4 text-sm font-semibold text-[var(--hero-btn-text)] transition-colors duration-300 hover:bg-[var(--hero-btn-hover-bg)] hover:text-[var(--hero-btn-hover-text)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--hero-btn-bg)] sm:min-h-16 sm:px-9"
            >
              <span>{t('heroPrimary')}</span>
            </Link>
          </motion.div>
        </motion.div>

        {/* Note — fixed, most muted; timed to land after the entrance stagger finishes */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 1.6, ease }}
          className="relative flex items-center justify-between gap-4 border-t pt-4 text-[0.6rem] uppercase tracking-[0.16em] text-[var(--hero-note)] sm:tracking-[0.2em]"
          style={{ borderColor: 'var(--hero-divider)' }}
        >
          <span>{t('heroNote')}</span>
          <span className="hidden sm:inline">01 — 03</span>
        </motion.div>
      </div>
    </section>
  );
}

export default HomeHero;
