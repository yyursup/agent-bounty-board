import { SiteFooter } from "@/components/layout/SiteFooter";
import { CallToAction } from "@/features/landing/CallToAction";
import { Hero } from "@/features/landing/Hero";
import { LandingHeader } from "@/features/landing/LandingHeader";
import styles from "@/features/landing/Landing.module.css";
import { PassportSpecimen } from "@/features/landing/PassportSpecimen";
import { Regulations } from "@/features/landing/Regulations";
import { RouteTracker } from "@/features/landing/RouteTracker";

export default function LandingPage() {
  return (
    <>
      <LandingHeader />
      <main className={styles.page}>
        <Hero />
        <RouteTracker />
        <PassportSpecimen />
        <Regulations />
        <CallToAction />
      </main>
      <SiteFooter />
    </>
  );
}
