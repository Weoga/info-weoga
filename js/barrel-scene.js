(function () {
  // Scene
  let scene, camera, renderer, barrel, wineGlass, menuModel;
  let container, canvas;
  let animationId;
  let raycaster, mouse;
  let menuHotspot = null;

  // Lighting
  let mainDirectionalLight = null;
  let fillLight = null;
  let warmLight = null;
  let rimLight = null;
  let ambientLight = null;

  // Effects
  let dustParticles = null;

  // Parallax
  let targetCameraX = 0;
  let targetCameraY = 0;
  let currentCameraX = 0;
  let currentCameraY = 0;
  const parallaxIntensity = 0.5;
  const parallaxSmoothing = 0.08;

  let baseCameraPosition = { x: 3, y: 2, z: 5 };

  const CONFIG = {
    modelPath: "images/wine_barrel.glb",
    wineGlassPath: "images/red_wine_glass.glb",
    menuPath: "images/menu.glb",
    cameraFov: 45,
    cameraNear: 0.1,
    cameraFar: 1000,
    cameraPosition: { x: 3, y: 2, z: 5 },
    modelScale: 2.3,
    modelPosition: { x: 2.9, y: -0.2, z: 0 },
    modelRotation: { x: 0.08, y: -7.14, z: 0 },
    wineGlassScale: 5.1,
    wineGlassPosition: { x: 2.2, y: -0.5, z: 1.5 },
    wineGlassRotation: { x: 0, y: 0.3, z: 0 },
    menuScale: 0.8,
    menuPosition: { x: 0.7, y: -0.4, z: 1 },
    menuRotation: { x: 0, y: 0.5, z: 0 },
    ambientLightColor: 0xffffff,
    ambientLightIntensity: 0.4,
    directionalLightColor: 0xffffff,
    directionalLightIntensity: 0.6,
    backgroundTexture: "images/wood-background.jpg",
  };

  const MENU_HOTSPOT_LINK = "events.html#menu";
  const MENU_HOTSPOT_POSITION = { x: 0, y: 1.2, z: 0.5 };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function isMobileDevice() {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      ) || window.innerWidth <= 768
    );
  }

  function init() {
    // dont render 3d objects on mobile devices because they cant fit on the screen, and for performance reasons as well
    if (isMobileDevice()) {
      console.log("3D scene disabled on mobile device");
      return;
    }

    container = document.getElementById("hero3dContainer");
    canvas = document.getElementById("barrelCanvas");

    if (!container || !canvas) {
      console.warn("Three.js: Hero 3D container not found");
      return;
    }

    if (typeof THREE === "undefined") {
      console.error("Three.js library not loaded");
      return;
    }

    setupScene();
    setupCamera();
    setupRenderer();
    setupLighting();
    setupDustParticles();
    setupRaycaster();
    loadModel();
    loadWineGlass();
    loadMenu();
    setupParallax();

    window.addEventListener("resize", onWindowResize, false);

    animate();
  }

  function setupScene() {
    scene = new THREE.Scene();

    const floorGeometry = new THREE.PlaneGeometry(30, 30);
    const floorMaterial = new THREE.ShadowMaterial({
      opacity: 0.3,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.8;
    floor.receiveShadow = true;
    scene.add(floor);

    // load wood texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      CONFIG.backgroundTexture,
      function (texture) {
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearFilter;
        scene.background = texture;
      },
      undefined,
      function (error) {
        console.warn("Could not load background texture, using solid color");
        scene.background = new THREE.Color(0x4b2c20);
      },
    );
  }

  function setupDustParticles() {
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const opacities = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // random positions
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;

      sizes[i] = Math.random() * 0.03 + 0.01;
      opacities[i] = Math.random() * 0.5 + 0.2;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      color: 0xfff8e7,
      size: 0.04,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    dustParticles = new THREE.Points(geometry, material);
    dustParticles.userData.velocities = [];

    // random velocities
    for (let i = 0; i < particleCount; i++) {
      dustParticles.userData.velocities.push({
        x: (Math.random() - 0.5) * 0.002,
        y: Math.random() * 0.001 + 0.0005,
        z: (Math.random() - 0.5) * 0.002,
      });
    }

    scene.add(dustParticles);
  }

  function loadWineGlass() {
    if (typeof THREE.GLTFLoader === "undefined") {
      console.warn("GLTFLoader not available for wine glass");
      return;
    }

    const loader = new THREE.GLTFLoader();

    loader.load(
      CONFIG.wineGlassPath,
      function (gltf) {
        wineGlass = gltf.scene;

        wineGlass.scale.set(
          CONFIG.wineGlassScale,
          CONFIG.wineGlassScale,
          CONFIG.wineGlassScale,
        );
        wineGlass.position.set(
          CONFIG.wineGlassPosition.x,
          CONFIG.wineGlassPosition.y,
          CONFIG.wineGlassPosition.z,
        );
        wineGlass.rotation.set(
          CONFIG.wineGlassRotation.x,
          CONFIG.wineGlassRotation.y,
          CONFIG.wineGlassRotation.z,
        );

        wineGlass.traverse(function (child) {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        scene.add(wineGlass);
        console.log("Wine glass model loaded successfully");
      },
      undefined,
      function (error) {
        console.warn("Could not load wine glass model:", error);
      },
    );
  }

  function loadMenu() {
    if (typeof THREE.GLTFLoader === "undefined") {
      console.warn("GLTFLoader not available for menu");
      return;
    }

    const loader = new THREE.GLTFLoader();

    if (typeof MeshoptDecoder !== "undefined") {
      MeshoptDecoder.ready.then(function () {
        loader.setMeshoptDecoder(MeshoptDecoder);
        loadMenuModel(loader);
      });
    } else {
      loadMenuModel(loader);
    }
  }

  function loadMenuModel(loader) {
    loader.load(
      CONFIG.menuPath,
      function (gltf) {
        menuModel = gltf.scene;

        menuModel.scale.set(
          CONFIG.menuScale,
          CONFIG.menuScale,
          CONFIG.menuScale,
        );
        menuModel.position.set(
          CONFIG.menuPosition.x,
          CONFIG.menuPosition.y,
          CONFIG.menuPosition.z,
        );
        menuModel.rotation.set(
          CONFIG.menuRotation.x,
          CONFIG.menuRotation.y,
          CONFIG.menuRotation.z,
        );

        menuModel.traverse(function (child) {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        scene.add(menuModel);
        console.log("Menu model loaded successfully");

        createHotspots();
      },
      undefined,
      function (error) {
        console.warn("Could not load menu model:", error);
      },
    );
  }

  function setupCamera() {
    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(
      CONFIG.cameraFov,
      aspect,
      CONFIG.cameraNear,
      CONFIG.cameraFar,
    );
    camera.position.set(
      CONFIG.cameraPosition.x,
      CONFIG.cameraPosition.y,
      CONFIG.cameraPosition.z,
    );
    camera.lookAt(0, 0, 0);
    baseCameraPosition = { ...CONFIG.cameraPosition };
  }

  function setupRaycaster() {
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    canvas.addEventListener("click", onCanvasClick, false);
    canvas.style.pointerEvents = "auto";
  }

  function setupRenderer() {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(CONFIG.backgroundColor, CONFIG.backgroundAlpha);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.physicallyCorrectLights = true;
  }

  function setupLighting() {
    ambientLight = new THREE.AmbientLight(
      CONFIG.ambientLightColor,
      CONFIG.ambientLightIntensity,
    );
    scene.add(ambientLight);

    mainDirectionalLight = new THREE.DirectionalLight(
      CONFIG.directionalLightColor,
      CONFIG.directionalLightIntensity,
    );
    mainDirectionalLight.position.set(3.5, 6.8, 7);
    mainDirectionalLight.castShadow = true;
    mainDirectionalLight.shadow.mapSize.width = 2048;
    mainDirectionalLight.shadow.mapSize.height = 2048;
    mainDirectionalLight.shadow.camera.near = 0.5;
    mainDirectionalLight.shadow.camera.far = 50;
    mainDirectionalLight.shadow.camera.left = -10;
    mainDirectionalLight.shadow.camera.right = 10;
    mainDirectionalLight.shadow.camera.top = 10;
    mainDirectionalLight.shadow.camera.bottom = -10;
    mainDirectionalLight.shadow.bias = -0.0001;
    mainDirectionalLight.shadow.normalBias = 0.02;
    scene.add(mainDirectionalLight);

    fillLight = new THREE.DirectionalLight(0xfff5e6, 0.4);
    fillLight.position.set(-4.3, 3, -5);
    scene.add(fillLight);

    warmLight = new THREE.PointLight(0xffaa55, 0.5, 10);
    warmLight.position.set(2.7, 1, 2);
    scene.add(warmLight);

    rimLight = new THREE.DirectionalLight(0x88ccff, 0.3);
    rimLight.position.set(0.7, 5, -10);
    scene.add(rimLight);
  }

  function setupParallax() {
    document.addEventListener("mousemove", function (event) {
      const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      const mouseY = (event.clientY / window.innerHeight) * 2 - 1;

      targetCameraX = mouseX * parallaxIntensity;
      targetCameraY = -mouseY * parallaxIntensity * 0.5;
    });
  }

  function createHotspots() {
    if (!menuModel) return;

    const geometry = new THREE.SphereGeometry(0.08, 12, 12);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
    });
    menuHotspot = new THREE.Mesh(geometry, material);

    menuHotspot.position.set(
      MENU_HOTSPOT_POSITION.x,
      MENU_HOTSPOT_POSITION.y,
      MENU_HOTSPOT_POSITION.z,
    );

    menuHotspot.userData.isHotspot = true;

    const glowGeometry = new THREE.SphereGeometry(0.12, 12, 12);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.15,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);

    menuHotspot.add(glow);
    menuModel.add(menuHotspot);

    canvas.style.cursor = "default";
  }

  function onCanvasClick(event) {
    if (!menuHotspot) return;

    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(menuHotspot, true);

    if (intersects.length > 0) {
      window.location.href = MENU_HOTSPOT_LINK;
    }
  }

  function animateHotspot() {
    if (!menuHotspot) return;

    const time = Date.now() * 0.002;
    const scale = 1 + Math.sin(time) * 0.1;

    menuHotspot.scale.set(scale, scale, scale);

    if (menuHotspot.children[0]) {
      menuHotspot.children[0].material.opacity = 0.1 + Math.sin(time) * 0.08;
    }
  }

  function loadModel() {
    container.classList.add("loading");

    if (typeof THREE.GLTFLoader === "undefined") {
      console.error("GLTFLoader not loaded");
      return;
    }

    const loader = new THREE.GLTFLoader();

    loader.load(
      CONFIG.modelPath,
      function (gltf) {
        barrel = gltf.scene;

        barrel.scale.set(
          CONFIG.modelScale,
          CONFIG.modelScale,
          CONFIG.modelScale,
        );
        barrel.position.set(
          CONFIG.modelPosition.x,
          CONFIG.modelPosition.y,
          CONFIG.modelPosition.z,
        );

        barrel.rotation.set(
          CONFIG.modelRotation.x,
          CONFIG.modelRotation.y,
          CONFIG.modelRotation.z,
        );

        barrel.traverse(function (child) {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            if (child.material) {
              child.material.needsUpdate = true;
            }
          }
        });

        scene.add(barrel);
        container.classList.remove("loading");
        container.classList.add("loaded");

        console.log("Wine barrel model loaded successfully");
      },
      function (xhr) {
        if (xhr.lengthComputable) {
          const percentComplete = (xhr.loaded / xhr.total) * 100;
          console.log(
            "Loading wine barrel: " + Math.round(percentComplete) + "%",
          );
        }
      },
      function (error) {
        console.error("Error loading wine barrel model:", error);
        container.classList.remove("loading");
        container.style.display = "none";
      },
    );
  }

  function animate() {
    animationId = requestAnimationFrame(animate);

    const time = Date.now() * 0.001;

    currentCameraX += (targetCameraX - currentCameraX) * parallaxSmoothing;
    currentCameraY += (targetCameraY - currentCameraY) * parallaxSmoothing;

    camera.position.x = baseCameraPosition.x + currentCameraX;
    camera.position.y = baseCameraPosition.y + currentCameraY;
    camera.lookAt(0, 0, 0);

    if (dustParticles) {
      animateDustParticles();
    }

    animateHotspot();

    renderer.render(scene, camera);
  }

  function animateDustParticles() {
    const positions = dustParticles.geometry.attributes.position.array;
    const velocities = dustParticles.userData.velocities;

    for (let i = 0; i < velocities.length; i++) {
      positions[i * 3] += velocities[i].x;
      positions[i * 3 + 1] += velocities[i].y;
      positions[i * 3 + 2] += velocities[i].z;

      if (positions[i * 3 + 1] > 4) {
        positions[i * 3 + 1] = -4;
      }
      if (Math.abs(positions[i * 3]) > 6) {
        positions[i * 3] = (Math.random() - 0.5) * 12;
      }
      if (Math.abs(positions[i * 3 + 2]) > 4) {
        positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      }
    }

    dustParticles.geometry.attributes.position.needsUpdate = true;
  }

  function onWindowResize() {
    if (!container || !camera || !renderer) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
  }

  function dispose() {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }

    if (renderer) {
      renderer.dispose();
    }

    if (dustParticles) {
      dustParticles.geometry.dispose();
      dustParticles.material.dispose();
    }

    const tooltip = document.getElementById("hotspotTooltip");
    if (tooltip) tooltip.remove();

    window.removeEventListener("resize", onWindowResize);
    canvas.removeEventListener("click", onCanvasClick);
  }

  window.disposeBarrelScene = dispose;
})();
