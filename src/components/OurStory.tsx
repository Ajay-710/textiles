import AnimatedSection from "./AnimatedSection";
import heritageImage from "@/assets/heritage-story.jpg";

const OurStory = () => {
  const timeline = [
    {
      year: "1980",
      title: "The Beginning",
      description: "T.Gopi founded our first textile shop with a vision to bring quality fabrics to the community.",
    },
    {
      year: "1995",
      title: "Expansion",
      description: "Expanded our collection to include premium silk sarees from across India, gaining recognition for quality.",
    },
    {
      year: "2010",
      title: "Next Generation",
      description: "The family legacy continued as the next generation joined, bringing fresh ideas.",
    },
    {
      year: "2025",
      title: "Digital Presence",
      description: "Embracing technology to reach more customers while maintaining our commitment to authentic textiles.",
    },
  ];

  return (
    <AnimatedSection id="story">
      <div className="container mx-auto px-4">
        <div className="p-8 md:p-12 bg-white/50 backdrop-blur-xl rounded-2xl shadow-elegant border border-white/50">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-gray-900">
              Our <span className="text-gradient-silk">Story</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              A journey of passion, tradition, and unwavering commitment to
              quality.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-silk opacity-20 rounded-2xl blur-xl group-hover:opacity-30 transition-smooth"></div>
              <img
                src={heritageImage}
                alt="Heritage"
                className="relative rounded-2xl shadow-dramatic w-full h-auto border-4 border-white group-hover:scale-[1.02] transition-bounce"
              />
            </div>
            <div>
              <h3 className="text-3xl font-serif font-bold text-gray-800 mb-4">
                A Legacy Woven with Care
              </h3>
              <p className="text-gray-600 leading-relaxed">
                What started as a small shop has grown into a beloved
                destination for authentic Indian textiles. Through decades of
                dedication, we've built relationships with the finest weavers,
                ensuring every piece tells a story of tradition and
                craftsmanship.
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {timeline.map((item) => (
              <div
                key={item.year}
                className="p-6 bg-white/60 backdrop-blur-sm rounded-xl shadow-soft text-center hover:shadow-elegant transition-shadow duration-300 border border-white/50"
              >
                <div className="text-5xl font-serif font-bold text-gradient-silk mb-3">
                  {item.year}
                </div>
                <h4 className="text-xl font-bold mb-2 text-gray-800">
                  {item.title}
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
};
export default OurStory;