import { motion } from "framer-motion";
import AnimatedSection from "./AnimatedSection";
import { Phone, Mail, MapPin } from "lucide-react";

// Animation variants
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

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.9 },
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

const floatAnimation = {
  y: [0, -10, 0],
  transition: {
    duration: 2.5,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

const Contact = () => {
  const contactDetails = [
    {
      icon: Phone,
      title: "Phone",
      details: ["+91 98765 43210", "+91 98765 43211"],
      buttonText: "Call Now",
      buttonLink: "tel:+919876543210",
    },
    {
      icon: Mail,
      title: "Email",
      details: ["info@tgopitextiles.com", "contact@tgopitextiles.com"],
      buttonText: "Email Us",
      buttonLink: "mailto:info@tgopitextiles.com",
    },
    {
      icon: MapPin,
      title: "Location",
      details: ["T.Gopi Textiles", "Main Market, Your City"],
      buttonText: "Get Directions",
      buttonLink: "https://www.google.com/maps",
    },
  ];

  return (
    <AnimatedSection id="contact">
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
              Get in <span className="text-gradient-silk">Touch</span>
            </motion.h2>
            <motion.p
              className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              Visit our store or reach out to us. We're here to help you find
              the perfect textile.
            </motion.p>
          </div>

          {/* Animated cards grid */}
          <motion.div
            className="grid md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            {contactDetails.map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  variants={cardVariants}
                  whileHover={{ scale: 1.05, rotateY: 5 }}
                  transition={{ type: "spring", stiffness: 150 }}
                  className="shine-effect flex flex-col items-center p-8 text-center bg-white/60 backdrop-blur-sm rounded-xl shadow-soft hover:shadow-elegant transition-all duration-300 border border-white/50"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <motion.div
                    animate={floatAnimation}
                    className="p-4 mb-4 text-white rounded-lg bg-gradient-silk shadow-md"
                    style={{ transform: "translateZ(20px)" }}
                  >
                    <Icon size={32} />
                  </motion.div>

                  <h3 className="mb-3 text-2xl font-serif font-bold text-gray-800">
                    {item.title}
                  </h3>

                  <div className="flex-grow text-gray-600 space-y-1">
                    {item.details.map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>

                  <a
                    href={item.buttonLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-8 py-3 mt-6 font-bold text-gray-800 transition-bounce bg-gradient-to-r from-yellow-300 to-orange-400 rounded-full hover:scale-105"
                  >
                    {item.buttonText}
                  </a>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </div>
    </AnimatedSection>
  );
};

export default Contact;
