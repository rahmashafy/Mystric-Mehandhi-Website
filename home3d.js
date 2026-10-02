const canvas = document.getElementById("mehndi-scene");
const fallback = document.querySelector("[data-animation-fallback]");

function showFallback() {
  fallback?.classList.add("is-visible");
  canvas?.classList.add("hidden");
}

async function loadThree() {
  const sources = [
    "https://unpkg.com/three@0.160.0/build/three.module.js",
    "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js"
  ];

  for (const source of sources) {
    try {
      return await import(source);
    } catch (error) {
      // Try the next CDN before using the CSS fallback.
    }
  }

  throw new Error("Three.js could not be loaded.");
}

function pulse(index, phase) {
  const diff = Math.abs((((phase - index) % 4) + 6) % 4 - 2);
  return Math.max(0, 1 - diff);
}

function makeLeaf(THREE, material, size = 1) {
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.48 * size);
  shape.bezierCurveTo(0.54 * size, -0.2 * size, 0.5 * size, 0.36 * size, 0, 0.58 * size);
  shape.bezierCurveTo(-0.5 * size, 0.36 * size, -0.54 * size, -0.2 * size, 0, -0.48 * size);

  const leaf = new THREE.Mesh(new THREE.ShapeGeometry(shape), material);
  leaf.rotation.x = -0.45;

  const vein = new THREE.Mesh(
    new THREE.BoxGeometry(0.025 * size, 0.92 * size, 0.02 * size),
    material
  );
  vein.position.y = 0.03 * size;
  vein.position.z = 0.02;

  const group = new THREE.Group();
  group.add(leaf, vein);
  return group;
}

function makeIngredientStation(THREE, mats) {
  const group = new THREE.Group();
  group.position.x = -5.1;

  const leafA = makeLeaf(THREE, mats.leaf, 0.8);
  leafA.position.set(-0.75, 0.82, 0);
  leafA.rotation.z = -0.55;

  const leafB = makeLeaf(THREE, mats.leafLight, 0.66);
  leafB.position.set(-0.25, 0.66, 0.15);
  leafB.rotation.z = 0.42;

  const powder = new THREE.Mesh(new THREE.ConeGeometry(0.58, 0.46, 42), mats.powder);
  powder.position.set(0.55, 0.24, 0.05);

  const powderPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.76, 0.08, 42), mats.bone);
  powderPlate.position.set(0.55, 0.02, 0.05);

  const lemon = new THREE.Mesh(new THREE.SphereGeometry(0.34, 32, 16), mats.lemon);
  lemon.scale.set(1.1, 0.62, 1.1);
  lemon.position.set(-0.25, 0.25, 0.58);

  const sugar = new THREE.Group();
  for (let i = 0; i < 3; i += 1) {
    const cube = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), mats.sugar);
    cube.position.set(0.06 * i, 0.12 + i * 0.08, -0.48 + i * 0.14);
    cube.rotation.set(0.2 * i, 0.18 * i, 0.1);
    sugar.add(cube);
  }

  const oil = new THREE.Group();
  const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.74, 24), mats.glass);
  bottle.position.y = 0.38;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 20), mats.cafe);
  cap.position.y = 0.81;
  oil.add(bottle, cap);
  oil.position.set(0.95, 0, -0.45);
  oil.rotation.z = -0.1;

  group.add(leafA, leafB, powderPlate, powder, lemon, sugar, oil);
  return group;
}

function makeMixingStation(THREE, mats) {
  const group = new THREE.Group();
  group.position.x = -1.7;

  const bowl = new THREE.Mesh(
    new THREE.SphereGeometry(1.02, 44, 18, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    mats.tan
  );
  bowl.scale.y = 0.5;
  bowl.position.y = 0.28;

  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.055, 12, 64), mats.bone);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.3;

  const paste = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.83, 0.09, 50), mats.paste);
  paste.position.y = 0.34;

  const swirl = new THREE.Mesh(new THREE.TorusKnotGeometry(0.36, 0.025, 90, 8), mats.pasteLight);
  swirl.position.y = 0.43;
  swirl.scale.y = 0.22;

  const spoon = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.35, 16), mats.cafe);
  handle.rotation.z = 0.88;
  handle.position.set(0.36, 0.78, 0);
  const spoonTip = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 10), mats.cafe);
  spoonTip.scale.set(1.4, 0.34, 1);
  spoonTip.position.set(-0.08, 0.3, 0);
  spoon.add(handle, spoonTip);
  spoon.name = "spoon";

  group.add(bowl, rim, paste, swirl, spoon);
  group.userData.swirl = swirl;
  group.userData.spoon = spoon;
  return group;
}

