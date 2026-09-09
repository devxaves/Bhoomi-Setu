"use client";
import image1 from "../../public/images/pic1.jpg"
import image2 from "../../public/images/pic2.jpg"
import image3 from "../../public/images/pic3.jpg"
import image4 from "../../public/images/pic4.jpg"
import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";

const FRALandingPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const { isSignedIn, user } = useUser();

  useEffect(() => {
    setIsClient(true);

    // Auto-rotate carousel
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 4);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Carousel slides data
  const carouselSlides = [
    {
      title: "Digitizing Forest Rights",
      description: "Transforming legacy records into actionable digital insights",
      image: image1, // Replace with actual image path
      color: "from-orange-400 to-orange-600"
    },
    {
      title: "AI-Powered Asset Mapping",
      description: "Satellite imagery analysis for accurate resource mapping",
      image: "/images/pic2.jpg", // Replace with actual image path
      color: "from-green-500 to-green-700"
    },
    {
      title: "Interactive FRA Atlas",
      description: "Visualize forest rights data with our WebGIS platform",
      image: "/images/pic3.jpg", // Replace with actual image path
      color: "from-orange-400 to-green-600"
    },
    {
      title: "Decision Support System",
      description: "Optimize scheme implementation for tribal communities",
      image: "/images/pic4.jpg", // Replace with actual image path
      color: "from-green-400 to-orange-600"
    }
  ];

  // Feature cards data
  const featureCards = [
    {
      title: "Data Digitization",
      description: "AI-powered extraction and standardization of legacy FRA records",
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: "bg-orange-100 text-orange-700"
    },
    {
      title: "Asset Mapping",
      description: "Computer vision on satellite imagery to detect resources",
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
      color: "bg-green-100 text-green-700"
    },
    {
      title: "WebGIS Integration",
      description: "Interactive visualization of spatial and socio-economic data",
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: "bg-orange-100 text-orange-700"
    },
    {
      title: "Decision Support System",
      description: "AI-enhanced recommendations for scheme implementation",
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      color: "bg-green-100 text-green-700"
    }
  ];

  // Stats data
  const stats = [
    { value: "10K+", label: "Documents Processed" },
    { value: "200+", label: "Villages Covered" },
    { value: "15", label: "District Implementations" },
    { value: "5", label: "States Served" }
  ];

  return (
    <div className="min-h-screen min-w-screen">
      {/* Navigation */}
      {/* <nav className="fixed w-full bg-white shadow-md z-50">
        <div className="container mx-auto px-6 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">FRA</span>
            </div>
            <span className="text-xl font-bold text-gray-800">FRA Digitalization</span>
          </Link>

          <div className="hidden md:flex space-x-8">
            <a href="#features" className="text-gray-600 hover:text-orange-500 transition">Features</a>
            <a href="#benefits" className="text-gray-600 hover:text-orange-500 transition">Benefits</a>
            <a href="#technology" className="text-gray-600 hover:text-orange-500 transition">Technology</a>
            <a href="#contact" className="text-gray-600 hover:text-orange-500 transition">Contact</a>
          </div>

          <div className="flex items-center space-x-4">
            {isClient && isSignedIn ? (
              <>
                <Link href="/dashboard" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition">
                  Dashboard
                </Link>
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <Link href="/sign-in" className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav> */}

      {/* Hero Carousel Section */}
      <section className="relative h-screen">
        <div className="absolute inset-0 overflow-hidden">
          {carouselSlides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${slide.color} opacity-80`}></div>
              <div className="absolute inset-0 bg-black opacity-30"></div>
              {/* In a real implementation, you would use an actual image here */}
              <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">Placeholder for image</span>
              </div>
            </div>
          ))}
        </div>

        <div className="relative h-full flex items-center justify-center text-center px-6">
          <div className="max-w-4xl mx-auto text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {carouselSlides[currentSlide].title}
            </h1>
            <p className="text-xl md:text-2xl mb-8">
              {carouselSlides[currentSlide].description}
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href={isClient && isSignedIn ? "/dashboard" : "/sign-up"}
                className="px-8 py-3 bg-orange-500 text-white rounded-lg text-lg font-semibold hover:bg-orange-600 transition shadow-lg"
              >
                Get Started
              </Link>
              <a
                href="#features"
                className="px-8 py-3 bg-white bg-opacity-20 text-white rounded-lg text-lg font-semibold hover:bg-opacity-30 transition backdrop-blur-sm"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>

        {/* Carousel indicators */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-3">
          {carouselSlides.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full ${index === currentSlide ? 'bg-white' : 'bg-white bg-opacity-50'}`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Animated SVG elements */}
        <div className="absolute top-20 left-10 opacity-20 animate-pulse">
          <svg width="100" height="100" viewBox="0 0 100 100" className="text-green-500">
            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M30,50 A20,20 0 1,1 70,50 A20,20 0 1,1 30,50" fill="currentColor" opacity="0.3" />
          </svg>
        </div>

        <div className="absolute bottom-20 right-10 opacity-20 animate-bounce">
          <svg width="80" height="80" viewBox="0 0 100 100" className="text-orange-500">
            <polygon points="50,15 70,55 30,55" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.3" />
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-green-50 to-orange-50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-green-700 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Platform Features</h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Our comprehensive solution addresses all aspects of Forest Rights Act implementation through cutting-edge technology
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            {featureCards.map((card, index) => (
              <div key={index} className={`p-8 rounded-xl shadow-lg transition-transform hover:scale-105 ${card.color}`}>
                <div className="mb-6">
                  {card.icon}
                </div>
                <h3 className="text-2xl font-semibold mb-4">{card.title}</h3>
                <p className="text-gray-700">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="technology" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Advanced Technology Stack</h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Leveraging the latest advancements in AI, GIS, and cloud computing
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">AI & Machine Learning</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• Computer Vision for satellite imagery</li>
                <li>• NLP for document processing</li>
                <li>• Predictive analytics</li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Geospatial Technology</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• WebGIS integration</li>
                <li>• Satellite imagery processing</li>
                <li>• Spatial data analysis</li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Cloud Infrastructure</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• Secure data storage</li>
                <li>• Scalable processing</li>
                <li>• Real-time collaboration</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-green-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Forest Rights Management?</h2>
          <p className="text-xl mb-10 max-w-3xl mx-auto">
            Join us in our mission to digitize and streamline the implementation of the Forest Rights Act
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              href={isClient && isSignedIn ? "/dashboard" : "/sign-up"}
              className="px-8 py-3 bg-white text-orange-600 rounded-lg text-lg font-semibold hover:bg-gray-100 transition shadow-lg"
            >
              Get Started Now
            </Link>
            <a
              href="#contact"
              className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg text-lg font-semibold hover:bg-white hover:bg-opacity-10 transition"
            >
              Request a Demo
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">FRA Digitalization</h3>
              <p className="text-gray-400">
                Transforming forest rights management through technology innovation
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white transition">Features</a></li>
                <li><a href="#technology" className="text-gray-400 hover:text-white transition">Technology</a></li>
                <li><a href="#contact" className="text-gray-400 hover:text-white transition">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">API</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Support</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
              <address className="text-gray-400 not-italic">
                <p>Email: info@fradigital.org</p>
                <p>Phone: +91 9876543210</p>
                <p>New Delhi, India</p>
              </address>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} FRA Digitalization Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FRALandingPage;