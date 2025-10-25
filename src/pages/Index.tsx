import Header from "@/components/Header";
import Hero from "@/components/Hero";
import About from "@/components/About";
import OurStory from "@/components/OurStory";
import Collections from "@/components/Collections";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

// Define the type for the props we are now accepting from App.tsx
interface IndexProps {
  onLoginClick: () => void;
}

const Index = ({ onLoginClick }: IndexProps) => {
  return (
    <div className="min-h-screen">
      {/* Pass the onLoginClick function down to the Header component */}
      <Header onLoginClick={onLoginClick} />
      <main>
        <Hero />
        <About />
        <OurStory />
        <Collections />
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default Index;