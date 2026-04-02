import { businessCategories } from "@/data/mockData";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const BusinessCategories = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} className="container py-20">
      <h2 className={`text-2xl font-bold mb-10 ${isVisible ? "animate-fade-in" : "opacity-0"}`}>
        Para o seu negócio
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {businessCategories.map((cat, i) => (
          <div
            key={cat.id}
            className={`flex flex-col items-center gap-3 group cursor-pointer ${
              isVisible ? "animate-fade-in" : "opacity-0"
            }`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden shadow-md group-hover:shadow-xl transition-shadow duration-300">
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <span className="text-sm font-medium text-center">{cat.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BusinessCategories;