function makeConeStation(THREE, mats) {
  const group = new THREE.Group();
  group.position.x = 1.7;

  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.52, 1.8, 36, 1, true), mats.cone);
  cone.rotation.z = -0.72;
  cone.position.set(0.14, 0.58, 0);

  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.32, 20), mats.cafe);
  tip.rotation.z = -0.72;
  tip.position.set(0.75, 0.04, 0);

  const pasteLine = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.84, 18), mats.pasteLight);
  pasteLine.position.set(-0.36, 0.98, 0);
  pasteLine.rotation.z = -0.72;

  const filledBand = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.035, 10, 42), mats.moss);
  filledBand.rotation.set(Math.PI / 2, 0, -0.72);
  filledBand.position.set(0.2, 0.62, 0);

  group.add(cone, tip, pasteLine, filledBand);
  group.userData.pasteLine = pasteLine;
  return group;
}

function makePackageStation(THREE, mats) {
  const group = new THREE.Group();
  group.position.x = 5.05;

  const base = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.55, 0.9), mats.package);
  base.position.y = 0.26;

  const lid = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.98), mats.bone);
  lid.position.set(0, 0.67, -0.08);
  lid.rotation.x = -0.28;

  const ribbonA = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.72, 0.94), mats.moss);
  ribbonA.position.y = 0.35;

  const ribbonB = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.74, 0.12), mats.moss);
  ribbonB.position.y = 0.35;

  const conePack = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.86, 24), mats.cone);
  conePack.position.set(-0.42, 0.94, 0.02);
  conePack.rotation.z = 1.25;

  group.add(base, lid, ribbonA, ribbonB, conePack);
  group.userData.lid = lid;
  return group;
}

