import { motion } from "framer-motion";
import AnimatedSection from "./AnimatedSection";
import { Heart, Award, Users } from "lucide-react";
import { useTilt } from "@/hooks/useTilt";

// Container animation for staggering
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.25,
      delayChildren: 0.2,
    },
  },
};

// Card animation (float-in + spring bounce)
const cardVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      type: "spring",
      stiffness: 120,
    },
  },
};

// Floating icon animation
const floatAnimation = {
  y: [0, -10, 0],
  transition: {
    duration: 2.5,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

const About = () => {
  const values = [
    {
      icon: Heart,
      title: "Passion for Quality",
      description:
        "Every piece is carefully selected to ensure the highest quality and craftsmanship.",
    },
    {
      icon: Award,
      title: "Traditional Excellence",
      description:
        "Preserving centuries-old weaving traditions and supporting local artisans.",
    },
    {
      icon: Users,
      title: "Customer First",
      description:
        "Building lasting relationships through trust, quality, and exceptional service.",
    },
  ];

  return (
    <AnimatedSection id="about">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="p-8 md:p-12 bg-white/50 backdrop-blur-xl rounded-2xl shadow-elegant border border-white/50"
        >
          <div className="text-center mb-16">
            <motion.h2
              className="text-4xl md:text-5xl font-serif font-bold mb-4 text-gray-900"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              About <span className="text-gradient-silk">T.Gopi Textiles</span>
            </motion.h2>
            <motion.p
              className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              For generations, we have been dedicated to bringing the finest
              Indian textiles to our customers, blending traditional
              craftsmanship with contemporary designs.
            </motion.p>
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
        </motion.div>
      </div>
    </AnimatedSection>
  );
};

type ValueType = {
  icon: React.ElementType;
  title: string;
  description: string;
};

const TiltableCard = ({ value }: { value: ValueType }) => {
  const tiltRef = useTilt<HTMLDivElement>();
  const Icon = value.icon;

  return (
    <motion.div
      ref={tiltRef}
      variants={cardVariants}
      whileHover={{ scale: 1.05, rotateY: 5 }}
      transition={{ type: "spring", stiffness: 150 }}
      className="shine-effect text-center p-6 bg-white/60 backdrop-blur-sm rounded-xl shadow-soft hover:shadow-elegant transition-all duration-300 border border-white/50"
      style={{ transformStyle: "preserve-3d" }}
    >
      <div style={{ transform: "translateZ(20px)" }}>
        <motion.div
          animate={floatAnimation}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-silk mb-5 shadow-md"
        >
          <Icon className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="text-2xl font-serif font-bold mb-3 text-gray-800">
          {value.title}
        </h3>
        <p className="text-gray-600 leading-relaxed">{value.description}</p>
      </div>
    </motion.div>
  );
};

export default About;
