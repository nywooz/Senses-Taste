For a #30DayMapChallenge repository, a great README.md makes it easy for recruiters, mappers, and developers to understand the project in 10 seconds and run it locally without friction.
The essentials to include:
Hero section — Title, Day 23 theme badge, a short screenshot or looping GIF, and your live demo link.
Overview & Key Features — Dual map engine (Google Maps + Three.js 3D Globe), taste filters, Presenter Mode, Atlas Index, and Flavor Matrix.
Methodology & Open Data — Explain the 5 sensory axes (Umami, Spicy, Sweet, Sour, Savory) and public culinary/cartographic references (Natural Earth 110m, UNESCO, EU PDO/PGI, FAO).
Controls & Keyboard Shortcuts — Handy for anyone recording a demo or testing Presenter Mode.
Tech Stack & Local Setup — Exact npm commands and how to configure VITE_GOOGLE_MAPS_API_KEY.
Ready-to-paste README.md
Markdown
# FlavorAtlas — Cartography of Global Taste

> **#30DayMapChallenge · Day 23 · Theme: Senses — Taste**

An interactive web-mapping and 3D globe application that visualizes **32 regional signature dishes across six continents** by their five-axis taste chemistry (**Umami, Spicy, Sweet, Sour, and Savory**).

🔗 **Live Demo:** [Add your deployed URL here]

![FlavorAtlas Preview](./docs/preview.png) <!-- Replace with a screenshot or GIF -->

---

## ✨ Key Features

- **Dual Map Engine (`Google Maps` | `3D Globe`)**
  - **Google Maps Platform**: Interactive dark vector, satellite, and terrain base maps with custom sensory `AdvancedMarker` columns, geodesic culinary connection arcs, and aroma halos.
  - **Three.js 3D WebGL Globe**: Custom equirectangular PBR earth textures, Fresnel atmosphere shader, Natural Earth 110m vector borders, 3D intensity columns, curved heritage arcs with animated pulse beads, and instanced aroma particles.
- **Automated Presenter Mode**
  - Hands-free guided tour (7.5s dwell per hotspot) that pans/rotates across dishes, highlights sensory towers and connected routes, and opens spotlight cards automatically.
- **5-Axis Taste Filtering & Chemistry**
  - Filter hotspots live by **All**, **Umami**, **Spicy**, **Sweet**, **Sour**, or **Savory**.
- **Analytical & Directory Views**
  - **Atlas Index**: Searchable, continent-filterable, and sortable catalog of all 32 regional dishes (including England, Scotland, Wales, and Northern Ireland).
  - **Flavor Matrix**: Side-by-side 5-axis SVG radar comparison between any two dishes plus continental taste averages.
  - **Challenge Notes**: Methodology, data attribution, and presentation shortcuts.

---

## 🧪 Data & Methodology

- **Culinary Registry**: 32 regional dishes inspired by public gastronomic and cultural heritage references including **UNESCO Intangible Cultural Heritage Lists**, **EU PDO/PGI Geographical Indications**, and **FAO regional crop traditions**.
- **Sensory Model**: Each dish is scored (`0–100`) across five chemical flavor dimensions:
  - **Umami** (glutamates & fermentation)
  - **Spicy** (capsaicinoids & pungent aromatics)
  - **Sweet** (sugars & caramelization)
  - **Sour** (organic acids & citrus/ferments)
  - **Savory** (Maillard compounds, lipids & herbal salinity)
- **Cartography**: Vector boundaries and coastline geometry derived from **Natural Earth (`world-atlas` 110m)** via `topojson-client`.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `Space` | Start / Pause Presenter Mode |
| `←` / `→` | Step to Previous / Next dish |
| `1` – `6` | Switch Taste Filter (`All`, `Umami`, `Spicy`, `Sweet`, `Sour`, `Savory`) |
| `H` | Hide / Show HUD controls (Zen Mode) |
| `Esc` | Clear selected dish or return to Map View |

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Motion, Lucide Icons
- **2D / Web Mapping**: Google Maps Platform (`@vis.gl/react-google-maps`)
- **3D Cartography**: Three.js, `world-atlas`, `topojson-client`

---

## 🚀 Getting Started Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/<your-username>/<your-repo>.git
   cd <your-repo>
Install dependencies
Bash
npm install
Configure environment variables
Copy .env.example to .env and add your Google Maps JavaScript API key:
Bash
cp .env.example .env
Env
VITE_GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY"
(If no Google Maps API key is configured, the app gracefully falls back to the Three.js 3D Globe.)
Run the development server
Bash
npm run dev
Open http://localhost:3000 in your browser.
Build for production
Bash
npm run build
📄 License
MIT
Code
*(Tip: Grab 1 screenshot or a short 10-second screen recording of Presenter Mode rotating between dishes and save it as `docs/preview.png` or `.gif` — visuals at the top of a mapping README make a huge difference!)*
