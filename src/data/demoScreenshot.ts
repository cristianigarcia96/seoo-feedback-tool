// A self-contained stand-in for a real captured screenshot: an SVG rendering of
// the "Wool&Rest" demo page at CAPTURE_WIDTH. Lets the app demonstrate real
// image-slicing over a real raster-like source with zero backend. In production
// this URL is a PNG in Supabase Storage produced by the capture edge function.

import { CAPTURE_WIDTH } from "@/lib/types";

export const DEMO_SCREENSHOT_HEIGHT = 1204;

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${CAPTURE_WIDTH}" height="${DEMO_SCREENSHOT_HEIGHT}" viewBox="0 0 ${CAPTURE_WIDTH} ${DEMO_SCREENSHOT_HEIGHT}" font-family="Inter, sans-serif">
  <!-- header -->
  <rect x="0" y="0" width="900" height="74" fill="#ffffff"/>
  <line x1="0" y1="74" x2="900" y2="74" stroke="#e7e5e4"/>
  <text x="40" y="44" font-family="Fraunces, serif" font-size="20" fill="#292524">Wool&amp;Rest</text>
  <text x="360" y="42" font-size="13" fill="#78716c">Shop</text>
  <text x="440" y="42" font-size="13" fill="#78716c">Our Wool</text>
  <text x="540" y="42" font-size="13" fill="#78716c">Reviews</text>
  <text x="640" y="42" font-size="13" fill="#78716c">Journal</text>
  <rect x="790" y="26" width="70" height="26" rx="2" fill="#292524"/>
  <text x="800" y="43" font-size="10" fill="#ffffff" letter-spacing="1">CART (0)</text>

  <!-- hero -->
  <rect x="0" y="74" width="900" height="260" fill="#EAE3D6"/>
  <text x="450" y="130" font-size="10" fill="#78716c" text-anchor="middle" letter-spacing="3">NEW SEASON</text>
  <text x="450" y="180" font-family="Fraunces, serif" font-size="30" fill="#292524" text-anchor="middle">Wool bedding, the way it used to be made.</text>
  <text x="450" y="214" font-size="13" fill="#78716c" text-anchor="middle">Naturally temperature-regulating. Sourced from small British farms.</text>
  <rect x="390" y="248" width="120" height="40" rx="2" fill="#292524"/>
  <text x="450" y="273" font-size="11" fill="#ffffff" text-anchor="middle" letter-spacing="1">SHOP DUVETS</text>

  <!-- product cards -->
  <rect x="0" y="334" width="900" height="200" fill="#ffffff"/>
  <rect x="60" y="364" width="240" height="140" rx="3" fill="#f5f5f4"/>
  <text x="180" y="438" font-size="11" fill="#a8a29e" text-anchor="middle">Product card 1</text>
  <rect x="330" y="364" width="240" height="140" rx="3" fill="#f5f5f4"/>
  <text x="450" y="438" font-size="11" fill="#a8a29e" text-anchor="middle">Product card 2</text>
  <rect x="600" y="364" width="240" height="140" rx="3" fill="#f5f5f4"/>
  <text x="720" y="438" font-size="11" fill="#a8a29e" text-anchor="middle">Product card 3</text>

  <!-- trust bar -->
  <rect x="0" y="534" width="900" height="110" fill="#292524"/>
  <text x="150" y="594" font-size="11" fill="#d6d3d1" text-anchor="middle" letter-spacing="1">30-NIGHT TRIAL</text>
  <text x="375" y="594" font-size="11" fill="#d6d3d1" text-anchor="middle" letter-spacing="1">FREE UK DELIVERY</text>
  <text x="600" y="594" font-size="11" fill="#d6d3d1" text-anchor="middle" letter-spacing="1">GOTS CERTIFIED</text>
  <text x="800" y="594" font-size="11" fill="#d6d3d1" text-anchor="middle" letter-spacing="1">5-YEAR GUARANTEE</text>

  <!-- story -->
  <rect x="0" y="644" width="900" height="240" fill="#FBF8F2"/>
  <rect x="64" y="674" width="368" height="180" rx="3" fill="#e7e5e4"/>
  <text x="248" y="768" font-size="11" fill="#a8a29e" text-anchor="middle">Farm photo</text>
  <text x="470" y="700" font-size="10" fill="#78716c" letter-spacing="3">OUR STORY</text>
  <text x="470" y="734" font-family="Fraunces, serif" font-size="22" fill="#292524">Small farms. Honest wool.</text>
  <text x="470" y="768" font-size="12" fill="#78716c">We work directly with under 40 family farms across the</text>
  <text x="470" y="788" font-size="12" fill="#78716c">Yorkshire Dales, paying above market rate for wool that</text>
  <text x="470" y="808" font-size="12" fill="#78716c">meets our welfare standards.</text>

  <!-- reviews -->
  <rect x="0" y="884" width="900" height="180" fill="#ffffff"/>
  <line x1="0" y1="884" x2="900" y2="884" stroke="#f5f5f4"/>
  <text x="450" y="924" font-size="10" fill="#a8a29e" text-anchor="middle" letter-spacing="3">WHAT CUSTOMERS SAY</text>
  <rect x="150" y="948" width="180" height="90" rx="3" fill="#fafaf9"/>
  <rect x="360" y="948" width="180" height="90" rx="3" fill="#fafaf9"/>
  <rect x="570" y="948" width="180" height="90" rx="3" fill="#fafaf9"/>
  <text x="240" y="998" font-size="10" fill="#a8a29e" text-anchor="middle">Review 1</text>
  <text x="450" y="998" font-size="10" fill="#a8a29e" text-anchor="middle">Review 2</text>
  <text x="660" y="998" font-size="10" fill="#a8a29e" text-anchor="middle">Review 3</text>

  <!-- footer -->
  <rect x="0" y="1064" width="900" height="140" fill="#1c1917"/>
  <text x="450" y="1138" font-size="11" fill="#78716c" text-anchor="middle">© Wool&amp;Rest — footer content</text>
</svg>`.trim();

export const DEMO_SCREENSHOT_URL = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
