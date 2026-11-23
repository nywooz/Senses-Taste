import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { TASTE_META } from '../data/culinaryData';
import { CulinaryDish, LayerVisibility } from '../types/culinary';
import { createEarthAssets, latLonToVector3 } from './earthTextures';

interface GlobeViewportProps {
  dishes: CulinaryDish[];
  filteredIds: Set<string>;
  selectedDishId: string | null;
  presenterMode: boolean;
  layers: LayerVisibility;
  isHudHidden: boolean;
  onSelectDish: (dishId: string | null) => void;
  onUserOrbitStart: () => void;
}

interface HoverTooltipState {
  dish: CulinaryDish;
  x: number;
  y: number;
}

interface HotspotRig {
  dish: CulinaryDish;
  group: THREE.Group;
  normal: THREE.Vector3;
  columnMesh: THREE.Mesh;
  columnMat: THREE.MeshStandardMaterial;
  baseHeight: number;
  finialMesh: THREE.Mesh;
  finialMat: THREE.MeshStandardMaterial;
  ringMesh: THREE.Mesh;
  ringMat: THREE.MeshStandardMaterial;
  hitProxy: THREE.Mesh;
  visibleTarget: number;
  visibleCurrent: number;
}

interface ArcRig {
  aId: string;
  bId: string;
  mesh: THREE.Mesh;
  material: THREE.MeshStandardMaterial;
  curve: THREE.CatmullRomCurve3;
  phaseOffset: number;
  speed: number;
  color: THREE.Color;
}

interface AromaParticle {
  dishId: string;
  baseNormal: THREE.Vector3;
  tangentU: THREE.Vector3;
  tangentV: THREE.Vector3;
  radiusOffset: number;
  orbitRadius: number;
  angle: number;
  speed: number;
  bobPhase: number;
  scale: number;
  color: THREE.Color;
}

// Pre-allocated math helpers (zero GC inside animation loop)
const _up = new THREE.Vector3(0, 1, 0);
const _vecA = new THREE.Vector3();
const _vecB = new THREE.Vector3();
const _vecC = new THREE.Vector3();
const _quatA = new THREE.Quaternion();
const _quatB = new THREE.Quaternion();
const _mat4 = new THREE.Matrix4();
const _scaleVec = new THREE.Vector3();

