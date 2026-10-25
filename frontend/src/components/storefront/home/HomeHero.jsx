'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { motion, useScroll, useTransform } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { storeConfig } from '@/config/store';

const ease = [0.22, 1, 0.36, 1];

// All Hero colors are fixed and independent of the site theme.
// Change the values here to customize the Hero colors.
const HERO_COLORS = {
  background: '#111110',

  brandName: '#f6f3ee',
  eyebrow: '#d8c09a',
  eyebrowLine: '#d8c09a',
  headline: '#f6f3ee',
  subtitle: '#e2ddd3',
  note: '#a79f91',
  divider: 'rgba(246, 243, 238, 0.2)',

  primaryButtonBg: '#f1f3f6',
  primaryButtonText: '#191815',
  primaryButtonHoverBg: '#ffffff',
  primaryButtonHoverText: '#191815',
  primaryButtonFocus: '#d8c09a',

  secondaryButtonText: '#e2ddd3',
  secondaryButtonHoverText: '#ffffff',

  imageOverlay: 'rgba(17, 17, 16, 0.35)',
  gradientRight:
    'linear-gradient(to right, #111110 0%, rgba(17,17,16,0.75) 55%, rgba(17,17,16,0.15) 100%)',
  gradientLeft:
    'linear-gradient(to left, rgba(17,17,16,0.35), transparent 45%, transparent)',
  gradientBottom:
    'linear-gradient(to top, #111110 0%, rgba(17,17,16,0.25) 45%, rgba(17,17,16,0.15) 100%)',
  atmosphericGlow:
    'radial-gradient(ellipse at 72% 40%, rgba(184,160,119,0.15), transparent 55%)',
};

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
    transition: {
      duration: 1.3,
      ease,
    },
  },
};

export function HomeHero() {
  const t = useTranslations('home');
  const heroRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const contentY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const contentOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const imageY = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.04, 1.16]);

  return (
    <section
      ref={heroRef}
      style={{ backgroundColor: HERO_COLORS.background }}
      className="relative isolate overflow-hidden"
    >
      {/* Full-bleed background image */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.8, ease }}
        style={{ y: imageY, scale: imageScale }}
      >
        <Image
          src="/images/hero-silver.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[62%_center] sm:object-[68%_center] lg:object-[72%_center]"
        />
      </motion.div>

      {/* Fixed image overlays */}
      <div
        aria-hidden="true"
        style={{ backgroundColor: HERO_COLORS.imageOverlay }}
        className="pointer-events-none absolute inset-0 z-[1]"
      />

      <div
        aria-hidden="true"
        style={{ background: HERO_COLORS.gradientRight }}
        className="pointer-events-none absolute inset-0 z-[1]"
      />

      <div
        aria-hidden="true"
        style={{ background: HERO_COLORS.gradientLeft }}
        className="pointer-events-none absolute inset-0 z-[1]"
      />

      <div
        aria-hidden="true"
        style={{ background: HERO_COLORS.gradientBottom }}
        className="pointer-events-none absolute inset-0 z-[1]"
      />

      {/* Fixed atmospheric gold lighting */}
      <div
        aria-hidden="true"
        style={{ background: HERO_COLORS.atmosphericGlow }}
        className="pointer-events-none absolute inset-0 z-[1]"
      />

      <div className="shell relative z-10 flex min-h-0 flex-col justify-between py-7 sm:py-9 lg:min-h-[min(850px,calc(100svh-5rem))] lg:py-10">
        {/* Brand name */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.25, ease }}
          className="flex items-center justify-between"
        >
          <span
            style={{ color: HERO_COLORS.brandName }}
            className="text-xs font-semibold uppercase tracking-[0.25em]"
          >
            {storeConfig.name}
          </span>
        </motion.div>

        {/* Main Hero content */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          style={{
            y: contentY,
            opacity: contentOpacity,
          }}
          className="relative max-w-5xl pb-9 pt-16 sm:pb-14 sm:pt-24 lg:max-w-[68%] lg:pb-20 lg:pt-16"
        >
          {/* Eyebrow */}
          <motion.p
            variants={item}
            style={{ color: HERO_COLORS.eyebrow }}
            className="mb-6 flex items-center gap-3 text-[0.65rem] font-semibold uppercase tracking-[0.24em] sm:mb-9"
          >
            <span
              style={{ backgroundColor: HERO_COLORS.eyebrowLine }}
              className="h-px w-9"
            />
            {t('eyebrow')}
          </motion.p>

          {/* Headline */}
          <motion.h1
            variants={item}
            style={{ color: HERO_COLORS.headline }}
            className="max-w-[11ch] text-balance text-[clamp(3.5rem,10.5vw,9.5rem)] font-medium leading-[0.88] tracking-[-0.065em]"
          >
            {t('heroTitle')}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={item}
            style={{ color: HERO_COLORS.subtitle }}
            className="mt-6 max-w-md text-sm leading-7 sm:mt-8 sm:text-base sm:leading-8"
          >
            {t('heroSubtitle')}
          </motion.p>

          {/* Primary and secondary CTAs */}
          <motion.div
            variants={item}
            className="mt-8 flex flex-wrap items-center gap-5 sm:mt-10"
          >
            <Link
              href="/products"
              style={{
                backgroundColor: HERO_COLORS.primaryButtonBg,
                color: HERO_COLORS.primaryButtonText,
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.backgroundColor =
                  HERO_COLORS.primaryButtonHoverBg;
                event.currentTarget.style.color =
                  HERO_COLORS.primaryButtonHoverText;
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor =
                  HERO_COLORS.primaryButtonBg;
                event.currentTarget.style.color =
                  HERO_COLORS.primaryButtonText;
              }}
              className="inline-flex min-h-14 items-center justify-center rounded-lg px-7 py-4 text-sm font-semibold transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 sm:min-h-16 sm:px-9"
            >
              {t('heroPrimary')}
            </Link>

            <a
              href="#new-arrivals"
              style={{ color: HERO_COLORS.secondaryButtonText }}
              onMouseEnter={(event) => {
                event.currentTarget.style.color =
                  HERO_COLORS.secondaryButtonHoverText;
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.color =
                  HERO_COLORS.secondaryButtonText;
              }}
              className="inline-flex min-h-12 items-center px-3 py-3 text-sm font-medium transition-colors duration-300"
            >
              {t('heroSecondary')}
            </a>
          </motion.div>
        </motion.div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 2.0, ease }}
          style={{
            color: HERO_COLORS.note,
            borderColor: HERO_COLORS.divider,
          }}
          className="relative flex items-center justify-between gap-4 border-t pt-4 text-[0.6rem] uppercase tracking-[0.16em] sm:tracking-[0.2em]"
        >
          <span>{t('heroNote')}</span>
          <span className="hidden sm:inline">01 — 03</span>
        </motion.div>
      </div>
    </section>
  );
}

export default HomeHero;