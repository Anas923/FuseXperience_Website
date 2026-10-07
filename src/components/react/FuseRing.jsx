import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function FuseRing() {
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = containerRef.current;
    if (!canvas) return;

    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasWebGL = (() => {
      try {
        const t = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (t.getContext('webgl') || t.getContext('experimental-webgl')));
      } catch { return false; }
    })();

    if (!hasWebGL) {
      canvas.innerHTML = '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><div style="width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(255,90,31,0.15) 0%,transparent 70%);border:1px solid rgba(255,90,31,0.2);box-shadow:0 0 60px rgba(255,90,31,0.1)"></div></div>';
      window.__fuseRing = { progress: 0, setProgress(v) { this.progress = v; } };
      return;
    }

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: window.devicePixelRatio <= 2 });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    canvas.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 8);

    const geometry = new THREE.BufferGeometry();
    const count = 6000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const tk = new THREE.TorusKnotGeometry(2.2, 0.7, 128, 16, 2, 3);
    const tp = tk.attributes.position.array;
    const tl = tp.length / 3;
    const tc = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * tl) * 3;
      const s = 0.06;
      positions[i * 3] = tp[idx] + (Math.random() - 0.5) * s;
      positions[i * 3 + 1] = tp[idx + 1] + (Math.random() - 0.5) * s;
      positions[i * 3 + 2] = tp[idx + 2] + (Math.random() - 0.5) * s;
      tc.setHSL(0.6, 0.08, 0.85 + Math.random() * 0.1);
      colors[i * 3] = tc.r;
      colors[i * 3 + 1] = tc.g;
      colors[i * 3 + 2] = tc.b;
      sizes[i] = 0.04 + Math.random() * 0.06;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const uniforms = { uProgress: { value: 0 }, uTime: { value: 0 } };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `attribute float size;attribute vec3 color;varying vec3 vColor;uniform float uProgress;uniform float uTime;void main(){vColor=color;vec4 mvPosition=modelViewMatrix*vec4(position,1.0);gl_PointSize=size*(300.0/-mvPosition.z);gl_Position=projectionMatrix*mvPosition;}`,
      fragmentShader: `varying vec3 vColor;uniform float uProgress;void main(){vec2 c=gl_PointCoord-vec2(0.5);float d=length(c);if(d>0.5)discard;float a=1.0-smoothstep(0.0,0.5,d);a*=0.9;float g=exp(-d*6.0);vec3 f=vColor+vec3(0.2,0.05,0.0)*uProgress*g*0.5;gl_FragColor=vec4(f,a);}`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = 128;
    spriteCanvas.height = 128;
    const ctx = spriteCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,90,31,0.15)');
    grad.addColorStop(0.4, 'rgba(255,90,31,0.08)');
    grad.addColorStop(1, 'rgba(255,90,31,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const spriteMat = new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(spriteCanvas),
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(8, 8, 1);
    scene.add(sprite);

    let mx = 0, my = 0, tx = 0, ty = 0;

    const onMouse = (e) => { mx = (e.clientX / window.innerWidth) * 2 - 1; my = (e.clientY / window.innerHeight) * 2 - 1; };
    document.addEventListener('mousemove', onMouse);

    window.__fuseRing = {
      progress: 0,
      setProgress(val) { uniforms.uProgress.value = val; this.progress = val; },
    };

    if (isReduced) {
      renderer.render(scene, camera);
      uniforms.uProgress.value = 0.5;
      return () => document.removeEventListener('mousemove', onMouse);
    }

    const clock = new THREE.Clock();
    let animId;

    function animate() {
      animId = requestAnimationFrame(animate);
      uniforms.uTime.value += clock.getDelta();
      tx += (my * 0.3 - tx) * 0.05;
      ty += (mx * 0.3 - ty) * 0.05;
      particles.rotation.x += 0.002 + tx * 0.001;
      particles.rotation.y += 0.005 + ty * 0.001;
      spriteMat.opacity = 0.3 + uniforms.uProgress.value * 0.5;
      renderer.render(scene, camera);
    }
    animate();

    const onResize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />;
}