export const GlobeViewport: React.FC<GlobeViewportProps> = ({
  dishes,
  filteredIds,
  selectedDishId,
  presenterMode,
  layers,
  isHudHidden,
  onSelectDish,
  onUserOrbitStart,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [contextLost, setContextLost] = useState(false);
  const [tooltip, setTooltip] = useState<HoverTooltipState | null>(null);

  // Store latest props in a ref so the WebGL loop reads fresh state without remounting
  const stateRef = useRef({
    filteredIds,
    selectedDishId,
    presenterMode,
    layers,
    isHudHidden,
    onSelectDish,
    onUserOrbitStart,
  });

  stateRef.current = {
    filteredIds,
    selectedDishId,
    presenterMode,
    layers,
    isHudHidden,
    onSelectDish,
    onUserOrbitStart,
  };

  // Trigger camera fly-to whenever selectedDishId changes
  const flyToDishIdRef = useRef<string | null>(null);
  const flyActiveRef = useRef(false);
  const lastSelectedRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedDishId && selectedDishId !== lastSelectedRef.current) {
      flyToDishIdRef.current = selectedDishId;
      flyActiveRef.current = true;
    }
    lastSelectedRef.current = selectedDishId;
  }, [selectedDishId]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Software WebGL probe
    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) return true;
        const ext = probe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param));
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const handleContextRestored = () => {
      setContextLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener(
      'webglcontextrestored',
      handleContextRestored
    );

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e14);
    scene.fog = new THREE.FogExp2(0x0a0e14, 0.045);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    // Initial framing centered over Eurasia/Africa/Indian Ocean spice routes
    latLonToVector3(24, 28, 2.85, camera.position);
    camera.lookAt(0, 0, 0);

    // Studio Environment Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTexture = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04
    ).texture;
    scene.environment = envTexture;
    scene.environmentIntensity = 0.65;
    pmremGenerator.dispose();

    // 3-Point Warm/Cool Studio Lighting
    const hemiLight = new THREE.HemisphereLight(0x88b2e6, 0x0b111a, 0.9);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1dc, 2.1);
    keyLight.position.set(4.5, 3.5, 4.0);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x6398db, 1.25);
    rimLight.position.set(-4.5, -1.5, -3.5);
    scene.add(rimLight);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.rotateSpeed = 0.65;
    controls.zoomSpeed = 0.85;
    controls.minDistance = 1.65;
    controls.maxDistance = 4.5;

    controls.addEventListener('start', () => {
      flyActiveRef.current = false;
      stateRef.current.onUserOrbitStart();
    });

    // Subtle deep starfield
    const starCount = 550;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 14 + Math.random() * 14;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi);
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(starPositions, 3)
    );
    const starMat = new THREE.PointsMaterial({
      color: 0xaab9cc,
      size: 0.045,
      transparent: true,
      opacity: 0.55,
      sizeAttenuation: true,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // Cartographic Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const earthAssets = createEarthAssets(maxAnisotropy);

    const earthGeo = new THREE.SphereGeometry(1.0, 72, 48);
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthAssets.albedoMap,
      roughnessMap: earthAssets.roughnessMap,
      bumpMap: earthAssets.bumpMap,
      bumpScale: 0.008,
      metalness: 0.08,
      roughness: 0.95,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(earthMesh);

    // 3D Vector Country Borders & Coastlines
    const borderMat = new THREE.LineBasicMaterial({
      color: 0x8ea6c2,
      transparent: true,
      opacity: 0.28,
    });
    const borderLines = new THREE.LineSegments(
      earthAssets.borderGeometry,
      borderMat
    );
    globeGroup.add(borderLines);

    // 3D Graticule Cage
    const gratMat = new THREE.LineBasicMaterial({
      color: 0x4c74a3,
      transparent: true,
      opacity: 0.14,
    });
    const gratLines = new THREE.LineSegments(
      earthAssets.graticuleGeometry,
      gratMat
    );
    globeGroup.add(gratLines);

    // Custom Atmospheric Fresnel Rim Shader
    const atmosGeo = new THREE.SphereGeometry(1.068, 64, 48);
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPos;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vViewPos = -mvPos.xyz;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vViewPos;
        void main() {
          vec3 viewDir = normalize(vViewPos);
          float rim = clamp(0.62 - dot(vNormal, -viewDir), 0.0, 1.0);
          float glow = pow(rim, 3.2);
          vec3 col = mix(vec3(0.24, 0.45, 0.72), vec3(0.85, 0.62, 0.22), glow * 0.35);
          gl_FragColor = vec4(col, glow * 0.55);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    globeGroup.add(atmosMesh);

    // Build 3D Culinary Hotspot Rigs (composite multi-part markers)
    const dishMap = new Map<string, CulinaryDish>();
    dishes.forEach((d) => dishMap.set(d.id, d));

    const hotspotRigs: HotspotRig[] = [];
    const hotspotById = new Map<string, HotspotRig>();
    const raycastTargets: THREE.Object3D[] = [];

    const baseRingGeo = new THREE.RingGeometry(0.015, 0.023, 24);
    baseRingGeo.rotateX(-Math.PI / 2);
    const finialGeo = new THREE.OctahedronGeometry(0.014, 0);
    const hitProxyGeo = new THREE.CylinderGeometry(0.031, 0.031, 0.28, 8);
    hitProxyGeo.translate(0, 0.14, 0);
    const hitProxyMat = new THREE.MeshBasicMaterial({ visible: false });

    for (const dish of dishes) {
      const tasteInfo = TASTE_META[dish.primaryTaste];
      const baseColor = new THREE.Color(tasteInfo.hexNumber);

      const group = new THREE.Group();
      const pos = latLonToVector3(dish.lat, dish.lon, 1.002);
      const normal = pos.clone().normalize();
      group.position.copy(pos);
      group.quaternion.setFromUnitVectors(_up, normal);

      // 1. Base Plinth Ring
      const ringMat = new THREE.MeshStandardMaterial({
        color: baseColor,
        emissive: baseColor,
        emissiveIntensity: 0.45,
        roughness: 0.25,
        metalness: 0.75,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
      });
      const ringMesh = new THREE.Mesh(baseRingGeo, ringMat);
      ringMesh.position.y = 0.002;
      group.add(ringMesh);

      // 2. Hexagonal Flavor Intensity Column
      const baseHeight = 0.065 + (dish.intensity / 100) * 0.165;
      const colGeo = new THREE.CylinderGeometry(0.009, 0.014, baseHeight, 6);
      colGeo.translate(0, baseHeight / 2, 0);
      const columnMat = new THREE.MeshStandardMaterial({
        color: baseColor,
        emissive: baseColor,
        emissiveIntensity: 0.28,
        roughness: 0.24,
        metalness: 0.45,
        transparent: true,
        opacity: 0.92,
      });
      const columnMesh = new THREE.Mesh(colGeo, columnMat);
      group.add(columnMesh);

      // 3. Beacon Finial Crystal
      const finialMat = new THREE.MeshStandardMaterial({
        color: 0xf4f1ea,
        emissive: baseColor,
        emissiveIntensity: 0.75,
        roughness: 0.15,
        metalness: 0.85,
        transparent: true,
        opacity: 0.95,
      });
      const finialMesh = new THREE.Mesh(finialGeo, finialMat);
      finialMesh.position.y = baseHeight + 0.024;
      group.add(finialMesh);

      // 4. Invisible Raycast Hit Proxy on Layer 1
      const hitProxy = new THREE.Mesh(hitProxyGeo, hitProxyMat);
      hitProxy.layers.set(1);
      hitProxy.userData.dishId = dish.id;
      group.add(hitProxy);
      raycastTargets.push(hitProxy);

      globeGroup.add(group);

      const rig: HotspotRig = {
        dish,
        group,
        normal,
        columnMesh,
        columnMat,
        baseHeight,
        finialMesh,
        finialMat,
        ringMesh,
        ringMat,
        hitProxy,
        visibleTarget: 1,
        visibleCurrent: 1,
      };
      hotspotRigs.push(rig);
      hotspotById.set(dish.id, rig);
    }

    // Active Hotspot Orbital Target Reticle (composite 3-part highlight)
    const activeReticleGroup = new THREE.Group();
    activeReticleGroup.visible = false;
    globeGroup.add(activeReticleGroup);

    const reticleRingInnerGeo = new THREE.TorusGeometry(0.044, 0.0024, 8, 40);
    reticleRingInnerGeo.rotateX(Math.PI / 2);
    const reticleInnerMat = new THREE.MeshStandardMaterial({
      color: 0xf4f1ea,
      emissive: 0xd99b26,
      emissiveIntensity: 1.1,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.95,
    });
    const reticleInnerMesh = new THREE.Mesh(
      reticleRingInnerGeo,
      reticleInnerMat
    );
    reticleInnerMesh.position.y = 0.008;
    activeReticleGroup.add(reticleInnerMesh);

    const reticleWaveGeo = new THREE.RingGeometry(0.052, 0.058, 36);
    reticleWaveGeo.rotateX(-Math.PI / 2);
    const reticleWaveMat = new THREE.MeshBasicMaterial({
      color: 0xd99b26,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const reticleWaveMesh = new THREE.Mesh(reticleWaveGeo, reticleWaveMat);
    reticleWaveMesh.position.y = 0.006;
    activeReticleGroup.add(reticleWaveMesh);

    const beaconSpireGeo = new THREE.CylinderGeometry(0.0014, 0.0032, 0.34, 8);
    beaconSpireGeo.translate(0, 0.17, 0);
    const beaconSpireMat = new THREE.MeshBasicMaterial({
      color: 0xf4f1ea,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const beaconSpireMesh = new THREE.Mesh(beaconSpireGeo, beaconSpireMat);
    activeReticleGroup.add(beaconSpireMesh);

    // 3D Great-Circle Culinary Arcs
    const arcGroup = new THREE.Group();
    globeGroup.add(arcGroup);
    const arcRigs: ArcRig[] = [];
    const seenPairs = new Set<string>();

    for (const dish of dishes) {
      for (const relId of dish.relatedIds) {
        const pairKey =
          dish.id < relId ? `${dish.id}::${relId}` : `${relId}::${dish.id}`;
        if (seenPairs.has(pairKey)) continue;
        const targetDish = dishMap.get(relId);
        if (!targetDish) continue;
        seenPairs.add(pairKey);

        const start = latLonToVector3(dish.lat, dish.lon, 1.005);
        const end = latLonToVector3(targetDish.lat, targetDish.lon, 1.005);
        const chordDist = start.distanceTo(end);
        const arcApex = 1.04 + Math.min(0.32, chordDist * 0.22);

        const pts: THREE.Vector3[] = [];
        const steps = 20;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const p = new THREE.Vector3().lerpVectors(start, end, t).normalize();
          const lift = Math.sin(t * Math.PI) * (arcApex - 1.005);
          p.multiplyScalar(1.005 + lift);
          pts.push(p);
        }

        const curve = new THREE.CatmullRomCurve3(pts);
        const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.0024, 5, false);
        const arcColor = new THREE.Color(TASTE_META[dish.primaryTaste].hexNumber);
        const arcMat = new THREE.MeshStandardMaterial({
          color: arcColor,
          emissive: arcColor,
          emissiveIntensity: 0.45,
          roughness: 0.3,
          metalness: 0.4,
          transparent: true,
          opacity: 0.34,
          depthWrite: false,
        });
        const arcMesh = new THREE.Mesh(tubeGeo, arcMat);
        arcGroup.add(arcMesh);

        arcRigs.push({
          aId: dish.id,
          bId: targetDish.id,
          mesh: arcMesh,
          material: arcMat,
          curve,
          phaseOffset: Math.random(),
          speed: 0.16 + Math.random() * 0.1,
          color: arcColor,
        });
      }
    }

    // Instanced Traveling Pulse Beads along Culinary Arcs
    const beadGeo = new THREE.SphereGeometry(0.0075, 8, 8);
    const beadMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.92,
    });
    const beadInstanced = new THREE.InstancedMesh(
      beadGeo,
      beadMat,
      Math.max(1, arcRigs.length)
    );
    beadInstanced.frustumCulled = false;
    arcGroup.add(beadInstanced);

    // Instanced Regional Aroma / Spice Field
    const aromaParticles: AromaParticle[] = [];
    const particlesPerDish = 8;
    for (const dish of dishes) {
      const normal = latLonToVector3(dish.lat, dish.lon, 1).normalize();
      const refAxis =
        Math.abs(normal.y) > 0.9
          ? new THREE.Vector3(1, 0, 0)
          : new THREE.Vector3(0, 1, 0);
      const tangentU = new THREE.Vector3().crossVectors(refAxis, normal).normalize();
      const tangentV = new THREE.Vector3().crossVectors(normal, tangentU).normalize();
      const pColor = new THREE.Color(TASTE_META[dish.primaryTaste].hexNumber);

      for (let i = 0; i < particlesPerDish; i++) {
        aromaParticles.push({
          dishId: dish.id,
          baseNormal: normal,
          tangentU,
          tangentV,
          radiusOffset: 1.035 + Math.random() * 0.13,
          orbitRadius: 0.025 + Math.random() * 0.075,
          angle: Math.random() * Math.PI * 2,
          speed: (0.25 + Math.random() * 0.45) * (Math.random() > 0.5 ? 1 : -1),
          bobPhase: Math.random() * Math.PI * 2,
          scale: 0.55 + Math.random() * 0.75,
          color: pColor,
        });
      }
    }

    const aromaGeo = new THREE.OctahedronGeometry(0.006, 0);
    const aromaMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.45,
      roughness: 0.3,
      metalness: 0.2,
      transparent: true,
      opacity: 0.8,
    });
    const aromaInstanced = new THREE.InstancedMesh(
      aromaGeo,
      aromaMat,
      aromaParticles.length
    );
    aromaInstanced.frustumCulled = false;
    for (let i = 0; i < aromaParticles.length; i++) {
      aromaInstanced.setColorAt(i, aromaParticles[i].color);
    }
    if (aromaInstanced.instanceColor) {
      aromaInstanced.instanceColor.needsUpdate = true;
    }
    globeGroup.add(aromaInstanced);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Raycasting for Hover & Click
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointer = new THREE.Vector2();
    let hoveredDishId: string | null = null;
    let lastRaycastTime = 0;
    let pointerDownPos = { x: 0, y: 0 };

    const updatePointer = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const pickDish = (clientX: number, clientY: number): CulinaryDish | null => {
      updatePointer(clientX, clientY);
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(raycastTargets, false);
      for (const hit of intersects) {
        const dId = hit.object.userData.dishId as string | undefined;
        if (!dId) continue;
        if (!stateRef.current.filteredIds.has(dId)) continue;
        // Ignore hotspots on the far side of the globe
        const rig = hotspotById.get(dId);
        if (!rig) continue;
        _vecA.copy(camera.position).normalize();
        if (rig.normal.dot(_vecA) < -0.1) continue;
        return rig.dish;
      }
      return null;
    };

    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastRaycastTime < 45) return;
      lastRaycastTime = now;

      const hitDish = pickDish(e.clientX, e.clientY);
      if (hitDish) {
        hoveredDishId = hitDish.id;
        renderer.domElement.style.cursor = 'pointer';
        setTooltip({
          dish: hitDish,
          x: e.clientX,
          y: e.clientY,
        });
      } else {
        if (hoveredDishId !== null) {
          hoveredDishId = null;
          renderer.domElement.style.cursor = 'grab';
          setTooltip(null);
        }
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      if (dx * dx + dy * dy > 36) return; // Was a drag, not a click

      const hitDish = pickDish(e.clientX, e.clientY);
      if (hitDish) {
        stateRef.current.onSelectDish(hitDish.id);
      }
    };

    const onPointerLeave = () => {
      hoveredDishId = null;
      renderer.domElement.style.cursor = 'grab';
      setTooltip(null);
    };

    renderer.domElement.style.cursor = 'grab';
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);

    // Resize observer
    let viewportWidth = width;
    let viewportHeight = height;
    const handleResize = () => {
      if (!container) return;
      viewportWidth = container.clientWidth || window.innerWidth;
      viewportHeight = container.clientHeight || window.innerHeight;
      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(viewportWidth, viewportHeight);
      renderer.setPixelRatio(
        isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
      );
    };
    window.addEventListener('resize', handleResize);

    // Animation loop state
    let frameId = 0;
    let disposed = false;
    let lastTime = performance.now();
    let elapsed = 0;
    let currentViewOffsetX = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;

      const now = performance.now();
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;
      elapsed += dt;

      const {
        filteredIds: activeFilterIds,
        selectedDishId: activeDishId,
        presenterMode: isPresenting,
        layers: activeLayers,
        isHudHidden: hudHidden,
      } = stateRef.current;

      // 1. Cinematic View Offset (shifts globe cleanly left when right Dish Card is visible on desktop)
      const shouldOffset =
        activeDishId !== null && !hudHidden && viewportWidth >= 1024;
      const targetOffsetX = shouldOffset ? viewportWidth * 0.145 : 0;
      currentViewOffsetX = THREE.MathUtils.damp(
        currentViewOffsetX,
        targetOffsetX,
        5.5,
        dt
      );
      if (Math.abs(currentViewOffsetX) > 0.5) {
        camera.setViewOffset(
          viewportWidth,
          viewportHeight,
          currentViewOffsetX,
          0,
          viewportWidth,
          viewportHeight
        );
      } else {
        camera.clearViewOffset();
      }

      // 2. Smooth Spherical Camera Fly-To or Gentle Presenter Orbit
      if (flyActiveRef.current && flyToDishIdRef.current) {
        const targetRig = hotspotById.get(flyToDishIdRef.current);
        if (targetRig) {
          const curDist = camera.position.length();
          const targetDist = THREE.MathUtils.damp(curDist, 2.24, 3.8, dt);

          _vecA.copy(camera.position).normalize();
          _vecB.copy(targetRig.normal);
          // Slerp direction vector around the sphere
          _quatA.setFromUnitVectors(_vecA, _vecB);
          const alpha = 1 - Math.exp(-3.6 * dt);
          _quatB.identity().slerp(_quatA, alpha);
          _vecA.applyQuaternion(_quatB).normalize().multiplyScalar(targetDist);
          camera.position.copy(_vecA);

          if (
            camera.position.clone().normalize().distanceTo(_vecB) < 0.008 &&
            Math.abs(curDist - 2.24) < 0.02
          ) {
            flyActiveRef.current = false;
          }
        } else {
          flyActiveRef.current = false;
        }
      } else if (isPresenting) {
        // Gentle scenic rotation around Y during Presenter dwell
        const rotAngle = dt * 0.085;
        const cosA = Math.cos(rotAngle);
        const sinA = Math.sin(rotAngle);
        const px = camera.position.x;
        const pz = camera.position.z;
        camera.position.x = px * cosA - pz * sinA;
        camera.position.z = px * sinA + pz * cosA;
      }

      controls.update();

      // 3. Layer visibility
      borderLines.visible = activeLayers.borders;
      gratLines.visible = activeLayers.borders;
      arcGroup.visible = activeLayers.arcs;
      aromaInstanced.visible = activeLayers.aroma;

      // 4. Update Hotspot Rigs (columns, finials, filter scaling)
      for (let i = 0; i < hotspotRigs.length; i++) {
        const rig = hotspotRigs[i];
        const isMatched = activeFilterIds.has(rig.dish.id);
        const isSelected = activeDishId === rig.dish.id;
        const isHovered = hoveredDishId === rig.dish.id;

        rig.visibleTarget = isMatched ? 1 : 0.14;
        rig.visibleCurrent = THREE.MathUtils.damp(
          rig.visibleCurrent,
          rig.visibleTarget,
          8,
          dt
        );

        const colScaleY = activeLayers.columns
          ? isSelected
            ? 1.28
            : isHovered
            ? 1.15
            : 1.0
          : 0.08;
        const targetXZ = isSelected ? 1.35 : isHovered ? 1.2 : 1.0;

        rig.columnMesh.scale.set(
          targetXZ * rig.visibleCurrent,
          colScaleY * rig.visibleCurrent,
          targetXZ * rig.visibleCurrent
        );
        rig.columnMat.opacity = isMatched ? (isSelected ? 1.0 : 0.88) : 0.16;
        rig.columnMat.emissiveIntensity = isSelected
          ? 0.85
          : isHovered
          ? 0.65
          : isMatched
          ? 0.25
          : 0.05;

        const finialY =
          (activeLayers.columns ? rig.baseHeight * colScaleY : 0.015) +
          0.024 +
          Math.sin(elapsed * 2.2 + i * 0.7) * 0.005;
        rig.finialMesh.position.y = finialY * rig.visibleCurrent;
        rig.finialMesh.rotation.y = elapsed * 1.1 + i;
        rig.finialMesh.scale.setScalar(
          (isSelected ? 1.45 : isHovered ? 1.25 : 1.0) * rig.visibleCurrent
        );
        rig.finialMat.opacity = isMatched ? 0.96 : 0.12;

        rig.ringMesh.scale.setScalar(
          (isSelected ? 1.4 : 1.0) * rig.visibleCurrent
        );
        rig.ringMat.opacity = isMatched ? 0.9 : 0.15;
      }

      // 5. Update Active Target Reticle
      if (activeDishId) {
        const activeRig = hotspotById.get(activeDishId);
        if (activeRig) {
          activeReticleGroup.visible = true;
          activeReticleGroup.position.copy(activeRig.group.position);
          activeReticleGroup.quaternion.copy(activeRig.group.quaternion);

          const tasteColor = TASTE_META[activeRig.dish.primaryTaste].hexNumber;
          reticleInnerMat.emissive.setHex(tasteColor);
          reticleWaveMat.color.setHex(tasteColor);
          beaconSpireMat.color.setHex(tasteColor);

          reticleInnerMesh.rotation.y = elapsed * 1.2;
          const waveCycle = (elapsed * 0.85) % 1;
          const waveScale = 0.75 + waveCycle * 1.35;
          reticleWaveMesh.scale.setScalar(waveScale);
          reticleWaveMat.opacity = (1 - waveCycle) * 0.75;
        } else {
          activeReticleGroup.visible = false;
        }
      } else {
        activeReticleGroup.visible = false;
      }

      // 6. Update Culinary Arcs & Traveling Pulse Beads
      if (activeLayers.arcs) {
        for (let i = 0; i < arcRigs.length; i++) {
          const arc = arcRigs[i];
          const aVisible = activeFilterIds.has(arc.aId);
          const bVisible = activeFilterIds.has(arc.bId);
          const connectedToActive =
            activeDishId !== null &&
            (arc.aId === activeDishId || arc.bId === activeDishId);

          let targetOpacity = 0.06;
          if (connectedToActive) {
            targetOpacity = 0.85;
          } else if (activeDishId === null && aVisible && bVisible) {
            targetOpacity = 0.34;
          } else if (aVisible || bVisible) {
            targetOpacity = 0.14;
          }

          arc.material.opacity = THREE.MathUtils.damp(
            arc.material.opacity,
            targetOpacity,
            6,
            dt
          );
          arc.material.emissiveIntensity = connectedToActive ? 0.95 : 0.4;

          const t = (elapsed * arc.speed + arc.phaseOffset) % 1;
          arc.curve.getPointAt(t, _vecA);
          const beadScale =
            targetOpacity > 0.2 ? (connectedToActive ? 1.35 : 0.85) : 0.001;
          _scaleVec.setScalar(beadScale);
          _quatA.identity();
          _mat4.compose(_vecA, _quatA, _scaleVec);
          beadInstanced.setMatrixAt(i, _mat4);
          beadInstanced.setColorAt(i, arc.color);
        }
        beadInstanced.instanceMatrix.needsUpdate = true;
        if (beadInstanced.instanceColor) {
          beadInstanced.instanceColor.needsUpdate = true;
        }
      }

      // 7. Update Instanced Regional Aroma Particles
      if (activeLayers.aroma) {
        for (let i = 0; i < aromaParticles.length; i++) {
          const p = aromaParticles[i];
          const isMatched = activeFilterIds.has(p.dishId);
          const isFocused = activeDishId === p.dishId;

          const angle = p.angle + elapsed * p.speed;
          const bob = Math.sin(elapsed * 1.4 + p.bobPhase) * 0.015;
          const r = p.radiusOffset + bob + (isFocused ? 0.03 : 0);

          _vecA.copy(p.baseNormal).multiplyScalar(r);
          _vecB.copy(p.tangentU).multiplyScalar(Math.cos(angle) * p.orbitRadius);
          _vecC.copy(p.tangentV).multiplyScalar(Math.sin(angle) * p.orbitRadius);
          _vecA.add(_vecB).add(_vecC);

          const s = isMatched
            ? p.scale * (isFocused ? 1.45 : 1.0)
            : 0.001;
          _scaleVec.setScalar(s);
          _quatA.setFromAxisAngle(_up, elapsed + p.bobPhase);
          _mat4.compose(_vecA, _quatA, _scaleVec);
          aromaInstanced.setMatrixAt(i, _mat4);
        }
        aromaInstanced.instanceMatrix.needsUpdate = true;
      }

      starField.rotation.y = elapsed * 0.005;

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      renderer.domElement.removeEventListener(
        'webglcontextlost',
        handleContextLost
      );
      renderer.domElement.removeEventListener(
        'webglcontextrestored',
        handleContextRestored
      );
      controls.dispose();
      earthAssets.albedoMap.dispose();
      earthAssets.roughnessMap.dispose();
      earthAssets.bumpMap.dispose();
      earthAssets.borderGeometry.dispose();
      earthAssets.graticuleGeometry.dispose();
      envTexture.dispose();
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh || (obj as THREE.LineSegments).isLineSegments || (obj as THREE.Points).isPoints) {
          const m = obj as THREE.Mesh;
          m.geometry?.dispose();
          if (Array.isArray(m.material)) {
            m.material.forEach((mat) => mat.dispose());
          } else {
            m.material?.dispose();
          }
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [dishes]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0A0E14]">
      <div ref={mountRef} className="w-full h-full" />

      {contextLost && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0A0E14] text-[#F4F1EA] z-30 p-6">
          <div className="max-w-md border border-white/10 bg-[#121822] rounded-xl p-6 text-center">
            <h2 className="font-serif text-xl font-medium mb-2">
              3D WebGL Context Paused
            </h2>
            <p className="text-sm text-[#9AA5B4]">
              Graphics resources were suspended by the browser. Reload or switch back to resume the interactive FlavorAtlas globe.
            </p>
          </div>
        </div>
      )}

      {tooltip && !contextLost && (
        <div
          className="fixed z-30 pointer-events-none px-3.5 py-2.5 rounded-lg bg-[#121822] border border-white/15 shadow-2xl"
          style={{
            left: Math.min(tooltip.x + 16, window.innerWidth - 260),
            top: Math.max(16, tooltip.y - 18),
          }}
        >
          <div className="flex items-center gap-2 text-[11px] font-medium text-[#9AA5B4] mb-0.5">
            <span
              className="inline-block w-2 h-2 rounded-full shrink-0"
              style={{
                backgroundColor: TASTE_META[tooltip.dish.primaryTaste].color,
              }}
            />
            <span>{TASTE_META[tooltip.dish.primaryTaste].shortLabel}</span>
            <span aria-hidden="true">·</span>
            <span>
              {tooltip.dish.city}, {tooltip.dish.country}
            </span>
          </div>
          <div className="font-serif text-sm font-medium text-[#F4F1EA] whitespace-nowrap">
            {tooltip.dish.name}
          </div>
        </div>
      )}
    </div>
  );
};
