import renderedCertificates from "./certificateImages.json";

export const workCategories = [
  {
    id: "food",
    title: "Food and meat processing",
    text: "Wash-down of processing rooms, lines and floors. This is the work the company wants to be known for.",
  },
  {
    id: "plant",
    title: "Equipment and high-level wash",
    text: "Machinery, conveyors and the overhead plant, including work from a lift.",
  },
  {
    id: "amenities",
    title: "Offices and staff amenities",
    text: "Lunch rooms, offices and change areas that sit with a food plant.",
  },
];

export const certificates = [
  {
    title: "Basic Chemical Awareness",
    issuer: "Chemform",
    person: "Kinley Tshering",
    date: "11 September 2026",
    image: "/certificates/chemform-chemical-awareness.jpg",
    file: "/certificates/chemform-chemical-awareness.jpg",
  },
  {
    title: "Chemical Safety and Handling",
    issuer: "Environex International",
    person: "Tshering Choden, Comprehensive Cleaning",
    date: "20 December 2024",
    file: "/certificates/environex-chemical-safety.pdf",
  },
  {
    title: "Chemical and Safety Awareness",
    issuer: "Able Westchem",
    person: "Arulraj Alakaiya, Comprehensive Cleaning",
    date: "28 June 2025",
    file: "/certificates/able-westchem-chemical-safety.pdf",
  },
  {
    title: "Provide First Aid",
    issuer: "St John Ambulance Western Australia",
    person: "David Simpson",
    date: "Issued 11 July 2023",
    detail: "HLTAID011 Provide First Aid, HLTAID010 Provide basic emergency life support, HLTAID009 Provide cardiopulmonary resuscitation.",
    file: "/certificates/st-john-first-aid.pdf",
  },
].map((item) => {
  const fileName = (item.file || "").split("/").pop() || "";
  const stem = fileName.replace(/\.pdf$/i, "");
  const images = fileName.endsWith(".pdf") && renderedCertificates[stem]?.length
    ? renderedCertificates[stem]
    : (item.image ? [item.image] : []);
  return { ...item, images, image: images[0] || "" };
});

export const workPhotos = [
  { src: "/work/food/food-01.jpg", category: "food", alt: "Foam wash on a food-processing floor" },
  { src: "/work/food/food-02.jpg", category: "food", alt: "A crew member washing production equipment" },
  { src: "/work/food/food-03.jpg", category: "food", alt: "Wash-down along a processing line" },
  { src: "/work/food/food-04.jpg", category: "food", alt: "Sanitation of a food-plant room" },
  { src: "/work/food/food-05.jpg", category: "food", alt: "High-pressure clean of stainless plant" },
  { src: "/work/food/food-06.jpg", category: "food", alt: "A processing area during the clean" },
  { src: "/work/food/food-07.jpg", category: "food", alt: "Foam wash on a food-processing floor" },
  { src: "/work/food/food-08.jpg", category: "food", alt: "A crew member washing production equipment" },
  { src: "/work/food/food-09.jpg", category: "food", alt: "Wash-down along a processing line" },
  { src: "/work/food/food-10.jpg", category: "food", alt: "Sanitation of a food-plant room" },
  { src: "/work/food/food-11.jpg", category: "food", alt: "High-pressure clean of stainless plant" },
  { src: "/work/food/food-12.jpg", category: "food", alt: "A processing area during the clean" },
  { src: "/work/plant/plant-01.jpg", category: "plant", alt: "High-level wash from a scissor lift" },
  { src: "/work/plant/plant-02.jpg", category: "plant", alt: "Foam on production machinery" },
  { src: "/work/plant/plant-03.jpg", category: "plant", alt: "Cleaning overhead plant in a processing room" },
  { src: "/work/plant/plant-04.jpg", category: "plant", alt: "A conveyor and equipment wash" },
  { src: "/work/plant/plant-05.jpg", category: "plant", alt: "Machinery covered for a sanitation wash" },
  { src: "/work/plant/plant-06.jpg", category: "plant", alt: "Detail work on food-plant equipment" },
  { src: "/work/plant/plant-07.jpg", category: "plant", alt: "High-level wash from a scissor lift" },
  { src: "/work/plant/plant-08.jpg", category: "plant", alt: "Foam on production machinery" },
  { src: "/work/plant/plant-09.jpg", category: "plant", alt: "Cleaning overhead plant in a processing room" },
  { src: "/work/plant/plant-10.jpg", category: "plant", alt: "A conveyor and equipment wash" },
  { src: "/work/plant/plant-11.jpg", category: "plant", alt: "Machinery covered for a sanitation wash" },
  { src: "/work/plant/plant-12.jpg", category: "plant", alt: "Detail work on food-plant equipment" },
  { src: "/work/amenities/amenities-01.jpg", category: "amenities", alt: "Cleaning a staff lunch room" },
  { src: "/work/amenities/amenities-02.jpg", category: "amenities", alt: "An office area on a sanitation round" },
  { src: "/work/amenities/amenities-03.jpg", category: "amenities", alt: "Staff amenities after the production areas" },
  { src: "/work/amenities/amenities-04.jpg", category: "amenities", alt: "A boot and change area" },
  { src: "/work/amenities/amenities-05.jpg", category: "amenities", alt: "Tables and floors in a staff room" },
  { src: "/work/amenities/amenities-06.jpg", category: "amenities", alt: "Cleaning a staff lunch room" },
  { src: "/work/amenities/amenities-07.jpg", category: "amenities", alt: "An office area on a sanitation round" },
  { src: "/work/amenities/amenities-08.jpg", category: "amenities", alt: "Staff amenities after the production areas" },
  { src: "/work/amenities/amenities-09.jpg", category: "amenities", alt: "A boot and change area" },
  { src: "/work/amenities/amenities-10.jpg", category: "amenities", alt: "Tables and floors in a staff room" },
];
