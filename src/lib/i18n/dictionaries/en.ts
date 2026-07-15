import { Dictionary } from "./ko";

export const en: Dictionary = {
  common: {
    title: "HypeHeritage - Korea Travel Budget Planner",
    logoAlt: "HypeHeritage Logo",
    userAccount: "User Account",
  },
  navigation: {
    planner: "Travel Budget Planner",
    trend: "K-Trend",
    guide: "K-Guide",
    savedTrips: "Saved Trips",
  },
  footer: {
    copyright: "© 2026 HypeHeritage",
    about: "About",
    terms: "Terms",
    privacy: "Privacy",
    country: "South Korea",
  },
  landing: {
    heading: "HypeHeritage",
    tagline: "Choose like a local. Budget with confidence.",
    cta: "Build My Korea Budget",
    helper: "Create your first trip budget without payment.",
    status: "The Korea travel budget planner is being prepared.",
    nextPhase: "The landing page will be implemented in the next phase.",
    allocationSeoulBusan: "Seoul {seoul} nights · Busan {busan} nights",
    allocationSeoulOnly: "Seoul {seoul} nights",
    allocationBusanOnly: "Busan {busan} nights",
    validation: {
      invalidNights: "Stay duration must be 3, 5, or 7 nights.",
      invalidAdults: "Travelers count must be between 1 and 4.",
      noCities: "At least one city must be selected.",
      invalidTargetBudget: "Target budget must be a positive integer.",
      saveFailed: "Failed to save the trip plan due to a temporary storage error.",
    },
  },
  planner: {
    missingState: "No trip budget parameters found. Please configure your trip on the landing page first.",
    goBack: "Go to Landing",
    title: "Travel Budget Planner",
    status: "Successfully loaded trip parameters:",
  },
  placeholder: {
    notImplemented: "This page will be implemented in the next development phase.",
  },
};
