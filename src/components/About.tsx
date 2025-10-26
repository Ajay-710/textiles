// src/components/About.tsx
import { motion } from "framer-motion";
import AnimatedSection from "./AnimatedSection";
import { Heart, Award, Users } from "lucide-react";
import { useTilt } from "@/hooks/useTilt"; // Import the hook we just created

// Define animation variants for staggering
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

// This is the main component that is exported by default
const About = () => {
  const values = [
    {
      icon: Heart,
      title: "Passion for Quality",
      description: "Every piece is carefully selected to ensure the highest quality and craftsmanship.",
    },
    {
      icon: Award,
      title: "Traditional Excellence",
      description: "Preserving centuries-old weaving traditions and supporting local artisans.",
    },
    {
      icon: Users,
      title: "Customer First",
      description: "Building lasting relationships through trust, quality, and exceptional service.",
    },
  ];

  return (
    <AnimatedSection id="about">
      <div className="container mx-auto px-4">
        <div className="p-8 md:p-12 bg-white/50 backdrop-blur-xl rounded-2xl shadow-elegant border border-white/50">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-gray-900">
              About <span className="text-gradient-silk">T.Gopi Textiles</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              For generations, we have been dedicated to bringing the finest
              Indian textiles to our customers, blending traditional
              craftsmanship with contemporary designs.
            </p>
          </div>
          
          <motion.div
            className="grid md:grid-cols-3 gap-10"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            {values.map((value, index) => (
              <TiltableCard key={index} value={value} />
            ))}
          </motion.div>
        </div>
      </div>
    </AnimatedSection>
  );
};

// A helper component to keep the code clean
const TiltableCard = ({ value }: { value: (typeof About.prototype.values)[0] }) => {
  const tiltRef = useTilt<HTMLDivElement>();
  const Icon = value.icon;

  return (
    <motion.div
      ref={tiltRef}
      variants={cardVariants}
      className="shine-effect text-center p-6 bg-white/60 backdrop-blur-sm rounded-xl shadow-soft hover:shadow-elegant transition-shadow duration-300 border border-white/50"
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div style={{ transform: 'translateZ(20px)' }}>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-silk mb-5 shadow-md animate-float">
          <Icon className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-serif font-bold mb-3 text-gray-800">
          {value.title}
        </h3>
        <p className="text-gray-600 leading-relaxed">
          {value.description}
        </p>
      </div>
    </motion.div>
  );
}

// This is the crucial line that was missing
export default About;