function createScene(THREE) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x354024, 7, 16);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 3.1, 8.2);
  camera.lookAt(0, 0.45, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const mats = {
    cafe: new THREE.MeshStandardMaterial({ color: 0x4c3d19, roughness: 0.7, metalness: 0.05 }),
    kombu: new THREE.MeshStandardMaterial({ color: 0x354024, roughness: 0.72 }),
    moss: new THREE.MeshStandardMaterial({ color: 0x889063, roughness: 0.62 }),
    tan: new THREE.MeshStandardMaterial({ color: 0xcfbb99, roughness: 0.58 }),
    bone: new THREE.MeshStandardMaterial({ color: 0xe5d7c4, roughness: 0.5 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x354024, roughness: 0.55, side: THREE.DoubleSide }),
    leafLight: new THREE.MeshStandardMaterial({ color: 0x889063, roughness: 0.5, side: THREE.DoubleSide }),
    powder: new THREE.MeshStandardMaterial({ color: 0x6b5426, roughness: 0.92 }),
    paste: new THREE.MeshStandardMaterial({ color: 0x2f341e, roughness: 0.8 }),
    pasteLight: new THREE.MeshStandardMaterial({ color: 0x627044, roughness: 0.66 }),
    lemon: new THREE.MeshStandardMaterial({ color: 0xd7b844, roughness: 0.52 }),
    sugar: new THREE.MeshStandardMaterial({ color: 0xf4ecd9, roughness: 0.78 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0xbcc4a0,
      roughness: 0.18,
      transmission: 0.25,
      transparent: true,
      opacity: 0.55
    }),
    cone: new THREE.MeshStandardMaterial({ color: 0xd8c79b, roughness: 0.5, side: THREE.DoubleSide }),
    package: new THREE.MeshStandardMaterial({ color: 0x4c3d19, roughness: 0.62 })
  };

  const ambient = new THREE.HemisphereLight(0xfff6de, 0x263313, 1.35);
  const key = new THREE.DirectionalLight(0xffefc7, 2.15);
  key.position.set(-3, 6, 5);
  const rim = new THREE.PointLight(0xe5d7c4, 1.2, 12);
  rim.position.set(4.5, 2.6, 2.2);
  scene.add(ambient, key, rim);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(13.5, 4.2),
    new THREE.MeshStandardMaterial({ color: 0x354024, transparent: true, opacity: 0.28, roughness: 0.9 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.04;
  scene.add(floor);

  const stations = [
    makeIngredientStation(THREE, mats),
    makeMixingStation(THREE, mats),
    makeConeStation(THREE, mats),
    makePackageStation(THREE, mats)
  ];
  stations.forEach((station) => scene.add(station));

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-5.1, 1.25, 0.55),
    new THREE.Vector3(-3.4, 1.62, -0.2),
    new THREE.Vector3(-1.7, 1.18, 0.45),
    new THREE.Vector3(0, 1.55, -0.35),
    new THREE.Vector3(1.7, 1.1, 0.35),
    new THREE.Vector3(3.4, 1.5, -0.28),
    new THREE.Vector3(5.05, 1.18, 0.28)
  ]);

  const flowMaterial = new THREE.MeshStandardMaterial({
    color: 0xe5d7c4,
    emissive: 0x4c3d19,
    emissiveIntensity: 0.12,
    roughness: 0.36
  });
  const particles = Array.from({ length: 34 }, (_, index) => {
    const particle = new THREE.Mesh(new THREE.SphereGeometry(0.035 + (index % 3) * 0.012, 12, 8), flowMaterial);
    scene.add(particle);
    return particle;
  });

  const path = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 140, 0.012, 8),
    new THREE.MeshStandardMaterial({ color: 0xe5d7c4, transparent: true, opacity: 0.28 })
  );
  scene.add(path);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / Math.max(1, rect.height);
    camera.position.z = rect.width < 760 ? 10.8 : 8.2;
    camera.position.y = rect.width < 760 ? 3.8 : 3.1;
    camera.lookAt(0, 0.45, 0);
    camera.updateProjectionMatrix();
  }

  const clock = new THREE.Clock();
  function animate() {
    const elapsed = clock.getElapsedTime();
    const phase = (elapsed * 0.34) % 4;

    stations.forEach((station, index) => {
      const energy = pulse(index, phase);
      station.position.y = Math.sin(elapsed * 1.25 + index) * 0.035 + energy * 0.22;
      const scale = 1 + energy * 0.09;
      station.scale.set(scale, scale, scale);
      station.rotation.y = Math.sin(elapsed * 0.4 + index) * 0.08;
    });

    stations[0].children.forEach((child, index) => {
      child.rotation.y += 0.006 + index * 0.0008;
    });

    const mixing = stations[1];
    mixing.userData.swirl.rotation.y += 0.045;
    mixing.userData.swirl.rotation.z = Math.sin(elapsed * 1.6) * 0.18;
    mixing.userData.spoon.rotation.y = Math.sin(elapsed * 1.8) * 0.28;

    const cone = stations[2];
    cone.userData.pasteLine.scale.y = 0.68 + Math.sin(elapsed * 3.2) * 0.16;
    cone.userData.pasteLine.position.y = 0.98 + Math.sin(elapsed * 3.2) * 0.07;

    const pack = stations[3];
    pack.userData.lid.rotation.x = -0.28 + Math.sin(elapsed * 1.7) * 0.12;

    particles.forEach((particle, index) => {
      const point = curve.getPointAt((index / particles.length + elapsed * 0.075) % 1);
      particle.position.copy(point);
      particle.position.y += Math.sin(elapsed * 2.2 + index) * 0.035;
    });

    scene.rotation.y = Math.sin(elapsed * 0.18) * 0.035;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  window.addEventListener("resize", resize);
  resize();
  animate();
}

if (!canvas) {
  showFallback();
} else {
  loadThree()
    .then(createScene)
    .catch(showFallback);
}
