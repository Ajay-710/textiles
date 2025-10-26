import AnimatedSection from "./AnimatedSection";
import { Phone, Mail, MapPin } from "lucide-react";

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
        <div className="p-8 md:p-12 bg-white/50 backdrop-blur-xl rounded-2xl shadow-elegant border border-white/50">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-gray-900">
              Get in <span className="text-gradient-silk">Touch</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Visit our store or reach out to us. We're here to help you find
              the perfect textile.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {contactDetails.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex flex-col items-center p-8 text-center bg-white/60 backdrop-blur-sm rounded-xl shadow-soft hover:shadow-elegant transition-shadow duration-300 border border-white/50"
                >
                  <div className="p-4 mb-4 text-white rounded-lg bg-gradient-silk animate-float">
                    <Icon size={32} />
                  </div>
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
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
};

export default Contact;