import React, { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import TypingEffect from "./TypingEffect";

/* =========================================================================
   GLSL CUSTOM SHADERS FOR DYNAMIC DATA CORE
   ========================================================================= */

// 1. INNER CORE: Pulsing, morphing plasma orb using 3D Simplex Noise
const INNER_CORE_VERTEX_SHADER = `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uNoiseFreq;
  uniform float uNoiseAmp;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vNoise;

  // Ashima Arts 3D Simplex Noise
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  
  float snoise(vec3 v){
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 =   v - i + dot(i, C.xxx) ;
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - D.yyy;
    i = mod(i, 289.0 );
    vec4 p = permute( permute( permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 1.0/7.0;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                  dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    vNormal = normalize(normalMatrix * normal);
    
    // Animate noise grid over time
    vec3 noisePos = position * uNoiseFreq + vec3(0.0, uTime * uSpeed, 0.0);
    vNoise = snoise(noisePos);
    
    // Displace vertices outward along normals based on noise
    vec3 displaced = position + normal * (vNoise * uNoiseAmp);
    
    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    vPosition = mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const INNER_CORE_FRAGMENT_SHADER = `
  uniform vec3 uColor1; // Electric Blue
  uniform vec3 uColor2; // Glowing Cyan
  uniform vec3 uColor3; // Deep Violet
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vNoise;

  void main() {
    vec3 normalVec = normalize(vNormal);
    vec3 viewDir = normalize(-vPosition);
    
    // Fresnel term for edge glow
    float fresnel = pow(1.0 - max(0.0, dot(normalVec, viewDir)), 2.5);
    
    // Map noise value [-1, 1] to color blending ratio [0, 1]
    float tNoise = vNoise * 0.5 + 0.5;
    
    // Shift color base based on noise state
    vec3 color = mix(uColor1, uColor2, tNoise);
    
    // Blend with deep violet towards the outline
    color = mix(color, uColor3, fresnel * 0.3);
    
    // Inject vibrant edge emissive glow
    color += uColor2 * fresnel * 2.2;
    
    // Add sharp specular highlight points
    color += vec3(1.0) * pow(fresnel, 8.0) * 1.5;
    
    gl_FragColor = vec4(color, 0.85);
  }
`;

// 2. OUTER CORE: Glassmorphic/iridescent shell with Fresnel refraction colors
const OUTER_SHELL_VERTEX_SHADER = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewDir;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vPosition = mvPosition.xyz;
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const OUTER_SHELL_FRAGMENT_SHADER = `
  uniform vec3 uColorCyan;
  uniform vec3 uColorViolet;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewDir;

  void main() {
    vec3 normalVec = normalize(vNormal);
    vec3 viewDir = normalize(vViewDir);
    
    // Fresnel edge transparency factor
    float fresnel = pow(1.0 - max(0.0, dot(normalVec, viewDir)), 3.0);
    
    // Iridescent spectrum calculation based on surface orientation & time
    float phase = dot(normalVec, vec3(0.0, 1.0, 0.0)) * 0.5 + 0.5;
    vec3 iridescence = mix(uColorCyan, uColorViolet, sin(phase * 3.14159 + uTime * 0.4) * 0.5 + 0.5);
    
    // Dynamic glass transmission opacity (solid edge, transparent center)
    float glassAlpha = mix(0.1, 0.75, fresnel);
    vec3 glassBaseColor = mix(vec3(0.03, 0.02, 0.07), iridescence, fresnel * 0.9);
    
    // Faux-reflective shine from infinite light source
    vec3 lightDir = normalize(vec3(5.0, 10.0, 4.0));
    vec3 halfDir = normalize(lightDir + viewDir);
    float spec = pow(max(0.0, dot(normalVec, halfDir)), 64.0);
    glassBaseColor += vec3(1.0) * spec * 0.85;
    
    gl_FragColor = vec4(glassBaseColor, glassAlpha);
  }
`;

/* =========================================================================
   3D DATA CORE SUB-COMPONENT
   ========================================================================= */
function DataCore() {
  const outerGroupRef = useRef();
  const innerMeshRef = useRef();
  const outerMeshRef = useRef();
  const wireMeshRef = useRef();
  const ringsRef = useRef();

  const { pointer, viewport } = useThree();
  const isDesktop = viewport.width > 6.5;
  const targetX = isDesktop ? viewport.width * 0.22 : 0;
  const targetY = isDesktop ? 0 : 0.8;

  // Color mappings: Gold and Silver metallic spectrum
  const colors = useMemo(
    () => ({
      goldLight: new THREE.Color("#FFE082"), // Warm light gold
      goldDark: new THREE.Color("#FFB300"), // Deep amber gold
      silverLight: new THREE.Color("#FFFFFF"), // Pure bright platinum
      silverDark: new THREE.Color("#9E9E9E"), // Metallic chrome grey
      bgDark: new THREE.Color("#181612"), // Deep bronze shadow backdrop
    }),
    [],
  );

  // Pre-allocate uniforms to avoid GC overhead
  const innerUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSpeed: { value: 0.6 },
      uNoiseFreq: { value: 1.2 },
      uNoiseAmp: { value: 0.25 },
      uColor1: { value: colors.goldDark },
      uColor2: { value: colors.goldLight },
      uColor3: { value: colors.bgDark },
    }),
    [colors],
  );

  const outerUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColorCyan: { value: colors.silverLight },
      uColorViolet: { value: colors.goldLight },
    }),
    [colors],
  );

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // 1. Update Custom Shaders time uniform
    innerUniforms.uTime.value = time;
    outerUniforms.uTime.value = time;

    // 2. Continuous idle rotation
    if (innerMeshRef.current) {
      innerMeshRef.current.rotation.y = -time * 0.15;
      innerMeshRef.current.rotation.x = time * 0.08;
    }
    if (outerMeshRef.current) {
      outerMeshRef.current.rotation.y = time * 0.05;
    }
    if (wireMeshRef.current) {
      wireMeshRef.current.rotation.y = -time * 0.08;
      wireMeshRef.current.rotation.z = time * 0.04;
    }
    if (ringsRef.current) {
      ringsRef.current.rotation.x = time * 0.2;
      ringsRef.current.rotation.y = time * 0.1;
    }

    // 3. Mouse Parallax/Tilt: core leans towards mouse cursor
    const targetTiltX = -pointer.y * 0.45;
    const targetTiltY = pointer.x * 0.45;

    outerGroupRef.current.rotation.x +=
      (targetTiltX - outerGroupRef.current.rotation.x) * 0.08;
    outerGroupRef.current.rotation.y +=
      (targetTiltY - outerGroupRef.current.rotation.y) * 0.08;

    // Smooth horizontal position slide + vertical float
    outerGroupRef.current.position.x +=
      (targetX - outerGroupRef.current.position.x) * 0.08;
    outerGroupRef.current.position.y +=
      (targetY +
        Math.sin(time * 0.8) * 0.15 -
        outerGroupRef.current.position.y) *
      0.08;
  });

  return (
    <group ref={outerGroupRef} scale={1.4}>
      {/* 1. Inner Plasma Morphing Core */}
      <mesh ref={innerMeshRef}>
        <icosahedronGeometry args={[1.5, 4]} />
        <shaderMaterial
          vertexShader={INNER_CORE_VERTEX_SHADER}
          fragmentShader={INNER_CORE_FRAGMENT_SHADER}
          uniforms={innerUniforms}
          transparent={true}
          depthWrite={true}
        />
      </mesh>

      {/* 2. Outer Glassmorphic Iridescent Shell */}
      <mesh ref={outerMeshRef}>
        <sphereGeometry args={[2.0, 64, 64]} />
        <shaderMaterial
          vertexShader={OUTER_SHELL_VERTEX_SHADER}
          fragmentShader={OUTER_SHELL_FRAGMENT_SHADER}
          uniforms={outerUniforms}
          transparent={true}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </mesh>

      {/* 3. Futuristic Grid Layer (Subtle Wireframe overlay) */}
      <mesh ref={wireMeshRef}>
        <icosahedronGeometry args={[2.04, 2]} />
        <meshBasicMaterial
          color="#FFE082"
          wireframe={true}
          transparent={true}
          opacity={0.12}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 4. Glowing Data Access Rings — logos ride on each rim */}
      <group ref={ringsRef}>
        {/* Ring 1: gold equatorial ring — logos in local XY plane (before PI/2 X rotation) */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.4, 0.025, 8, 100]} />
          <meshBasicMaterial
            color="#FFB300"
            transparent={true}
            opacity={0.5}
            blending={THREE.AdditiveBlending}
          />
          {RING1_LOGOS.map((logo, i) => {
            const angle = (i / RING1_LOGOS.length) * Math.PI * 2;
            const r = 2.4;
            return (
              <mesh key={logo.id} position={[Math.cos(angle) * r, Math.sin(angle) * r, 0]}>
                <RingLogo logo={logo} />
              </mesh>
            );
          })}
        </mesh>

        {/* Ring 2: white tilted ring — logos in local XY plane (before tilt rotation) */}
        <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
          <torusGeometry args={[2.6, 0.018, 8, 100]} />
          <meshBasicMaterial
            color="#FFFFFF"
            transparent={true}
            opacity={0.3}
            blending={THREE.AdditiveBlending}
          />
          {RING2_LOGOS.map((logo, i) => {
            const angle = (i / RING2_LOGOS.length) * Math.PI * 2;
            const r = 2.6;
            return (
              <mesh key={logo.id} position={[Math.cos(angle) * r, Math.sin(angle) * r, 0]}>
                <RingLogo logo={logo} />
              </mesh>
            );
          })}
        </mesh>
      </group>
    </group>
  );
}

/* =========================================================================
   ANTI-GRAVITY PARTICLE SYSTEM SUB-COMPONENT (Instanced for 60fps performance)
   ========================================================================= */
const PARTICLE_COUNT = 300;

function AntiGravityParticles() {
  const meshRef = useRef();
  const { viewport, pointer } = useThree();

  // Create references to store particle physics state, bypassing React state re-renders
  const particles = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3); // Base particle coordinates [x, y, z]
    const offsets = new Float32Array(PARTICLE_COUNT * 3); // Current repulsion offsets [x, y, z]
    const phases = new Float32Array(PARTICLE_COUNT); // Horizontal drift phases
    const speeds = new Float32Array(PARTICLE_COUNT); // Floating speeds
    const scales = new Float32Array(PARTICLE_COUNT); // Individual particle scale factors

    const palette = [
      new THREE.Color("#FFE082"), // Soft Gold
      new THREE.Color("#FFB300"), // Amber Gold
      new THREE.Color("#E0E0E0"), // Silver
      new THREE.Color("#FFFFFF"), // Platinum White
      new THREE.Color("#9E9E9E"), // Chrome Grey
    ];

    const colors = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Position particles in a vertical column enclosing the viewport width
      pos[i * 3] = (Math.random() - 0.5) * (viewport.width * 1.5);
      pos[i * 3 + 1] = (Math.random() - 0.5) * (viewport.height * 1.8);
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 2; // Scatter depth slightly back

      offsets[i * 3] = 0;
      offsets[i * 3 + 1] = 0;
      offsets[i * 3 + 2] = 0;

      phases[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.3 + Math.random() * 0.7; // Vertical upward speed
      scales[i] = 0.15 + Math.random() * 0.45; // Varying shards scale

      // Assign a random color from the neon palette
      const randomColor = palette[Math.floor(Math.random() * palette.length)];
      colors.push(randomColor);
    }

    return { pos, offsets, phases, speeds, scales, colors };
  }, [viewport]);

  // Apply initial particle colors to InstancedMesh on mount
  useEffect(() => {
    if (meshRef.current) {
      particles.colors.forEach((color, index) => {
        meshRef.current.setColorAt(index, color);
      });
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [particles]);

  // Preallocate objects inside useMemo/useRef to avoid garbage collection hitches
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();
    const vW = viewport.width;
    const vH = viewport.height;

    // Convert mouse NDC to world space on the projection plane z = 0
    const mouseX = pointer.x * vW * 0.5;
    const mouseY = pointer.y * vH * 0.5;

    // Physics tuning parameters
    const repulsionRadius = 2.4;
    const repulsionForce = 2.2;
    const lerpDamping = 0.08;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      // 1. Anti-Gravity Upward Float update
      // Increment baseline Y position
      particles.pos[i3 + 1] += particles.speeds[i] * 0.025;

      // Seamless boundaries looping: if particle floats out of bounds, respawn at the bottom
      if (particles.pos[i3 + 1] > vH * 0.9) {
        particles.pos[i3 + 1] = -vH * 0.9;
        particles.pos[i3] = (Math.random() - 0.5) * (vW * 1.5);
        particles.pos[i3 + 2] = (Math.random() - 0.5) * 6 - 2;
        // Reset offsets immediately on respawn
        particles.offsets[i3] = 0;
        particles.offsets[i3 + 1] = 0;
      }

      // Add gentle horizontal drift using a trigonometric sine wave
      const baseDriftX = Math.sin(time * 0.6 + particles.phases[i]) * 0.15;
      const baseDriftZ = Math.cos(time * 0.4 + particles.phases[i]) * 0.08;

      const currentX = particles.pos[i3] + baseDriftX;
      const currentY = particles.pos[i3 + 1];
      const currentZ = particles.pos[i3 + 2];

      // 2. Mouse Repulsion Math (Deflection Physics)
      // Vector from cursor to particle (2D distance mapping for high projection sensitivity)
      const dx = currentX - mouseX;
      const dy = currentY - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let targetOffsetX = 0;
      let targetOffsetY = 0;

      if (dist < repulsionRadius) {
        // Inverse-quadratic repulsion intensity
        const strength =
          Math.pow(1.0 - dist / repulsionRadius, 2) * repulsionForce;

        // Push vector along normal from cursor
        targetOffsetX = (dx / (dist + 0.001)) * strength;
        targetOffsetY = (dy / (dist + 0.001)) * strength;
      }

      // Smoothly interpolate current repulsion offset towards target
      particles.offsets[i3] +=
        (targetOffsetX - particles.offsets[i3]) * lerpDamping;
      particles.offsets[i3 + 1] +=
        (targetOffsetY - particles.offsets[i3 + 1]) * lerpDamping;

      // Combine floating baseline and repulsion steering offset
      const finalX = currentX + particles.offsets[i3];
      const finalY = currentY + particles.offsets[i3 + 1];
      const finalZ = currentZ + baseDriftZ;

      // 3. Render Instance Update
      dummy.position.set(finalX, finalY, finalZ);
      dummy.scale.setScalar(particles.scales[i]);

      // Rotate shards slowly over time
      dummy.rotation.set(
        time * 0.15 + particles.phases[i],
        time * 0.25 + particles.phases[i],
        0,
      );

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, PARTICLE_COUNT]}>
      {/* OctahedronGeometry: low poly diamond structure, perfect for data shards */}
      <octahedronGeometry args={[0.075, 0]} />
      <meshBasicMaterial transparent={true} opacity={0.8} />
    </instancedMesh>
  );
}

/* =========================================================================
   TECH LOGOS FOR RINGS — 6 per ring rim
   ========================================================================= */

// Ring 1 (gold equatorial ring, radius 2.4)
const RING1_LOGOS = [
  // Web Development
  {
    id: "html",
    label: "HTML5",
    color: "#E44D26",
    glow: "rgba(228,77,38,0.7)",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 452 520"><path fill="#E44D26" d="M41 460L0 0h452l-41 460-185 52z"/><path fill="#F16529" d="M226 472l149-41 35-394H226z"/><path fill="#EBEBEB" d="M226 208H123l-7-80h110v-78H47l21 238h158zm0 147l-128-35-9-97H109l5 53 112 31z"/><path fill="#fff" d="M226 208v78h96l-9 103-87 24v81l159-44 22-242zm0-158v78h188l-7-78z"/></svg>`,
    orbit: 2.4,
  },
  {
    id: "css",
    label: "CSS3",
    color: "#264DE4",
    glow: "rgba(38,77,228,0.9)",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 452 520"><path fill="#264DE4" d="M41 460L0 0h452l-41 460-185 52z"/><path fill="#2965F1" d="M226 472l149-41 35-394H226z"/><path fill="#EBEBEB" d="M226 208H109l7 80h110v-78zm-103-80l7 80h96v-80H123zm103 235l-112-31-8-97H89l16 173 121 34zm0-78l-87-24-5-53H113l9 97 104 29z"/><path fill="#fff" d="M226 208v78h84l-8 103-76 21v81l149-41 22-242zm0-80v80h188l-7-80z"/></svg>`,
    orbit: 2.4,
  },
  {
    id: "js",
    label: "JS",
    color: "#F7DF1E",
    glow: "rgba(247,223,30,0.9)",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 630 630"><rect width="630" height="630" fill="#f7df1e"/><path d="M423.2 492.19c12.69 20.72 29.2 35.95 58.4 35.95 24.53 0 40.2-12.26 40.2-29.2 0-20.28-16.1-27.49-43.1-39.3l-14.8-6.35c-42.72-18.2-71.1-41-71.1-89.2 0-44.4 33.83-78.2 86.7-78.2 37.64 0 64.7 13.1 84.2 47.4l-46.1 29.6c-10.15-18.2-21.1-25.37-38.1-25.37-17.34 0-28.33 11-28.33 25.37 0 17.76 11 24.97 36.4 35.95l14.8 6.34c50.3 21.57 78.7 43.56 78.7 93 0 53.3-41.87 82.5-98.1 82.5-54.98 0-90.5-26.2-107.88-60.54zm-209.13 5.13c9.3 16.5 17.76 30.45 37.93 30.45 19.3 0 31.45-7.54 31.45-36.85V288.1h57.2v204.03c0 60.7-35.6 88.3-87.6 88.3-46.97 0-74.15-24.3-88.15-53.4z"/></svg>`,
    orbit: 2.4,
  },
  {
    id: "react",
    label: "React",
    color: "#61DAFB",
    glow: "rgba(97,218,251,0.9)",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-11.5 -10.232 23 20.463"><circle r="2.05" fill="#61dafb"/><g stroke="#61dafb" stroke-width="1" fill="none"><ellipse rx="11" ry="4.2"/><ellipse rx="11" ry="4.2" transform="rotate(60)"/><ellipse rx="11" ry="4.2" transform="rotate(120)"/></g></svg>`,
    orbit: 2.4,
  },
  {
    id: "android",
    label: "Android",
    color: "#3DDC84",
    glow: "rgba(61,220,132,0.9)",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#3DDC84" d="M9.4 24c0-8.1 6.6-14.6 14.6-14.6S38.6 15.9 38.6 24H9.4zm14.6-18.2c-4.1 0-7.8 1.7-10.5 4.5l-2.3-2.3c-.4-.4-.4-1 0-1.4s1-.4 1.4 0l2.1 2.1C17.5 7.3 20.6 6 24 6c3.4 0 6.5 1.3 8.8 3.4l2.1-2.1c.4-.4 1-.4 1.4 0s.4 1 0 1.4l-2.3 2.3C31.3 8.5 27.7 5.8 24 5.8zM15 26.5c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm22 0c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zM9 24h30v12c0 2.2-1.8 4-4 4H13c-2.2 0-4-1.8-4-4V24z"/></svg>`,
    orbit: 2.4,
  },
  {
    id: "flutter",
    label: "Flutter",
    color: "#54C5F8",
    glow: "rgba(84,197,248,0.9)",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><polygon fill="#54C5F8" points="26,4 6,24 13,31 40,4"/><polygon fill="#01579B" points="26,44 40,44 28.5,32.5 21.5,32.5"/><polygon fill="#29B6F6" points="13,31 21.5,32.5 35,19 28,12"/><polygon fill="#00B4D8" points="21.5,32.5 28.5,32.5 21.5,39.5"/></svg>`,
    orbit: 2.4,
  },
];

// Ring 2 (white tilted ring, radius 2.6)
const RING2_LOGOS = [
  {
    id: "python",
    label: "Python",
    color: "#3776AB",
    glow: "rgba(55,118,171,0.9)",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 110"><path fill="#3776AB" d="M54.9 8C31 8 32.5 18 32.5 18l0 10.5h23v3.5H22.5S8 30.5 8 54.5s13 21.5 13 21.5h7.5v-10.5S28 54 41 54h22.5s12 .2 12-11.5V19.5S77.5 8 54.9 8zM43 23.5c2.1 0 3.8 1.7 3.8 3.8s-1.7 3.8-3.8 3.8-3.8-1.7-3.8-3.8 1.7-3.8 3.8-3.8z"/><path fill="#FFC331" d="M55.1 102c23.9 0 22.4-10 22.4-10V81.5h-23V78H87.5S102 79.5 102 55.5 89 34 89 34h-7.5v10.5S82 56 69 56H46.5S34.5 55.8 34.5 67.5V90.5S31.5 102 55.1 102zM67 86.5c-2.1 0-3.8-1.7-3.8-3.8s1.7-3.8 3.8-3.8 3.8 1.7 3.8 3.8-1.7 3.8-3.8 3.8z"/></svg>`,
    orbit: 2.6,
  },
  {
    id: "aws",
    label: "AWS",
    color: "#FF9900",
    glow: "rgba(255,153,0,0.9)",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 304 182"><path fill="#FF9900" d="M86.4 66.4c0 3.7.4 6.7 1.1 8.9.8 2.2 1.8 4.6 3.2 7.2.5.8.7 1.6.7 2.3 0 1-.6 2-1.9 3l-6.3 4.2c-.9.6-1.8.9-2.6.9-1 0-2-.5-3-1.4-1.4-1.5-2.6-3.1-3.6-4.7-1-1.7-2-3.6-3.1-5.9-7.8 9.2-17.6 13.8-29.4 13.8-8.4 0-15.1-2.4-20-7.2-4.9-4.8-7.4-11.2-7.4-19.2 0-8.5 3-15.4 9.1-20.6 6.1-5.2 14.2-7.8 24.5-7.8 3.4 0 6.9.3 10.6.8 3.7.5 7.5 1.3 11.5 2.2v-7.3c0-7.6-1.6-12.9-4.7-16-3.2-3.1-8.6-4.6-16.3-4.6-3.5 0-7.1.4-10.8 1.3-3.7.9-7.3 2-10.8 3.4-1.6.7-2.8 1.1-3.5 1.3-.7.2-1.2.3-1.6.3-1.4 0-2.1-1-2.1-3.1v-4.9c0-1.6.2-2.8.7-3.5.5-.7 1.4-1.4 2.8-2.1 3.5-1.8 7.7-3.3 12.6-4.5 4.9-1.3 10.1-1.9 15.6-1.9 11.9 0 20.6 2.7 26.2 8.1 5.5 5.4 8.3 13.6 8.3 24.6v32.4zm-40.6 15.2c3.3 0 6.7-.6 10.3-1.8 3.6-1.2 6.8-3.4 9.5-6.4 1.6-1.9 2.8-4 3.4-6.4.6-2.4 1-5.3 1-8.7v-4.2c-2.9-.7-6-.1-9.2-.5-3.2-.4-6.5-.6-9.8-.6-7 0-12.1 1.4-15.5 4.3-3.4 2.9-5.1 7-5.1 12.3 0 5 1.3 8.7 4 11.3 2.6 2.7 6.4 4 11.4 4zm83.5 11.2c-1.8 0-3-.3-3.8-1-.8-.6-1.5-2-2.1-3.9L100.2 10c-.6-2-.9-3.3-.9-4 0-1.6.8-2.5 2.4-2.5h9.8c1.9 0 3.2.3 3.9 1 .8.6 1.4 2 2 3.9l17.5 69 16.2-69c.5-2 1.1-3.3 1.9-3.9.8-.6 2.2-1 4-1h8c1.9 0 3.2.3 4 1 .8.6 1.5 2 1.9 3.9l16.4 69.8 18-69.8c.6-2 1.3-3.3 2-3.9.8-.6 2.1-1 3.9-1h9.3c1.6 0 2.5.8 2.5 2.5 0 .5-.1 1-.2 1.6-.1.6-.3 1.4-.7 2.5l-24.1 77.9c-.6 2-1.3 3.3-2.1 3.9-.8.6-2.1 1-3.8 1h-8.6c-1.9 0-3.2-.3-4-1-.8-.7-1.5-2-1.9-4L156 27l-16.1 65.2c-.5 2-1.1 3.3-1.9 4-.8.7-2.2 1-4 1h-8.7zm129.1 2.7c-5.2 0-10.4-.6-15.4-1.8-5-1.2-8.9-2.5-11.5-4-1.6-.9-2.7-1.9-3.1-2.8-.4-.9-.6-1.9-.6-2.8v-5.1c0-2.1.8-3.1 2.3-3.1.6 0 1.2.1 1.8.3.6.2 1.5.6 2.5 1 3.4 1.5 7.1 2.7 11 3.5 4 .8 7.9 1.2 11.9 1.2 6.3 0 11.2-1.1 14.6-3.3 3.4-2.2 5.2-5.4 5.2-9.5 0-2.8-.9-5.1-2.7-7-1.8-1.9-5.2-3.6-10.1-5.2l-14.5-4.5c-7.3-2.3-12.7-5.7-16-10.2-3.3-4.4-5-9.3-5-14.5 0-4.2.9-7.9 2.7-11.1 1.8-3.2 4.2-6 7.2-8.2 3-2.3 6.4-4 10.4-5.2 4-1.2 8.2-1.7 12.6-1.7 2.2 0 4.5.1 6.7.4 2.3.3 4.4.7 6.5 1.1 2 .5 3.9 1 5.7 1.6 1.8.6 3.2 1.2 4.2 1.8 1.4.8 2.4 1.6 3 2.5.6.8.9 1.9.9 3.3v4.7c0 2.1-.8 3.2-2.3 3.2-.8 0-2.1-.4-3.8-1.2-5.7-2.6-12.1-3.9-19.2-3.9-5.7 0-10.2.9-13.3 2.8-3.1 1.9-4.7 4.8-4.7 8.8 0 2.8 1 5.2 3 7.1 2 1.9 5.7 3.8 11 5.5l14.2 4.5c7.2 2.3 12.4 5.5 15.5 9.6 3.1 4.1 4.6 8.8 4.6 14 0 4.3-.9 8.2-2.6 11.6-1.8 3.4-4.2 6.4-7.3 8.8-3.1 2.5-6.8 4.3-11.1 5.6-4.5 1.4-9.2 2.1-14.4 2.1z"/></svg>`,
    orbit: 2.6,
  },
  {
    id: "docker",
    label: "Docker",
    color: "#2496ED",
    glow: "rgba(36,150,237,0.9)",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#2396ed" d="M47.527 19.847a13.4 13.4 0 0 0-5.929-2.427c-.344-2.836-1.799-5.307-4.232-7.745l-1.44-1.428-.657 1.883C34.14 13.3 33.709 16.212 34.465 19c-1.034-.603-3.062-1.375-5.929-.963L27 18.18l-.143 1.526c-.367 3.905 1.207 7.764 4.378 10.265C28.85 31.041 25.486 31.5 24 31.5H1.021l-.171.926C.3 35.501.339 37.6.972 39.878c.669 2.408 1.884 4.183 3.613 5.272C6.584 46.374 9.423 47 12.735 47c2.699 0 5.261-.524 7.658-1.556 3.476-1.496 6.51-4.044 8.986-7.557.985.067 2.064.138 3.071.138 3.933 0 6.405-1.56 7.754-2.869a10.5 10.5 0 0 0 2.374-3.664l.33-.98-.997-.012c.024 0-.136-.001-.136-.001a11.6 11.6 0 0 0 4.52-5.225l.393-.959-.964-.467z"/></svg>`,
    orbit: 2.6,
  },
  {
    id: "nodejs",
    label: "Node.js",
    color: "#68A063",
    glow: "rgba(104,160,99,0.9)",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#21a366" d="M24.007 45.419a4.4 4.4 0 0 1-2.217-.589L17 41.684c-.677-.381-.348-.519-.122-.594.894-.307 1.076-.375 2.026-.912.099-.057.232-.035.332.022l4.099 2.438c.148.083.361.083.496 0l15.956-9.232c.148-.085.242-.256.242-.432V14.017c0-.18-.094-.35-.245-.438L24.007 4.354c-.147-.087-.358-.087-.504 0L7.561 13.579c-.152.087-.248.26-.248.438v18.441c0 .175.096.344.248.432l4.373 2.534c2.379 1.188 3.832-.211 3.832-1.621V15.208c0-.26.21-.467.469-.467h2.05c.258 0 .469.207.469.467v18.594c0 3.173-1.729 4.994-4.735 4.994-.925 0-1.654 0-3.68-1.001l-4.188-2.42A4.4 4.4 0 0 1 3.984 31.4V12.959A4.4 4.4 0 0 1 6.2 9.157l15.956-9.232c1.34-.779 3.122-.779 4.451 0l15.956 9.232A4.4 4.4 0 0 1 44.784 12.96v18.441a4.4 4.4 0 0 1-2.218 3.802L26.61 44.435a4.4 4.4 0 0 1-2.219.594z"/></svg>`,
    orbit: 2.6,
  },
  {
    id: "typescript",
    label: "TypeScript",
    color: "#3178C6",
    glow: "rgba(49,120,198,0.9)",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#3178c6"/><path fill="#fff" d="M87.7 200.7V217h52v148h36.9V217h52v-16c0-9 0-16.3-.4-16.5-.3-.3-31.7-.4-70-.4l-69.7.3v16.3zM321.4 184c10.2 2.4 18 7 25 14.3 3.7 3.9 9.2 11 9.6 12.8.1.5-17.3 12.3-27.8 18.8-.4.3-2-1.4-3.6-3.9-5.2-7.4-10.5-10.6-18.8-11.2-12.1-.8-20 5.5-19.9 16 0 3.1.5 4.9 1.8 7.4 2.7 5.5 7.7 8.8 23.2 15.6 28.6 12.3 40.9 20.4 48.5 31.9 8.5 12.8 10.4 33.3 4.7 48.5-6.4 16.4-22.2 27.5-44.5 31.2-6.9 1.2-23.1 1-30.5-.3-16.1-2.9-31.4-11-40.8-21.9-3.7-4.2-10.9-15.4-10.5-16.2.2-.3 3.8-2.4 8-4.7 4.2-2.2 11.2-6.3 15.6-9l7.9-4.8 2.6 3.7c3.6 5.5 11.5 13 16.3 15.5 13.7 7.2 32.6 6.2 41.9-2.1 3.7-3.4 5.2-7 5.2-12.2 0-4.7-.6-6.8-3-10.3-3.1-4.5-9.4-8.3-27.3-16.1-20.5-8.9-29.3-14.4-37.3-23.1-4.8-5.2-9.3-13.6-11.2-20.6-1.5-5.9-1.9-20.6-.7-26.5 4.3-21.3 19.5-36.1 40.9-40.4 7-1.4 23.2-1 29.8.7z"/></svg>`,
    orbit: 2.6,
  },
  {
    id: "mongodb",
    label: "MongoDB",
    color: "#47A248",
    glow: "rgba(71,162,72,0.9)",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="#47A248" d="M15.9.087l.854 1.604c.192.296.4.492.645.69C20.6 4.924 22.47 8.36 22.47 12.37c0 4.73-2.687 8.825-6.614 10.83l-.254.118s-.318-2.25-.45-2.618c-.576-1.658-2.205-2.776-3.083-4.284a8.2 8.2 0 0 1-.926-3.08c-.297-2.988.914-5.65 2.964-7.63.394-.38.788-.783 1.166-1.205L15.9.088zm.603 28.423s.17-.11.375-.33C16.85 28.1 17 27.99 17 27.99S17 28.5 17 29c0 1.104 0 2 0 2s-1.073-1.66-1.073-2.48c0-.57.576-.01.576-.01zm-.28-2.868c-.198.033-.39.077-.578.13 0 0-.173-.608-.394-.963-.337-.542-.796-.89-1.175-1.39a8.7 8.7 0 0 1-.92-1.78 8.2 8.2 0 0 1-.52-2.89c0-.63.07-1.24.2-1.83.33 1.43 1.15 2.61 2.1 3.63.844.9 1.72 1.65 2.19 2.83.17.42.27.87.27 1.34 0 .48-.097.93-.27 1.34-.34-.19-.655-.44-.903-.42z"/></svg>`,
    orbit: 2.6,
  },
];

// Helper: render a single bare SVG logo (no background box)
function RingLogo({ logo }) {
  return (
    <Html
      center
      distanceFactor={9}
      zIndexRange={[0, 15]}
      style={{ pointerEvents: "none" }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "3px",
          filter: `drop-shadow(0 0 7px ${logo.color}) drop-shadow(0 0 14px ${logo.color}88)`,
          animation: "techLogoFloat 3s ease-in-out infinite",
          animationDelay: `${Math.random() * 2}s`,
        }}
      >
        <div
          style={{ width: "30px", height: "30px" }}
          dangerouslySetInnerHTML={{ __html: logo.svg }}
        />
        <span
          style={{
            fontSize: "8px",
            fontWeight: "800",
            color: logo.color,
            textShadow: `0 0 10px ${logo.glow}`,
            letterSpacing: "0.8px",
            fontFamily: "'DM Sans', sans-serif",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {logo.label}
        </span>
      </div>
    </Html>
  );
}

/* =========================================================================
   MAIN HERO COMPONENT (Includes HTML layout and Canvas backdrop)
   ========================================================================= */
export default function HeroSection3D() {
  const handleExploreServices = (e) => {
    e.preventDefault();
    const servicesSection = document.getElementById("services");
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: "smooth" });
      window.history.pushState(null, null, "#services");
    }
  };

  const handleGetInTouch = (e) => {
    e.preventDefault();
    const contactSection = document.getElementById("contact");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" });
      window.history.pushState(null, null, "#contact");
    }
  };

  return (
    <section id="home">
      {/* 3D WebGL Canvas container */}
      <div className="hero-bg" style={{ pointerEvents: "auto" }}>
        <Canvas
          dpr={[1, 2]} // Performance limit pixel ratio on retina screens
          camera={{ position: [0, 0, 11.5], fov: 45 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        >
          {/* Volumetric ambient lighting */}
          <ambientLight intensity={0.5} />

          {/* Key lights for shiny specs */}
          <directionalLight
            position={[10, 10, 10]}
            intensity={1.5}
            color="#ffffff"
          />
          <directionalLight
            position={[-10, -10, -5]}
            intensity={1.2}
            color="#7a00ff"
          />
          <directionalLight
            position={[5, -5, 5]}
            intensity={0.8}
            color="#00f3ff"
          />

          <DataCore />
          <AntiGravityParticles />
        </Canvas>
      </div>

      {/* Hero Content Overlay (Matching original HTML/CSS classes) */}
      <div className="hero-content">
        <div className="hero-badge">
          <span className="badge-dot"></span>
          <TypingEffect />
        </div>

        <h1 className="hero-title">
          Innovating the Future with
          <br />
          <span className="grad">AI-Powered Digital</span> Solutions
        </h1>

        <p className="hero-sub">
          We build intelligent software, mobile apps, websites, and automation
          systems that transform your business and drive innovation.
        </p>

        <div className="hero-btns">
          <a
            href="#services"
            className="btn-primary"
            onClick={handleExploreServices}
          >
            Explore Services
          </a>
          <a href="#contact" className="btn-ghost" onClick={handleGetInTouch}>
            Get In Touch
          </a>
        </div>

        <div className="hero-stats">
          <div className="stat-item">
            <div className="stat-num">15+</div>
            <div className="stat-label">Projects Delivered</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">50+</div>
            <div className="stat-label">Happy Clients</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">100%</div>
            <div className="stat-label">Client Satisfaction</div>
          </div>
        </div>
      </div>
    </section>
  );
}
