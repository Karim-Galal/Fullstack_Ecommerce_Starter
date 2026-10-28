'use client';

import { HomeHero } from '@/components/storefront/home/HomeHero';
import { StorePrinciples } from '@/components/storefront/home/StorePrinciples';
import { StoreCategories } from '@/components/storefront/home/StoreCategories';
import { NewArrivals } from '@/components/storefront/home/NewArrivals';
import { CraftStory } from '@/components/storefront/home/CraftStory';
import { HomeClosingCTA } from '@/components/storefront/home/HomeClosingCTA';

export default function Home() {
  return (
    <>
      <HomeHero />

      <StorePrinciples />

      <StoreCategories />

      <NewArrivals />

      <HomeClosingCTA />
    </>
  );
}
