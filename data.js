/* Prepped. product data. One source for both pages.
   Every price and quantity here is a placeholder for the mock-up. */
window.PREPPED = {
  days: 14,

  /* Pack price by household size (USD). */
  sizes: [
    { people: 1, price: 895,  name: "For one" },
    { people: 2, price: 1495, name: "For two" },
    { people: 3, price: 1995, name: "For three" },
    { people: 4, price: 2395, name: "For four" }
  ],

  /* The Core: one per pack, shared by the household. */
  core: [
    { id: "water", name: "Water", line: "Filter and carriers",
      items: ["Gravity filter, good for 1,500 gallons", "Two 5 gallon collapsible carriers", "Purification tablets, 100", "Fill and rotate guide"] },
    { id: "aid", name: "First aid", line: "120 pieces",
      items: ["Wound care and dressings", "Trauma pad and tourniquet", "Pain, allergy and stomach relief", "Gloves, shears, tweezers", "Plain-words first aid card"] },
    { id: "light", name: "Light", line: "Lantern and headlamps",
      items: ["Rechargeable lantern, 200 hours on low", "One headlamp per person", "12 hour candles, 6", "Stormproof matches"] },
    { id: "power", name: "Power", line: "Radio and battery",
      items: ["Hand crank and solar weather radio", "20,000 mAh battery", "Cables for every phone", "Spare cells for the headlamps"] },
    { id: "warmth", name: "Warmth", line: "Blankets and cover",
      items: ["One wool blend blanket per person", "One thermal bivvy per person", "Rain ponchos", "Hand warmers, 20 pairs"] },
    { id: "clean", name: "Clean", line: "Toilet and wash kit",
      items: ["Folding toilet with liners for 14 days", "Soap, wipes and towels", "Toothbrush kit per person", "Masks and waste bags"] },
    { id: "tools", name: "Tools", line: "The useful dozen",
      items: ["Multi-tool", "Gas and water shut-off wrench", "Work gloves, 2 pairs", "Duct tape and cord", "Whistle per person", "Folding stove with fuel for 14 days"] },
    { id: "papers", name: "Papers", line: "Guide and pouch",
      items: ["The Guide: what to do, day by day", "Waterproof document pouch", "Contact cards to fill in", "Local map sleeve and pencil"] }
  ],

  /* One Ration case per person. */
  ration: {
    id: "ration", name: "Ration", line: "14 days, one person",
    items: ["42 meals, just add water", "2,100 calories a day", "14 snack and drink packs", "Sealed water for the first 3 days", "Bowl, cup and utensils"]
  },

  /* Add-on modules. perPerson: priced per person in the household. */
  addons: [
    { id: "more-food", name: "Two more weeks", price: 245, perPerson: true,
      line: "A second Ration case each. Four weeks in all.",
      items: ["42 more meals per person", "14 more snack and drink packs", "Same 25 year shelf life"] },
    { id: "water-store", name: "Water store", price: 185, perPerson: false,
      line: "Four stackable 7 gallon tanks with treatment drops.",
      items: ["Four 7 gallon stacking tanks", "Spigot and fill hose", "Treatment drops for a 5 year fill"] },
    { id: "power-plus", name: "Power station", price: 695, perPerson: false,
      line: "Runs a fridge, a router or a CPAP. Recharges from the sun.",
      items: ["1,000 Wh power station", "100 W folding solar panel", "Extension lead and car cable"] },
    { id: "medical", name: "Medical", price: 265, perPerson: false,
      line: "A deeper first aid module, built with ER nurses.",
      items: ["Splints and wraps", "Burn and bleed kits", "Pulse oximeter and thermometer", "30 day prescription organiser"] },
    { id: "pets", name: "Pets", price: 145, perPerson: false,
      line: "Two weeks of food and water for one dog or cat.",
      items: ["14 days of sealed food", "Collapsible bowls", "Lead, waste bags and blanket", "Pet first aid card"] },
    { id: "comms", name: "Comms", price: 385, perPerson: false,
      line: "Stay in touch when the towers are down.",
      items: ["Two long range radios", "Satellite text messenger", "Spare batteries and chargers"] }
  ],

  money: function (n) { return "$" + n.toLocaleString("en-US"); },

  /* Total for a household size and a list of add-on ids. */
  total: function (people, addonIds) {
    var P = window.PREPPED;
    var size = P.sizes.filter(function (s) { return s.people === people; })[0];
    var sum = size ? size.price : 0;
    (addonIds || []).forEach(function (id) {
      var a = P.addons.filter(function (x) { return x.id === id; })[0];
      if (a) sum += a.perPerson ? a.price * people : a.price;
    });
    return sum;
  }
};
