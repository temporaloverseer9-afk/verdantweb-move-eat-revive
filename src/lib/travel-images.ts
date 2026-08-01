import johorBahru from "@/assets/travel/johor-bahru.jpg";
import batam from "@/assets/travel/batam.jpg";
import bintan from "@/assets/travel/bintan.jpg";
import desaru from "@/assets/travel/desaru.jpg";
import melaka from "@/assets/travel/melaka.jpg";
import kualaLumpur from "@/assets/travel/kuala-lumpur.jpg";
import penang from "@/assets/travel/penang.jpg";
import pulauUbin from "@/assets/travel/pulau-ubin.jpg";
import coneyIsland from "@/assets/travel/coney-island.jpg";
import southernRidges from "@/assets/travel/southern-ridges.jpg";
import sungeiBuloh from "@/assets/travel/sungei-buloh.jpg";
import stJohns from "@/assets/travel/st-johns.jpg";
import macritchie from "@/assets/travel/macritchie.jpg";
import changiPoint from "@/assets/travel/changi-point.jpg";

/** Cover photo per destination id. */
export const TRAVEL_IMAGES: Record<string, string> = {
  "johor-bahru": johorBahru,
  batam,
  bintan,
  desaru,
  melaka,
  "kuala-lumpur": kualaLumpur,
  penang,
  "pulau-ubin": pulauUbin,
  "coney-island": coneyIsland,
  "southern-ridges": southernRidges,
  "sungei-buloh": sungeiBuloh,
  "st-johns": stJohns,
  macritchie,
  "changi-point": changiPoint,
};

/** Google Maps place link (shows the location plus its photos). */
export function googleMapsUrl(name: string, country: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${country}`)}`;
}
