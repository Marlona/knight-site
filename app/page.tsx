import Hero from "@/components/sections/Hero";
import Stats from "@/components/sections/Stats";
import About from "@/components/sections/About";
import Services from "@/components/sections/Services";
import HostInterlude from "@/components/sections/HostInterlude";
import Showcase from "@/components/sections/Showcase";
import Transformation from "@/components/sections/Transformation";
import Testimonials from "@/components/sections/Testimonials";
import FinalCta from "@/components/sections/FinalCta";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <main>
      <Hero />
      <Stats />
      <About />
      <Services />
      <HostInterlude />
      <Showcase />
      <Transformation />
      <Testimonials />
      <FinalCta />
      <Footer />
    </main>
  );
}
