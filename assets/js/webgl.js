/* ==========================================================================
   TRANG ĐÀI PHOTO — WEBGL ATMOSPHERE
   Lightweight, dependency-free shader layers:
   • hero silk      — warm ivory / dusty-rose light field
   • contact aurora — dark plum / rose ribbons
   Pauses offscreen & on reduced motion. Falls back to CSS gradients.
   ========================================================================== */

(function () {
    'use strict';

    const canvases = Array.from(document.querySelectorAll('canvas[data-webgl]'));
    if (!canvases.length) return;

    const root = document.documentElement;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const VERT = `
        attribute vec2 aPos;
        void main() {
            gl_Position = vec4(aPos, 0.0, 1.0);
        }
    `;

    const NOISE = `
        float hash21(vec2 p) {
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
        }

        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            float a = hash21(i);
            float b = hash21(i + vec2(1.0, 0.0));
            float c = hash21(i + vec2(0.0, 1.0));
            float d = hash21(i + vec2(1.0, 1.0));
            return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }

        float fbm(vec2 p) {
            float v = 0.0;
            float a = 0.55;
            mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
            for (int i = 0; i < 5; i++) {
                v += a * noise(p);
                p = rot * p * 2.02 + 11.7;
                a *= 0.5;
            }
            return v;
        }
    `;

    const SILK = `
        precision highp float;

        uniform vec2 uRes;
        uniform float uTime;
        uniform vec2 uMouse;
        uniform float uDark;

        ${NOISE}

        void main() {
            vec2 uv = gl_FragCoord.xy / uRes.xy;
            float aspect = uRes.x / uRes.y;
            vec2 p = vec2(uv.x * aspect, uv.y);
            vec2 m = vec2(uMouse.x * aspect, 1.0 - uMouse.y);

            float t = uTime * 0.045;

            vec2 q = vec2(
                fbm(p * 1.35 + vec2(0.0, t)),
                fbm(p * 1.35 + vec2(5.2, -t * 0.8))
            );
            vec2 r = vec2(
                fbm(p * 1.9 + q * 1.6 + vec2(1.7, 9.2) + 0.08 * t),
                fbm(p * 1.9 + q * 1.6 + vec2(8.3, 2.8) - 0.06 * t)
            );
            float f = fbm(p * 2.1 + r * 2.4);

            vec3 cBase = mix(vec3(0.953, 0.933, 0.902), vec3(0.071, 0.063, 0.055), uDark);
            vec3 cWarm = mix(vec3(0.998, 0.980, 0.953), vec3(0.105, 0.078, 0.080), uDark);
            vec3 cCream = mix(vec3(0.988, 0.941, 0.886), vec3(0.145, 0.095, 0.105), uDark);
            vec3 cRose = mix(vec3(0.760, 0.482, 0.514), vec3(0.360, 0.205, 0.225), uDark);

            vec3 col = mix(cBase, cWarm, smoothstep(0.15, 0.90, f));
            float fold = smoothstep(0.35, 0.95, length(r));
            col = mix(col, cCream, fold * mix(0.66, 0.42, uDark));
            float blush = smoothstep(0.52, 1.0, f) * smoothstep(0.22, 0.9, q.x);
            col = mix(col, cRose, blush * mix(0.42, 0.34, uDark));

            float glow = smoothstep(1.15, 0.0, length(p - vec2(aspect * 0.80, 1.02)));
            col = mix(col, cCream, glow * mix(0.5, 0.26, uDark));

            float d = length(p - m);
            col += cWarm * smoothstep(0.85, 0.0, d) * mix(0.36, 0.10, uDark);

            float vignette = smoothstep(0.0, 0.55, uv.y);
            col *= mix(0.945, 1.0, vignette);

            float grain = hash21(gl_FragCoord.xy * 0.85 + fract(uTime) * 12.0) - 0.5;
            col += grain * 0.016;

            gl_FragColor = vec4(col, 1.0);
        }
    `;

    const AURORA = `
        precision highp float;

        uniform vec2 uRes;
        uniform float uTime;
        uniform vec2 uMouse;
        uniform float uDark;

        ${NOISE}

        void main() {
            vec2 uv = gl_FragCoord.xy / uRes.xy;
            float aspect = uRes.x / uRes.y;
            vec2 p = vec2(uv.x * aspect, uv.y);
            vec2 m = vec2(uMouse.x * aspect, 1.0 - uMouse.y);

            float t = uTime * 0.035;

            vec2 q = vec2(
                fbm(p * 1.15 + vec2(t, -t * 0.6)),
                fbm(p * 1.15 + vec2(4.7, t * 0.8))
            );
            float f = fbm(p * 1.7 + q * 1.9 + vec2(1.3, 8.4));

            vec3 ink = vec3(0.055, 0.047, 0.043);
            vec3 plum = vec3(0.135, 0.082, 0.098);
            vec3 rose = vec3(0.760, 0.482, 0.514);

            vec3 col = mix(ink, plum, smoothstep(0.15, 0.85, f));
            float ribbon = smoothstep(0.52, 1.0, f) * smoothstep(0.10, 1.0, q.y);
            col = mix(col, rose * 0.40, ribbon * 0.55);

            float glow = smoothstep(0.95, 0.0, length(p - vec2(aspect * 0.72, 0.55)));
            col += rose * glow * 0.085;

            float mouseGlow = smoothstep(0.60, 0.0, length(p - m));
            col += vec3(0.72, 0.46, 0.42) * mouseGlow * 0.05;

            float vignette = smoothstep(0.30, 1.15, length(uv - vec2(0.5, 0.52)));
            col *= 1.0 - vignette * 0.32;

            float grain = hash21(gl_FragCoord.xy * 0.7 + fract(uTime) * 9.0) - 0.5;
            col += grain * 0.014;

            gl_FragColor = vec4(col, 1.0);
        }
    `;

    const CONFIG = {
        silk: { fragment: SILK, themeAware: true },
        aurora: { fragment: AURORA, themeAware: false }
    };

    function compile(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const log = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error(log || 'Shader compile failed');
        }
        return shader;
    }

    class ShaderLayer {
        constructor(canvas, config) {
            this.canvas = canvas;
            this.config = config;
            this.dark = config.themeAware && root.dataset.theme === 'dark' ? 1 : 0;
            this.darkTarget = this.dark;
            this.pointer = { x: 0.5, y: 0.5 };
            this.target = { x: 0.5, y: 0.5 };
            this.visible = true;
            this.running = false;
            this.raf = 0;
            this.start = performance.now() + Math.random() * 4000;
            this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);

            const gl = canvas.getContext('webgl', {
                alpha: false,
                antialias: false,
                depth: false,
                stencil: false,
                powerPreference: 'low-power',
                preserveDrawingBuffer: false
            });
            if (!gl) throw new Error('WebGL not available');
            this.gl = gl;

            this.build();
            this.resize();
            this.bindEvents();
            this.observe();
        }

        build() {
            const gl = this.gl;

            const program = gl.createProgram();
            gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
            gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, this.config.fragment));
            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                throw new Error(gl.getProgramInfoLog(program) || 'Program link failed');
            }
            gl.useProgram(program);
            this.program = program;

            this.uRes = gl.getUniformLocation(program, 'uRes');
            this.uTime = gl.getUniformLocation(program, 'uTime');
            this.uMouse = gl.getUniformLocation(program, 'uMouse');
            this.uDark = gl.getUniformLocation(program, 'uDark');

            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array([-1, -1, 3, -1, -1, 3]),
                gl.STATIC_DRAW
            );

            const aPos = gl.getAttribLocation(program, 'aPos');
            gl.enableVertexAttribArray(aPos);
            gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
        }

        resize() {
            const canvas = this.canvas;
            const width = Math.max(1, Math.round(canvas.clientWidth * this.dpr));
            const height = Math.max(1, Math.round(canvas.clientHeight * this.dpr));
            if (canvas.width === width && canvas.height === height) return;
            canvas.width = width;
            canvas.height = height;
            this.gl.viewport(0, 0, width, height);
            this.draw(performance.now());
        }

        bindEvents() {
            const canvas = this.canvas;

            window.addEventListener('pointermove', (event) => {
                const rect = canvas.getBoundingClientRect();
                if (!rect.width || !rect.height) return;
                this.target.x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
                this.target.y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
            }, { passive: true });

            if ('ResizeObserver' in window) {
                this.resizeObserver = new ResizeObserver(() => this.resize());
                this.resizeObserver.observe(canvas);
            } else {
                window.addEventListener('resize', () => this.resize());
            }

            this.onVisibility = () => {
                if (document.hidden) {
                    this.stop();
                } else if (this.visible) {
                    this.play();
                }
            };
            document.addEventListener('visibilitychange', this.onVisibility);

            canvas.addEventListener('webglcontextlost', (event) => {
                event.preventDefault();
                this.stop();
                root.classList.add('no-webgl');
            });

            canvas.addEventListener('webglcontextrestored', () => {
                try {
                    this.build();
                    this.resize();
                    root.classList.remove('no-webgl');
                    this.play();
                } catch (error) {
                    root.classList.add('no-webgl');
                }
            });
        }

        observe() {
            if (!('IntersectionObserver' in window)) {
                this.play();
                return;
            }
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    this.visible = entry.isIntersecting;
                    if (this.visible) {
                        this.play();
                    } else {
                        this.stop();
                    }
                });
            }, { rootMargin: '120px' });
            this.observer.observe(this.canvas);
        }

        draw(now) {
            const gl = this.gl;
            this.dark += (this.darkTarget - this.dark) * 0.06;

            gl.uniform2f(this.uRes, this.canvas.width, this.canvas.height);
            gl.uniform1f(this.uTime, (now - this.start) / 1000);
            gl.uniform2f(this.uMouse, this.pointer.x, this.pointer.y);
            gl.uniform1f(this.uDark, this.dark);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }

        play() {
            if (this.running || reducedMotion.matches) {
                if (!this.running) this.draw(performance.now());
                this.canvas.classList.add('is-ready');
                return;
            }
            this.running = true;
            this.canvas.classList.add('is-ready');
            this.raf = requestAnimationFrame((now) => this.frame(now));
        }

        stop() {
            this.running = false;
            cancelAnimationFrame(this.raf);
        }

        frame(now) {
            if (!this.running) return;

            this.pointer.x += (this.target.x - this.pointer.x) * 0.055;
            this.pointer.y += (this.target.y - this.pointer.y) * 0.055;
            this.draw(now);

            if (document.hidden || !this.visible) {
                this.running = false;
                return;
            }
            this.raf = requestAnimationFrame((next) => this.frame(next));
        }

        setTheme(theme) {
            if (!this.config.themeAware) return;
            this.darkTarget = theme === 'dark' ? 1 : 0;
            this.dark = this.darkTarget;
            this.draw(performance.now());
        }
    }

    let layers = [];

    try {
        layers = canvases.map((canvas) => new ShaderLayer(canvas, CONFIG[canvas.dataset.webgl] || CONFIG.silk));
        root.classList.add('has-webgl');
    } catch (error) {
        root.classList.add('no-webgl');
        canvases.forEach((canvas) => canvas.classList.remove('is-ready'));
    }

    if (layers.length) {
        const themeObserver = new MutationObserver(() => {
            const theme = root.dataset.theme;
            layers.forEach((layer) => layer.setTheme(theme));
        });
        themeObserver.observe(root, { attributes: true, attributeFilter: ['data-theme'] });

        if (typeof reducedMotion.addEventListener === 'function') {
            reducedMotion.addEventListener('change', () => {
                layers.forEach((layer) => {
                    if (reducedMotion.matches) {
                        layer.stop();
                        layer.draw(performance.now());
                    } else if (layer.visible) {
                        layer.play();
                    }
                });
            });
        }
    }
})();
