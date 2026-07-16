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
    // Missing state UI
    missingTitle: "No trip information found",
    missingDescription: "Enter your trip details before starting the budget planner.",
    missingButton: "Enter Trip Details",
    // Invalid state UI
    invalidTitle: "Unable to load trip information",
    invalidDescription: "The saved trip information is invalid. Please enter your trip details again.",
    invalidButton: "Re-enter Trip Details",
    // Calculation Error UI
    calculationErrorTitle: "Unable to calculate budget",
    calculationErrorDescription: "Please verify your trip parameters and try again.",
    calculationErrorButton: "Verify Trip Details",

    // Left workspace
    workspaceTitle: "Build Your Korea Travel Budget",
    workspaceDescription: "Review each travel category and adjust your budget plan step by step.",
    editTripDetails: "Edit Trip Details",

    // Receipt
    receiptTitle: "My Korea Trip Receipt",
    statusDraft: "Draft",
    budgetStyle: "Budget Style",
    targetBudget: "Target Budget",
    currentEstimate: "Current Estimate",
    budgetUsage: "Budget Usage",
    remainingBudget: "Remaining Budget",
    overBudget: "Over Budget",
    tripWideExpenses: "Trip-wide Expenses",
    intercityTransportation: "Intercity Transportation",
    estimatedTotal: "Estimated Total",
    perTraveler: "Per Traveler",
    dailyAverage: "Daily Average",
    mockDisclaimer: "These estimates use the MVP Mock Price Catalog and are not actual prices.",
    saveTrip: "Save Trip",
    shareReceipt: "Share Receipt",
    generateReport: "Generate Budget Report",
    notYetAvailable: "This feature is not yet available.",

    // Active Category Content
    accommodationTitle: "Stay Budget",
    accommodationDescription: "The accommodation budget automatically selected based on your trip details and budget tier.",
    accommodationNotice: "You can customize accommodation options here to balance your total budget.",

    // Stay override cards UI
    selectStayTitle: "Select Accommodation Type by City",
    selectStayDescription: "Select the accommodation tier for each city. Your budget will update instantly.",
    resetToRecommended: "Reset to Recommended Stay",

    // Accommodation Basket card descriptions
    budgetStayDesc: "Affordable and convenient guesthouses or budget hostels",
    standardHotelDesc: "Reliable 3-star business hotels with reasonable pricing",
    premiumHeritageDesc: "Traditional Hanok stay or high-end 5-star luxury hotels",

    foodTitle: "Food Budget",
    foodDescription: "The food budget plan configured for your trip parameters and budget tier.",
    foodNotice: "This food budget is a temporary estimate and will be replaced by detailed meal plans later.",
    foodMealPlan: "Food Meal Plan",
    readOnlyNotice: "Read only",
    dayLabel: "Day",
    mealSlotBreakfast: "Breakfast",
    mealSlotLunch: "Lunch",
    mealSlotDinner: "Dinner",
    mealSlotSnack: "Snack & Cafe",
    baseMealLabel: "Base meal",
    selectedReplacement: "Selected replacement",
    addOnsLabel: "Add-ons",
    includedInBase: "Included in base budget",
    notIncludedInBase: "Not included in base budget",
    wishlistCollectionsTitle: "Wishlist collections",
    emptyMealPlanNotice: "No meal plan data available for this city.",
    excludedSelectionNotice: "Budget has excluded selections",
    noWishlistCandidates: "No recommendations available.",
    selectReplacementButton: "Select",
    changeReplacementButton: "Change to this",
    restoreBaseMealButton: "Restore to Base",
    unsupportedPriceUnitLabel: "Pricing unit not supported",
    saveFailedNotice: "Failed to save preferences.",
    orphanAddOnWarning: "Please reselect the parent food item for your previously chosen options or clear them.",

    transportTitle: "Transportation Budget",
    transportDescription: "Includes local transit allowances within cities and intercity transit between cities.",
    transportNotice: "Intercity KTX transit is automatically included for multi-city trip options.",

    attractionsTitle: "Attractions Budget",
    attractionsDescription: "The sightseeing and experiences budget based on your trip parameters and budget tier.",
    attractionsNotice: "Attractions budget is calculated per traveler rather than per night.",

    emergencyTitle: "Emergency Fund",
    emergencyDescription: "A fallback fund designed to handle unexpected occurrences during your stay.",
    emergencyNotice: "Applied as a one-time fixed amount for the entire duration of the trip.",

    // Category labels
    categoryStay: "Stay",
    categoryFood: "Food",
    categoryTransport: "Transport",
    categoryAttraction: "Attractions",
    categoryEmergency: "Emergency Fund",

    // Pricing units
    unitRoomNight: "Room/Night",
    unitPersonDay: "Per Person/Day",
    unitPersonMeal: "Per Person/Meal",
    unitPersonOneWay: "Per Person/One-Way",
    unitPerPerson: "Per Person",
    unitFixedAmount: "Fixed Amount",
    unitPercentage: "Percentage",

    // General labels
    representativePrice: "Representative Price",
    priceRange: "Price Range",
    pricingUnit: "Unit",
    nightsLabel: "Nights",
    roomCountLabel: "Rooms",
    totalLabel: "Total",
    badgeMock: "MOCK",
    updatedAtLabel: "Updated Date",
    sourceLabelText: "Source",
    allTabs: "All",
  },
  placeholder: {
    notImplemented: "This page will be implemented in the next development phase.",
  },
};
