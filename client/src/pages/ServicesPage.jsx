import React from "react";
import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa";

const SERVICES = [
  { icon: "📏", title: "BMI Calculator", desc: "Check your Body Mass Index", path: "/services/bmi" },
  { icon: "🔥", title: "Calorie Detector", desc: "Estimate daily calories", path: "/services/calories" },
  { icon: "🍽️", title: "Meal Planner", desc: "Plan healthy meals", path: "/services/meal-planner" },
  { icon: "🚶", title: "Step Counter", desc: "Track your steps", path: "/services/steps" },
];

const ServicesPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">More Services</h1>
          <p className="text-gray-600 mt-1">Professional tools to support your fitness journey</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((svc, idx) => (
            <motion.div
              key={svc.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden"
            >
              <div className="p-6">
                <div className="text-4xl mb-3">{svc.icon}</div>
                <h3 className="text-xl font-bold text-gray-900">{svc.title}</h3>
                <p className="text-gray-600 mt-1">{svc.desc}</p>
                <div className="mt-5">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-full"
                  >
                    Open
                    <FaArrowRight className="text-xs" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ServicesPage;
