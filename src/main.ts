// M0 - Basic Flight Simulator
// CesiumJS + glTF aircraft

const CESIUM_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmZTVkZWJkZC1lMDdlLTQyYzMtYWIyNS01YmUzZTc4Y2JmMGIiLCJpZCI6MzkyOTEzLCJpYXQiOjE3NzE3MzAzNjh9.lNWe3qqelAGSjQAMwJv8jrHbdxKFmFYq7UB80y4O6CU';

// Flight state
const state = {
  lon: 103.9915,
  lat: 1.3644,
  alt: 500,
  heading: 90,
  speed: 0
};

// Input state
const keys: Record<string, boolean> = {};

document.addEventListener('keydown', e => keys[e.code] = true);
document.addEventListener('keyup', e => keys[e.code] = false);

// FPS counter
let frameCount = 0;
let lastFpsTime = performance.now();

function updateFPS(): void {
  frameCount++;
  const now = performance.now();
  if (now - lastFpsTime >= 1000) {
    const fps = document.getElementById('fps');
    if (fps) fps.textContent = frameCount.toString();
    frameCount = 0;
    lastFpsTime = now;
  }
}

function updatePhysics(dt: number): void {
  const turnRate = 30 * dt;
  const moveSpeed = 50 * dt;
  
  // Turn
  if (keys['ArrowLeft']) state.heading -= turnRate;
  if (keys['ArrowRight']) state.heading += turnRate;
  
  // Move
  if (keys['KeyW']) {
    state.lon += Math.sin(state.heading * Math.PI / 180) * moveSpeed / 111320;
    state.lat += Math.cos(state.heading * Math.PI / 180) * moveSpeed / 111320;
  }
  if (keys['KeyS']) {
    state.lon -= Math.sin(state.heading * Math.PI / 180) * moveSpeed / 111320;
    state.lat -= Math.cos(state.heading * Math.PI / 180) * moveSpeed / 111320;
  }
  
  // Altitude
  if (keys['KeyQ']) state.alt += moveSpeed;
  if (keys['KeyE']) state.alt -= moveSpeed;
  state.alt = Math.max(50, state.alt);
  
  // Update HUD
  const posEl = document.getElementById('pos');
  const hdgEl = document.getElementById('hdg');
  if (posEl) posEl.textContent = `${state.lon.toFixed(4)}, ${state.lat.toFixed(4)}, ${state.alt.toFixed(0)}`;
  if (hdgEl) hdgEl.textContent = ((state.heading % 360 + 360) % 360).toFixed(0);
}

async function init(): Promise<void> {
  const Cesium = (window as any).Cesium;
  if (!Cesium) {
    console.error('Cesium not loaded');
    return;
  }
  
  Cesium.Ion.defaultAccessToken = CESIUM_TOKEN;
  
  // Reset body
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  
  // Create viewer
  const viewer = new Cesium.Viewer('cesium-container', {
    terrainProvider: await Cesium.createWorldTerrainAsync(),
    baseLayerPicker: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    selectionIndicator: false,
    timeline: false,
    animation: false,
    navigationHelpButton: false,
    fullscreenButton: false,
    infoBox: false,
    shouldAnimate: false
  });
  
  // Force resize
  viewer.resize();
  const container = document.getElementById('cesium-container');
  if (container) {
    container.style.width = '100vw';
    container.style.height = '100vh';
  }
  viewer.scene.canvas.width = window.innerWidth;
  viewer.scene.canvas.height = window.innerHeight;
  
  // Add aircraft
  const aircraft = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(state.lon, state.lat, state.alt),
    model: {
      uri: 'https://cesium.com/public/Sandcastle/SampleData/models/CesiumAir/Cesium_Air.glb',
      scale: 50
    },
    label: {
      text: '✈️ F-16',
      font: '24px sans-serif',
      fillColor: Cesium.Color.YELLOW,
      pixelOffset: new Cesium.Cartesian2(0, -60)
    },
    point: {
      pixelSize: 15,
      color: Cesium.Color.RED
    }
  });
  
  // Airport marker
  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(103.9915, 1.3644, 0),
    point: { pixelSize: 12, color: Cesium.Color.CYAN },
    label: { text: '🛫 Singapore', font: '16px sans-serif' }
  });
  
  // Hide loading
  const loading = document.getElementById('loading');
  if (loading) loading.classList.add('hidden');
  
  // Game loop
  let lastTime = performance.now();
  
  function loop(): void {
    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    
    updatePhysics(dt);
    updateFPS();
    
    // Update aircraft
    aircraft.position = Cesium.Cartesian3.fromDegrees(state.lon, state.lat, state.alt);
    aircraft.orientation = Cesium.Transforms.headingPitchRollQuaternion(
      Cesium.Cartesian3.fromDegrees(state.lon, state.lat, state.alt),
      new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(state.heading), 0, 0)
    );
    
    // Chase camera
    const h = state.heading * Math.PI / 180;
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(
        state.lon - Math.sin(h) * 0.02,
        state.lat - Math.cos(h) * 0.02,
        state.alt + 300
      ),
      orientation: {
        heading: Cesium.Math.toRadians(state.heading),
        pitch: Cesium.Math.toRadians(-20),
        roll: 0
      }
    });
    
    requestAnimationFrame(loop);
  }
  
  loop();
  console.log('M0: Flight simulator initialized');
}

// Start
init();
