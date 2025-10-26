import AnimatedSection from "./AnimatedSection";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const quickLinks = [
    { name: "Home", href: "#home" },
    { name: "About", href: "#about" },
    { name: "Our Story", href: "#story" },
    { name: "Collections", href: "#collections" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <AnimatedSection className="pt-0 pb-16">
      <div className="container mx-auto px-4">
        <div className="p-8 md:p-12 bg-white/50 backdrop-blur-xl rounded-2xl shadow-elegant border border-white/50">
          <div className="grid md:grid-cols-3 gap-12 mb-10">
            <div>
              <h3 className="text-3xl font-serif font-bold text-gradient-silk mb-4">
                T.Gopi Textiles
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Preserving the art of traditional Indian textiles with passion
                and dedication.
              </p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4 text-gray-800">
                Quick Links
              </h4>
              <ul className="space-y-2">
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-gray-600 hover:text-gradient-silk transition-smooth hover:translate-x-1 inline-block"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4 text-gray-800">
                Store Hours
              </h4>
              <ul className="space-y-2 text-gray-600">
                <li>Monday - Saturday: 10:00 AM - 8:00 PM</li>
                <li>Sunday: 10:00 AM - 6:00 PM</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 text-center">
            <p className="text-gray-500">
              © {currentYear} FlipFlex. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
};
export default Footer;