import React from "react";
import { Link } from "react-router-dom";
import {
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

const Home = () => {
  const features = [
    {
      icon: <CalendarIcon className="h-8 w-8 text-blue-600" />,
      title: "Smart Scheduling",
      description:
        "AI-powered scheduling that finds the optimal time for all participants based on their availability and preferences.",
    },
    {
      icon: <ClockIcon className="h-8 w-8 text-blue-600" />,
      title: "Time Zone Management",
      description:
        "Automatically handles different time zones, so you never have to worry about conversion or confusion.",
    },
    {
      icon: <UserGroupIcon className="h-8 w-8 text-blue-600" />,
      title: "Calendar Integration",
      description:
        "Seamlessly integrates with Google Calendar and Microsoft Outlook to sync all your events in one place.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Hero Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Smart Calendar
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            AI-powered scheduling assistant that automatically finds the best
            time slots for meetings based on everyone's availability.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/calendar"
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition duration-200 flex items-center justify-center gap-2"
            >
              View Calendar
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
            <Link
              to="/meetings/new"
              className="bg-white hover:bg-gray-50 text-blue-600 border border-blue-600 py-3 px-6 rounded-lg font-medium transition duration-200"
            >
              Schedule Meeting
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section
      <div className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div> */}

      {/* How It Works Section */}
      <div className="bg-blue-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Connect Your Calendars
              </h3>
              <p className="text-gray-600">
                Link your Google and Microsoft calendars to sync all your
                events.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Set Your Preferences
              </h3>
              <p className="text-gray-600">
                Define your working hours, buffer times, and scheduling
                priorities.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Schedule with AI
              </h3>
              <p className="text-gray-600">
                Let our AI find the optimal meeting times based on everyone's
                availability.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who save time with Smart Calendar's
            AI-powered scheduling.
          </p>
          <Link
            to="/calendar"
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-8 rounded-lg font-medium transition duration-200 inline-block"
          >
            Get Started Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
