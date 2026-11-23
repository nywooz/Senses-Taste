import * as THREE from 'three';
import { feature, mesh as topoMesh } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import countriesAtlas from 'world-atlas/countries-110m.json';

const DEG2RAD = Math.PI / 180;

export function latLonToVector3(
  lat: number,
  lon: number,
  radius: number,
  target = new THREE.Vector3()
): THREE.Vector3 {
  const polar = (90 - lat) * DEG2RAD;
  const azimuth = (lon + 180) * DEG2RAD;
  target.set(
    -radius * Math.sin(polar) * Math.cos(azimuth),
    radius * Math.cos(polar),
    radius * Math.sin(polar) * Math.sin(azimuth)
  );
  return target;
}

interface EarthTexturesResult {
  albedoMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  borderGeometry: THREE.BufferGeometry;
  graticuleGeometry: THREE.BufferGeometry;
}

function drawRingOnCanvas(
  ctx: CanvasRenderingContext2D,
  ring: number[][],
  width: number,
  height: number
) {
  if (ring.length === 0) return;
  for (let i = 0; i < ring.length; i++) {
    const [lon, lat] = ring[i];
    const x = ((lon + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      const prevLon = ring[i - 1][0];
      if (Math.abs(lon - prevLon) > 180) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
  }
}

export function createEarthAssets(maxAnisotropy: number): EarthTexturesResult {
  const width = 2048;
  const height = 1024;

  const topology = countriesAtlas as unknown as Topology<{
    countries: GeometryCollection;
    land: GeometryCollection;
  }>;

  const landGeo = feature(topology, topology.objects.land);
  const countriesGeo = feature(topology, topology.objects.countries);

  // 1. Albedo CanvasTexture (SRGB)
  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = width;
  albedoCanvas.height = height;
  const aCtx = albedoCanvas.getContext('2d')!;

  // Deep abyssal cartographic ocean gradient
  const oceanGrad = aCtx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#09101A');
  oceanGrad.addColorStop(0.25, '#0B1421');
  oceanGrad.addColorStop(0.5, '#0E1929');
  oceanGrad.addColorStop(0.75, '#0B1421');
  oceanGrad.addColorStop(1, '#09101A');
  aCtx.fillStyle = oceanGrad;
  aCtx.fillRect(0, 0, width, height);

  // Subtle bathymetric stipple/grid lines in canvas albedo
  aCtx.strokeStyle = 'rgba(91, 155, 213, 0.065)';
  aCtx.lineWidth = 1;
  for (let lon = -165; lon <= 180; lon += 15) {
    const x = ((lon + 180) / 360) * width;
    aCtx.beginPath();
    aCtx.moveTo(x, 0);
    aCtx.lineTo(x, height);
    aCtx.stroke();
  }
  for (let lat = -75; lat <= 75; lat += 15) {
    const y = ((90 - lat) / 180) * height;
    aCtx.beginPath();
    aCtx.moveTo(0, y);
    aCtx.lineTo(width, y);
    aCtx.stroke();
  }

  // Soft coastal bathymetry halo around landmasses
  const drawFeatureCollection = (
    ctx: CanvasRenderingContext2D,
    geo: ReturnType<typeof feature>,
    mode: 'fill' | 'stroke'
  ) => {
    const featuresList = geo.type === 'FeatureCollection' ? geo.features : [geo];
    for (const feat of featuresList) {
      const geom = feat.geometry;
      if (!geom) continue;
      ctx.beginPath();
      if (geom.type === 'Polygon') {
        for (const ring of geom.coordinates) {
          drawRingOnCanvas(ctx, ring, width, height);
        }
      } else if (geom.type === 'MultiPolygon') {
        for (const poly of geom.coordinates) {
          for (const ring of poly) {
            drawRingOnCanvas(ctx, ring, width, height);
          }
        }
      }
      if (mode === 'fill') ctx.fill();
      else ctx.stroke();
    }
  };

  // Continental shelf glow
  aCtx.lineJoin = 'round';
  aCtx.lineCap = 'round';
  aCtx.strokeStyle = 'rgba(40, 68, 96, 0.42)';
  aCtx.lineWidth = 10;
  drawFeatureCollection(aCtx, landGeo, 'stroke');

  aCtx.strokeStyle = 'rgba(65, 102, 138, 0.28)';
  aCtx.lineWidth = 4;
  drawFeatureCollection(aCtx, landGeo, 'stroke');

  // Matte obsidian-basalt landmass fill
  const landGrad = aCtx.createLinearGradient(0, 0, 0, height);
  landGrad.addColorStop(0, '#1B2430');
  landGrad.addColorStop(0.5, '#212B39');
  landGrad.addColorStop(1, '#1A222E');
  aCtx.fillStyle = landGrad;
  drawFeatureCollection(aCtx, landGeo, 'fill');

  // Subtle country subdivisions on canvas
  aCtx.strokeStyle = 'rgba(130, 155, 184, 0.16)';
  aCtx.lineWidth = 0.8;
  drawFeatureCollection(aCtx, countriesGeo, 'stroke');

  // Crisp continental rim stroke
  aCtx.strokeStyle = 'rgba(165, 190, 218, 0.36)';
  aCtx.lineWidth = 1.35;
  drawFeatureCollection(aCtx, landGeo, 'stroke');

  const albedoMap = new THREE.CanvasTexture(albedoCanvas);
  albedoMap.colorSpace = THREE.SRGBColorSpace;
  albedoMap.anisotropy = maxAnisotropy;
  albedoMap.needsUpdate = true;

  // 2. Roughness Map (Linear: oceans slightly glossier ~0.48, land matte ~0.88)
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = width;
  roughCanvas.height = height;
  const rCtx = roughCanvas.getContext('2d')!;
  rCtx.fillStyle = 'rgb(122, 122, 122)'; // ~0.48 roughness for oceans
  rCtx.fillRect(0, 0, width, height);
  rCtx.fillStyle = 'rgb(225, 225, 225)'; // ~0.88 roughness for continents
  drawFeatureCollection(rCtx, landGeo, 'fill');

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.anisotropy = maxAnisotropy;
  roughnessMap.needsUpdate = true;

  // 3. Bump Map (Linear: subtle continent elevation relief)
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bCtx = bumpCanvas.getContext('2d')!;
  bCtx.fillStyle = 'rgb(40, 40, 40)';
  bCtx.fillRect(0, 0, width, height);
  bCtx.fillStyle = 'rgb(175, 175, 175)';
  drawFeatureCollection(bCtx, landGeo, 'fill');
  bCtx.strokeStyle = 'rgb(225, 225, 225)';
  bCtx.lineWidth = 2;
  drawFeatureCollection(bCtx, landGeo, 'stroke');

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.anisotropy = maxAnisotropy;
  bumpMap.needsUpdate = true;

  // 4. 3D Vector Coastlines & Country Borders (LineSegments at R = 1.003)
  const borderMultiLine = topoMesh(topology, topology.objects.countries);
  const borderPositions: number[] = [];
  const pA = new THREE.Vector3();
  const pB = new THREE.Vector3();
  const borderRadius = 1.003;

  for (const line of borderMultiLine.coordinates) {
    for (let i = 1; i < line.length; i++) {
      const [lon1, lat1] = line[i - 1];
      const [lon2, lat2] = line[i];
      if (Math.abs(lon2 - lon1) > 180) continue;
      latLonToVector3(lat1, lon1, borderRadius, pA);
      latLonToVector3(lat2, lon2, borderRadius, pB);
      borderPositions.push(pA.x, pA.y, pA.z, pB.x, pB.y, pB.z);
    }
  }

  const borderGeometry = new THREE.BufferGeometry();
  borderGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(borderPositions, 3)
  );

  // 5. 3D Cartographic Graticule Wireframe (LineSegments at R = 1.0018)
  const gratPositions: number[] = [];
  const gratRadius = 1.0018;
  // Parallels every 30 deg + Tropics
  for (const lat of [-60, -30, -23.5, 0, 23.5, 30, 60]) {
    for (let lon = -180; lon < 180; lon += 4) {
      latLonToVector3(lat, lon, gratRadius, pA);
      latLonToVector3(lat, lon + 4, gratRadius, pB);
      gratPositions.push(pA.x, pA.y, pA.z, pB.x, pB.y, pB.z);
    }
  }
  // Meridians every 30 deg
  for (let lon = -180; lon < 180; lon += 30) {
    for (let lat = -84; lat < 84; lat += 4) {
      latLonToVector3(lat, lon, gratRadius, pA);
      latLonToVector3(lat + 4, lon, gratRadius, pB);
      gratPositions.push(pA.x, pA.y, pA.z, pB.x, pB.y, pB.z);
    }
  }

  const graticuleGeometry = new THREE.BufferGeometry();
  graticuleGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(gratPositions, 3)
  );

  return {
    albedoMap,
    roughnessMap,
    bumpMap,
    borderGeometry,
    graticuleGeometry,
  };
}
