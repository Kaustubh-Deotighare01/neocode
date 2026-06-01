import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import TypingEffect from './TypingEffect';

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

  const { pointer } = useThree();

  // Color mappings
  const colors = useMemo(() => ({
    cyan: new THREE.Color('#00f3ff'),
    violet: new THREE.Color('#7a00ff'),
    blue: new THREE.Color('#0044ff'),
    darkViolet: new THREE.Color('#21004a')
  }), []);

  // Pre-allocate uniforms to avoid GC overhead
  const innerUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uSpeed: { value: 0.6 },
    uNoiseFreq: { value: 1.2 },
    uNoiseAmp: { value: 0.25 },
    uColor1: { value: colors.blue },
    uColor2: { value: colors.cyan },
    uColor3: { value: colors.darkViolet }
  }), [colors]);

  const outerUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColorCyan: { value: colors.cyan },
    uColorViolet: { value: colors.violet }
  }), [colors]);

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
    // pointer.x/y is normalized device coordinates [-1, 1]
    const targetTiltX = -pointer.y * 0.45;
    const targetTiltY = pointer.x * 0.45;

    outerGroupRef.current.rotation.x += (targetTiltX - outerGroupRef.current.rotation.x) * 0.08;
    outerGroupRef.current.rotation.y += (targetTiltY - outerGroupRef.current.rotation.y) * 0.08;

    // Gentle floating translation overlay
    outerGroupRef.current.position.y = Math.sin(time * 0.8) * 0.15;
  });

  return (
    <group ref={outerGroupRef}>
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
          color="#00f3ff"
          wireframe={true}
          transparent={true}
          opacity={0.12}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 4. Glowing Data Access Rings */}
      <group ref={ringsRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.4, 0.02, 8, 100]} />
          <meshBasicMaterial
            color="#7a00ff"
            transparent={true}
            opacity={0.4}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
          <torusGeometry args={[2.6, 0.015, 8, 100]} />
          <meshBasicMaterial
            color="#00f3ff"
            transparent={true}
            opacity={0.25}
            blending={THREE.AdditiveBlending}
          />
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
    const pos = new Float32Array(PARTICLE_COUNT * 3);     // Base particle coordinates [x, y, z]
    const offsets = new Float32Array(PARTICLE_COUNT * 3); // Current repulsion offsets [x, y, z]
    const phases = new Float32Array(PARTICLE_COUNT);      // Horizontal drift phases
    const speeds = new Float32Array(PARTICLE_COUNT);      // Floating speeds
    const scales = new Float32Array(PARTICLE_COUNT);      // Individual particle scale factors

    const palette = [
      new THREE.Color('#00f3ff'), // Glowing Cyan
      new THREE.Color('#0044ff'), // Electric Blue
      new THREE.Color('#7a00ff'), // Deep Violet
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
        const strength = Math.pow(1.0 - dist / repulsionRadius, 2) * repulsionForce;
        
        // Push vector along normal from cursor
        targetOffsetX = (dx / (dist + 0.001)) * strength;
        targetOffsetY = (dy / (dist + 0.001)) * strength;
      }

      // Smoothly interpolate current repulsion offset towards target
      particles.offsets[i3] += (targetOffsetX - particles.offsets[i3]) * lerpDamping;
      particles.offsets[i3 + 1] += (targetOffsetY - particles.offsets[i3 + 1]) * lerpDamping;

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
        0
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
   MAIN HERO COMPONENT (Includes HTML layout and Canvas backdrop)
   ========================================================================= */
export default function HeroSection3D() {
  const handleExploreServices = (e) => {
    e.preventDefault();
    const servicesSection = document.getElementById('services');
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth' });
      window.history.pushState(null, null, '#services');
    }
  };

  const handleGetInTouch = (e) => {
    e.preventDefault();
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
      window.history.pushState(null, null, '#contact');
    }
  };

  return (
    <section id="home">
      {/* 3D WebGL Canvas container */}
      <div className="hero-bg" style={{ pointerEvents: 'auto' }}>
        <Canvas
          dpr={[1, 2]} // Performance limit pixel ratio on retina screens
          camera={{ position: [0, 0, 7.5], fov: 45 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
          }}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        >
          {/* Volumetric ambient lighting */}
          <ambientLight intensity={0.5} />
          
          {/* Key lights for shiny specs */}
          <directionalLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
          <directionalLight position={[-10, -10, -5]} intensity={1.2} color="#7a00ff" />
          <directionalLight position={[5, -5, 5]} intensity={0.8} color="#00f3ff" />
          
          <DataCore />
          <AntiGravityParticles />
        </Canvas>
      </div>

      {/* Hero Content Overlay (Matching original HTML/CSS classes) */}
      <div className="hero-content">
        <div className="hero-badge">
          <span className="badge-dot"></span>AI-Powered Innovation
        </div>
        
        <h1 className="hero-title">
          <TypingEffect />
          <br />
          Innovating the Future with
          <br />
          <span className="grad">AI-Powered Digital</span>
          <br />
          Solutions
        </h1>
        
        <p className="hero-sub">
          We build intelligent software, mobile apps, websites, and automation systems that transform your business and drive innovation.
        </p>
        
        <div className="hero-btns">
          <a href="#services" className="btn-primary" onClick={handleExploreServices}>Explore Services</a>
          <a href="#contact" className="btn-ghost" onClick={handleGetInTouch}>Get In Touch</a>
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
