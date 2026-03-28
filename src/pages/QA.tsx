import { useState } from "react";
import faqsData from "../data/faqs";
import PageWrapper from "../components/PageWrapper";

export default function QA() {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [category, setCategory] = useState("All");

  const toggle = (id: number) => {
    setActiveId(activeId === id ? null : id);
  };

  const filtered = faqsData.filter((faq) =>
    category === "All" ? true : faq.category === category
  );

  return (
    <PageWrapper>
    <div className="p-4 max-w-4xl mx-auto">
      
      <h1 className="text-3xl font-bold mb-6 text-center">
        Q&A
      </h1>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        {["All", "Getting Started", "Patching", "Emulators", "Cheats"].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded ${
              category === cat
                ? "bg-red-500"
                : "bg-gray-800 hover:bg-gray-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* FAQ List */}
      <div className="space-y-4">
        {filtered.map((faq) => (
          <div
            key={faq.id}
            className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden"
          >
            
            {/* Question */}
            <button
              onClick={() => toggle(faq.id)}
              className="w-full text-left p-4 font-semibold flex justify-between items-center"
            >
              {faq.question}
              <span>{activeId === faq.id ? "-" : "+"}</span>
            </button>

            {/* Answer */}
            {activeId === faq.id && (
              <div className="p-4 text-gray-400 border-t border-gray-800">
                {faq.answer}
              </div>
            )}

          </div>
        ))}
      </div>

    </div>
    </PageWrapper>
  );
}