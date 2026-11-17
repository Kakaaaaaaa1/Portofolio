/* =====================================================================
   PORTOFOLIO — js/main.js
   ---------------------------------------------------------------------
   Ganti isi CONFIG di bawah ini buat ngubah nama, email, foto, dan warna.
   Teks lain (paragraf, daftar proyek, dll) diubah langsung di index.html.
   ===================================================================== */
const CONFIG = {
  nama: 'Kaka Anditya Pambayung',          // dipakai di nama besar, logo, badge, dan footer
  email: 'Kakapambayungajah@gmail.com',     // ditampilkan & disalin waktu tombol "Salin email" diklik
  foto: 'assets/foto.jpg',       // taruh foto kamu di folder assets. Isi '' kalau mau pakai placeholder
  gayaFoto: 'asli',              // 'asli' = warna asli, 'duotone' = dua warna ngikutin latar
  latar: '#282C20',              // warna latar utama. Ala Lando Norris: '#111112'
  aksen: '#D2FF00'               // warna aksen. Ala Lando Norris: '#D2FF00'
};

class Portofolio {
  constructor() {
    // status tampilan (pengganti state)
    this.s = { cursorOn: false, cursorCls: '', cursorLabel: '', kartu: false, aktif: 0, menuOpen: false, navHidden: false, navSolid: false };
    this.gl = null; this.U = {}; this.glyphN = 1; this.imgAspect = 0.8;
    this.pts = []; this.last = null; this.cur = { x: 0, y: 0, s: 0, t: 0 }; this.inside = false;
    this.lastInteract = performance.now(); this.ghostT = 0; this.ghost = false;
    this.par = { x: 0, y: 0, tx: 0, ty: 0 };
    this.introStart = Infinity; this.prev = performance.now(); this.ptsBuf = new Float32Array(96);
    this.dpr = 1; this.fw = 1; this.fh = 1; this.R = 40;
    this.chars = []; this.charState = []; this.words = []; this.started = false;
    this.duoTarget = CONFIG.gayaFoto === 'duotone' ? 1 : 0;
    this.duo = this.duoTarget;
    this.mouse = { x: -400, y: -400 }; this.cpos = { x: -400, y: -400 }; this.kpos = { x: -400, y: -400 };
    this.koff = 60; this.krot = 0; this.kscale = 0.7;
    this.lastSy = 0; this.navSy = 0; this.mqX = 0; this.mqDir = 1; this.mqW = 0; this.isMobile = false;
    this.loop = (now) => this.tick(now);
  }

  /* ---------- mulai ---------- */
  init() {
    const $ = (q) => document.querySelector(q);
    this.page = $('.page'); this.nav = $('.nav'); this.frame = $('.frame'); this.canvas = $('.frame canvas');
    this.nameEl = $('.name'); this.nameInner = $('.name-inner');
    this.ctaEl = $('.cta-text'); this.ctaInner = $('.cta-inner'); this.aboutEl = $('.about-text');
    this.mqTrack = $('.mq-track'); this.mqGroup = $('.mq-group');
    this.cursorEl = $('.cursor'); this.cursorText = $('.cursor-label'); this.cardEl = $('.card');
    this.covers = Array.prototype.slice.call(document.querySelectorAll('.cover'));
    this.progEl = $('.progress'); this.grainEl = $('.grain'); this.hintEl = $('.frame-hint');
    this.menuBtn = $('.menu-btn'); this.menuPanel = $('#menu-panel'); this.copyBtn = $('[data-salin]');
    this.fileInput = $('#foto');

    this.reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.isMobile = window.innerWidth <= 760;
    this.isiTeks();
    this.applyColors();
    this.portrait = this.makePortrait();
    this.initGL();
    this.loadConfigPhoto();
    this.collectChars();
    this.collectWords();
    this.makeGrain();
    this.bindEvents();
    this.updateJam();
    setInterval(() => this.updateJam(), 10000);

    // tulisan "Ayo ngobrol" muncul waktu kelihatan di layar
    if (window.IntersectionObserver && this.ctaEl) {
      const io = new IntersectionObserver((es) => {
        es.forEach((en) => { if (en.isIntersecting) { this.ctaEl.classList.add('is-in'); io.disconnect(); } });
      }, { threshold: 0.3 });
      io.observe(this.ctaEl);
    } else if (this.ctaEl) { this.ctaEl.classList.add('is-in'); }

    const go = () => {
      if (this.started) return;
      this.started = true;
      this.buildAtlas();
      this.layout();
      this.page.classList.add('is-in');
      this.introStart = performance.now() + 150;
      requestAnimationFrame(this.loop);
    };
    if (document.fonts && document.fonts.load) {
      Promise.all([
        document.fonts.load('900 100px "Mona Sans"'),
        document.fonts.load('600 26px "Mona Sans"'),
        document.fonts.load('400 60px Fraunces')
      ]).then(go, go);
      setTimeout(go, 1800);
      if (document.fonts.ready) document.fonts.ready.then(() => { if (this.started) { this.buildAtlas(); this.layout(); } });
    } else { go(); }
  }

  // isi nama, inisial, email, tahun; pecah huruf & kata buat animasi
  isiTeks() {
    const nama = String(CONFIG.nama || '').trim() || 'Nama Kamu';
    const inisial = nama.split(/\s+/).map((w) => w.charAt(0)).join('').toLowerCase() + '.';
    document.title = 'Portofolio ' + nama;
    document.querySelectorAll('[data-nama]').forEach((el) => { el.textContent = nama; });
    document.querySelectorAll('[data-inisial]').forEach((el) => { el.textContent = inisial; });
    document.querySelectorAll('[data-email]').forEach((el) => { el.textContent = CONFIG.email; });
    document.querySelectorAll('[data-tahun]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
    if (this.nameEl) this.nameEl.setAttribute('aria-label', nama);
    this.buatHuruf(this.nameInner, nama, 200);
    if (this.ctaInner) this.buatHuruf(this.ctaInner, this.ctaInner.getAttribute('data-huruf') || 'Ayo ngobrol', 0);

    if (this.aboutEl) {
      const kata = this.aboutEl.textContent.trim().split(/\s+/);
      this.aboutEl.textContent = '';
      kata.forEach((w) => {
        const sp = document.createElement('span'); sp.className = 'w'; sp.textContent = w + ' ';
        this.aboutEl.appendChild(sp);
      });
    }
    // marquee digandakan biar jalannya nyambung tanpa putus
    if (this.mqGroup && this.mqTrack) {
      const copy = this.mqGroup.cloneNode(true); copy.setAttribute('aria-hidden', 'true');
      this.mqTrack.appendChild(copy);
    }
  }
  buatHuruf(wadah, teks, base) {
    if (!wadah) return;
    wadah.textContent = '';
    let k = 0;
    teks.split('').forEach((c) => {
      if (c === ' ') { const sp = document.createElement('span'); sp.className = 'sp'; wadah.appendChild(sp); return; }
      const o = document.createElement('span'); o.className = 'ch';
      const n = document.createElement('span'); n.className = 'ch-in'; n.textContent = c;
      n.style.transitionDelay = (base + (k++) * 45) + 'ms';
      o.appendChild(n); wadah.appendChild(o);
    });
  }
  updateJam() {
    const j = this.fmtJam();
    document.querySelectorAll('[data-jam]').forEach((el) => { if (el.textContent !== j) el.textContent = j; });
  }

  /* ---------- warna ---------- */
  colors() {
    const rgb = (h) => {
      let s = String(h || '').replace('#', '');
      if (s.length === 3) s = s.split('').map((c) => c + c).join('');
      const n = parseInt(s.slice(0, 6), 16) || 0;
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };
    const latar = CONFIG.latar || '#2433E8';
    const aksen = CONFIG.aksen || '#FF9ED8';
    const L = rgb(latar);
    return {
      latar: latar, aksen: aksen, A: rgb(aksen),
      tinta: L.map((v) => Math.round(v * 0.25)),
      kabut: L.map((v) => Math.round(v * 0.2 + 255 * 0.8)),
      kertas: L.map((v) => Math.round(v * 0.035 + 255 * 0.965))
    };
  }
  applyColors() {
    const c = this.colors();
    const css = (a) => 'rgb(' + a.join(',') + ')';
    const st = document.documentElement.style;
    st.setProperty('--latar', c.latar); st.setProperty('--aksen', c.aksen);
    st.setProperty('--tinta', css(c.tinta)); st.setProperty('--kabut', css(c.kabut)); st.setProperty('--kertas', css(c.kertas));
    if (this.gl) {
      const g = this.gl, U = this.U, n = (a) => a.map((v) => v / 255);
      g.uniform3fv(U.cTinta, n(c.tinta)); g.uniform3fv(U.cKabut, n(c.kabut));
      g.uniform3fv(U.cPermen, n(c.A)); g.uniform3fv(U.cKertas, n(c.kertas));
    }
  }

  /* ---------- foto placeholder, digambar pakai kode ---------- */
  makePortrait() {
    const w = 900, h = 1125, c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    let g;
    g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#dfe3ea'); g.addColorStop(1, '#9aa1ae');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    g = x.createRadialGradient(w * .3, h * .26, 0, w * .3, h * .26, w * .8);
    g.addColorStop(0, 'rgba(255,255,255,.75)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    // bahu
    x.beginPath(); x.moveTo(-20, h);
    x.bezierCurveTo(0, h * .76, w * .13, h * .65, w * .36, h * .612);
    x.lineTo(w * .64, h * .612);
    x.bezierCurveTo(w * .87, h * .65, w, h * .76, w + 20, h); x.closePath();
    g = x.createLinearGradient(0, h * .6, w, h); g.addColorStop(0, '#5b6578'); g.addColorStop(.45, '#2a3140'); g.addColorStop(1, '#151a24');
    x.fillStyle = g; x.fill();
    // leher
    g = x.createLinearGradient(w * .4, 0, w * .6, 0); g.addColorStop(0, '#e2b293'); g.addColorStop(1, '#9a6a50');
    x.fillStyle = g; x.beginPath();
    x.moveTo(w * .42, h * .47); x.lineTo(w * .58, h * .47); x.quadraticCurveTo(w * .585, h * .58, w * .6, h * .622);
    x.quadraticCurveTo(w * .5, h * .665, w * .4, h * .622); x.quadraticCurveTo(w * .415, h * .58, w * .42, h * .47);
    x.closePath(); x.fill();
    g = x.createLinearGradient(0, h * .5, 0, h * .575); g.addColorStop(0, 'rgba(70,35,20,.5)'); g.addColorStop(1, 'rgba(70,35,20,0)');
    x.fillStyle = g; x.fillRect(w * .41, h * .5, w * .19, h * .075);
    // kerah
    x.strokeStyle = 'rgba(255,255,255,.2)'; x.lineWidth = 12; x.beginPath();
    x.moveTo(w * .38, h * .62); x.quadraticCurveTo(w * .5, h * .705, w * .62, h * .62); x.stroke();
    // telinga
    x.fillStyle = '#d29f80'; x.beginPath(); x.ellipse(w * .333, h * .385, w * .027, h * .042, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#a8735a'; x.beginPath(); x.ellipse(w * .667, h * .385, w * .027, h * .042, 0, 0, Math.PI * 2); x.fill();
    // rambut
    x.fillStyle = '#2a1d17'; x.beginPath(); x.ellipse(w * .5, h * .31, w * .198, h * .185, 0, 0, Math.PI * 2); x.fill();
    // wajah
    g = x.createRadialGradient(w * .43, h * .32, 10, w * .5, h * .37, w * .2);
    g.addColorStop(0, '#f6d3b8'); g.addColorStop(.6, '#d8a283'); g.addColorStop(1, '#8e5c45');
    x.fillStyle = g; x.beginPath(); x.ellipse(w * .5, h * .37, w * .165, h * .16, 0, 0, Math.PI * 2); x.fill();
    // poni dan detail wajah
    x.save(); x.beginPath(); x.ellipse(w * .5, h * .37, w * .166, h * .161, 0, 0, Math.PI * 2); x.clip();
    x.fillStyle = '#2a1d17'; x.beginPath();
    x.moveTo(w * .3, h * .18); x.lineTo(w * .7, h * .18); x.lineTo(w * .7, h * .29);
    x.quadraticCurveTo(w * .6, h * .315, w * .47, h * .287); x.quadraticCurveTo(w * .38, h * .27, w * .3, h * .32);
    x.closePath(); x.fill();
    x.filter = 'blur(7px)';
    x.fillStyle = 'rgba(60,30,20,.4)';
    x.beginPath(); x.ellipse(w * .437, h * .375, w * .034, h * .014, 0, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.ellipse(w * .563, h * .375, w * .034, h * .014, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = 'rgba(110,55,35,.28)';
    x.beginPath(); x.ellipse(w * .515, h * .415, w * .012, h * .035, 0, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.ellipse(w * .5, h * .445, w * .03, h * .008, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = 'rgba(150,70,60,.45)';
    x.beginPath(); x.ellipse(w * .5, h * .475, w * .044, h * .009, 0, 0, Math.PI * 2); x.fill();
    g = x.createLinearGradient(0, h * .43, 0, h * .53); g.addColorStop(0, 'rgba(90,45,30,0)'); g.addColorStop(1, 'rgba(90,45,30,.25)');
    x.fillStyle = g; x.fillRect(w * .33, h * .43, w * .34, h * .1);
    x.filter = 'none';
    x.restore();
    // grain
    const d = x.getImageData(0, 0, w, h), p = d.data;
    for (let k = 0; k < p.length; k += 4) { const r = (Math.random() - .5) * 18; p[k] += r; p[k + 1] += r; p[k + 2] += r; }
    x.putImageData(d, 0, 0);
    return c;
  }

  /* ---------- atlas karakter untuk versi "kode" ---------- */
  makeAtlas() {
    const set = ' .,:;-=+<>/\\|(){}[]*#%&@01'.split('');
    const cell = 32, font = '600 26px "Mona Sans", system-ui, sans-serif';
    const m = document.createElement('canvas'); m.width = cell; m.height = cell;
    const mx = m.getContext('2d', { willReadFrequently: true });
    const cov = set.map((ch) => {
      mx.fillStyle = '#000'; mx.fillRect(0, 0, cell, cell);
      mx.fillStyle = '#fff'; mx.font = font; mx.textAlign = 'center'; mx.textBaseline = 'middle';
      mx.fillText(ch, cell / 2, cell / 2 + 1);
      const dd = mx.getImageData(0, 0, cell, cell).data;
      let s = 0;
      for (let k = 0; k < dd.length; k += 4) s += dd[k];
      return { ch: ch, s: s };
    }).sort((a, b) => a.s - b.s);
    const a = document.createElement('canvas'); a.width = cell * cov.length; a.height = cell;
    const ax = a.getContext('2d');
    ax.fillStyle = '#000'; ax.fillRect(0, 0, a.width, a.height);
    ax.fillStyle = '#fff'; ax.font = font; ax.textAlign = 'center'; ax.textBaseline = 'middle';
    cov.forEach((o, k) => { ax.fillText(o.ch, k * cell + cell / 2, cell / 2 + 1); });
    return { canvas: a, n: cov.length };
  }

  /* ---------- WebGL ---------- */
  fragSrc() {
    return [
      'precision highp float;',
      'uniform sampler2D uTex,uAtlas;',
      'uniform vec2 uRes,uPar;',
      'uniform float uImgAspect,uTime,uProg,uN,uCell,uR,uDuo;',
      'uniform vec3 uPts[32];',
      'uniform vec3 cTinta,cKabut,cPermen,cKertas;',
      'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
      'float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);',
      '  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}',
      'vec2 cover(vec2 uv){',
      '  float ca=uRes.x/uRes.y; vec2 t=uv-.5;',
      '  if(uImgAspect>ca){t.x*=ca/uImgAspect;}',
      '  else{float sy=uImgAspect/ca; t.y*=sy; t.y+=(1.-sy)*.2;}',
      '  t/=1.08; t+=uPar*vec2(.028,.02);',
      '  return t+.5;}',
      'float lum(vec2 uv){vec3 c=texture2D(uTex,cover(uv)).rgb;return dot(c,vec3(.299,.587,.114));}',
      'void main(){',
      '  vec2 fc=gl_FragCoord.xy; vec2 uv=fc/uRes;',
      '  vec3 orig=texture2D(uTex,cover(uv)).rgb;',
      '  float l=smoothstep(.05,.95,dot(orig,vec3(.299,.587,.114)));',
      '  vec3 duo=mix(cTinta,cKabut,l);',
      '  vec3 asli=pow(orig,vec3(1.05))*mix(1.,.62,smoothstep(.3,0.,uv.y));',
      '  vec3 photo=mix(asli,duo,uDuo);',
      '  photo+=(hash(fc)-.5)*.03;',
      '  vec2 cell=floor(fc/uCell); vec2 cuv=fract(fc/uCell);',
      '  float cl=smoothstep(.06,.94,lum((cell+.5)*uCell/uRes));',
      '  float gi=floor(cl*(uN-1.)+.5);',
      '  float e=uProg*1.3-.15;',
      '  float intro=smoothstep(e-.07,e+.07,uv.y+(noise(fc*.015)-.5)*.14);',
      '  float tick=floor(uTime*14.);',
      '  if(hash(cell+tick)<intro*.55) gi=floor(hash(cell*1.37+tick)*uN);',
      '  float g=texture2D(uAtlas,vec2((gi+cuv.x)/uN,cuv.y)).r;',
      '  vec3 glyph=mix(cPermen,cKertas,smoothstep(.7,1.,cl)*.6);',
      '  vec3 asc=mix(cTinta*.7,glyph,g*(.3+.7*cl));',
      '  float f=0.;',
      '  for(int i=0;i<32;i++){vec3 P=uPts[i];vec2 d=fc-P.xy*uRes;f+=P.z*exp(-dot(d,d)/(uR*uR));}',
      '  f*=.72+.56*noise(fc*.011+vec2(uTime*.35,-uTime*.2));',
      '  float m=smoothstep(.44,.52,f);',
      '  float rim=clamp(smoothstep(.3,.44,f)-m,0.,1.);',
      '  float a=max(m,intro);',
      '  vec3 col=mix(photo,asc,a);',
      '  col=mix(col,cPermen,rim*.28*(1.-intro));',
      '  gl_FragColor=vec4(col,1.);',
      '}'
    ].join('\n');
  }
  initGL() {
    let gl = null;
    try { gl = this.canvas ? this.canvas.getContext('webgl', { antialias: false, alpha: false }) : null; } catch (e) { gl = null; }
    if (!gl) { this.useFallback(); return; }
    try {
      const compile = (type, src) => {
        const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        return s;
      };
      const prog = gl.createProgram();
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, this.fragSrc()));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      ['uTex', 'uAtlas', 'uRes', 'uPar', 'uImgAspect', 'uTime', 'uProg', 'uN', 'uCell', 'uR', 'uDuo', 'uPts', 'cTinta', 'cKabut', 'cPermen', 'cKertas']
        .forEach((n) => { this.U[n] = gl.getUniformLocation(prog, n); });
      this.gl = gl;
      this.texPhoto = this.makeTex(0); this.texAtlas = this.makeTex(1);
      gl.uniform1i(this.U.uTex, 0); gl.uniform1i(this.U.uAtlas, 1);
      this.applyColors();
      this.setPhoto(this.portrait);
    } catch (err) {
      console.warn(err);
      this.useFallback();
    }
  }
  useFallback() {
    this.gl = null;
    const img = new Image(); img.alt = '';
    if (CONFIG.gayaFoto === 'duotone') img.className = 'duo';
    img.src = this.portrait.toDataURL('image/jpeg', 0.9);
    if (this.canvas) this.canvas.replaceWith(img);
    this.fallbackImg = img;
  }
  makeTex(unit) {
    const gl = this.gl, t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return t;
  }
  upload(t, unit, src) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
  }
  // pasang foto ke shader. return false kalau browser menolak (misal dibuka lewat file://)
  setPhoto(src) {
    const max = 1600, w = src.naturalWidth || src.width, h = src.naturalHeight || src.height;
    const k = Math.min(1, max / Math.max(w, h));
    const c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
    c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
    try {
      if (this.gl) this.upload(this.texPhoto, 0, c);
      else if (this.fallbackImg) this.fallbackImg.src = c.toDataURL('image/jpeg', 0.9);
      this.imgAspect = c.width / c.height;
      return true;
    } catch (err) {
      console.warn('Foto tidak bisa dipakai. Kalau index.html dibuka langsung (file://), jalankan lewat Live Server di VS Code.', err);
      return false;
    }
  }
  loadConfigPhoto() {
    if (!CONFIG.foto) return;
    const img = new Image();
    img.onload = () => { this.setPhoto(img); };
    img.onerror = () => { console.info('File ' + CONFIG.foto + ' belum ada, sementara pakai foto placeholder.'); };
    img.src = CONFIG.foto;
  }
  buildAtlas() {
    if (!this.gl) return;
    const a = this.makeAtlas(); this.glyphN = a.n; this.upload(this.texAtlas, 1, a.canvas);
  }
  resizeGL() {
    if (!this.frame) return;
    const r = this.frame.getBoundingClientRect();
    this.fw = Math.max(1, r.width); this.fh = Math.max(1, r.height);
    this.R = 0.085 * Math.min(this.fw, this.fh);
    if (!this.gl || !this.canvas) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.round(this.fw * this.dpr));
    this.canvas.height = Math.max(1, Math.round(this.fh * this.dpr));
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  /* ---------- teks besar ---------- */
  collectChars() {
    this.chars = Array.prototype.slice.call(document.querySelectorAll('.ch'));
    this.charState = this.chars.map(() => ({ cx: 0, cy: 0, s: 1, fs: 200, k: 0 }));
  }
  collectWords() {
    this.words = this.aboutEl ? Array.prototype.slice.call(this.aboutEl.querySelectorAll('.w')) : [];
    this.words.forEach((w) => { w._o = -1; });
  }
  fit(el, inner) {
    if (!el || !inner) return 0;
    el.style.fontSize = '100px';
    const w = inner.getBoundingClientRect().width || 1;
    const fs = Math.max(40, 100 * (el.clientWidth || 1) / w);
    el.style.fontSize = fs + 'px';
    return fs;
  }
  layout() {
    this.isMobile = window.innerWidth <= 760;
    const fs = this.fit(this.nameEl, this.nameInner);
    if (fs) document.documentElement.style.setProperty('--name-h', (fs * 0.86) + 'px');
    this.fit(this.ctaEl, this.ctaInner);
    requestAnimationFrame(() => {
      const sy = window.scrollY, kName = this.isMobile ? 0 : 0.28;
      if (this.frame) document.documentElement.style.setProperty('--frame-w', this.frame.getBoundingClientRect().width + 'px');
      this.chars.forEach((el, i) => {
        const st = this.charState[i];
        if (!st) return;
        const r = el.getBoundingClientRect();
        st.k = this.nameEl && this.nameEl.contains(el) ? kName : 0;
        st.cx = r.left + r.width / 2 + window.scrollX;
        st.cy = r.top + r.height / 2 + sy - st.k * sy;
        st.fs = parseFloat(getComputedStyle(el).fontSize) || 200;
      });
      if (this.mqGroup) this.mqW = this.mqGroup.getBoundingClientRect().width;
      this.resizeGL();
      const c0 = this.nameInner && this.nameInner.querySelector('.ch');
      const hero = this.nameEl && this.nameEl.parentElement;
      if (hero && c0) {
        const hr = hero.getBoundingClientRect(), cr = c0.getBoundingClientRect();
        document.documentElement.style.setProperty('--name-clear', Math.round(hr.bottom - cr.top + cr.height * 0.2 + 18 + kName * sy) + 'px');
      }
    });
  }

  /* ---------- efek grain ---------- */
  makeGrain() {
    if (!this.grainEl) return;
    try {
      const n = 180, c = document.createElement('canvas'); c.width = n; c.height = n;
      const x = c.getContext('2d'), d = x.createImageData(n, n), p = d.data;
      for (let i = 0; i < p.length; i += 4) { const v = Math.random() * 255; p[i] = p[i + 1] = p[i + 2] = v; p[i + 3] = 255; }
      x.putImageData(d, 0, 0);
      this.grainEl.style.backgroundImage = 'url(' + c.toDataURL('image/png') + ')';
    } catch (err) { /* tanpa grain juga tidak apa-apa */ }
  }

  /* ---------- interaksi ---------- */
  fmtJam() {
    try {
      return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' })
        .format(new Date()).replace(':', '.');
    } catch (e) {
      const d = new Date();
      return String(d.getHours()).padStart(2, '0') + '.' + String(d.getMinutes()).padStart(2, '0');
    }
  }
  scramble(el) {
    if (!el || el._scr) return;
    let node = null;
    for (let i = 0; i < el.childNodes.length; i++) {
      const n = el.childNodes[i];
      if (n.nodeType === 3 && n.nodeValue.trim()) { node = n; break; }
    }
    if (!node) return;
    const orig = node.nodeValue, glyphs = '{}[]<>/=+*#%&01';
    const isBtn = el.classList.contains('btn');
    const w0 = el.style.width;
    if (isBtn) el.style.width = el.getBoundingClientRect().width + 'px';
    el._scr = true;
    const t0 = performance.now(), dur = 420;
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      if (p >= 1) { node.nodeValue = orig; el._scr = false; if (isBtn) el.style.width = w0; return; }
      let out = '';
      for (let i = 0; i < orig.length; i++) {
        const ch = orig[i];
        out += (ch === ' ' || i / orig.length < p) ? ch : glyphs[Math.floor(Math.random() * glyphs.length)];
      }
      node.nodeValue = out;
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  localPos(e) {
    const r = this.frame.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  addPoint(x, y) {
    const sp = this.R * 0.55;
    if (this.last) { const dx = x - this.last.x, dy = y - this.last.y; if (dx * dx + dy * dy < sp * sp) return; }
    this.pts.push({ x: x, y: y, s: 1 });
    if (this.pts.length > 31) this.pts.shift();
    this.last = { x: x, y: y };
  }
  loadFile(f) {
    if (!f || !/^image\//.test(f.type)) return;
    const url = URL.createObjectURL(f), img = new Image();
    img.onload = () => {
      this.setPhoto(img);
      URL.revokeObjectURL(url);
      if (!this.reduce) this.introStart = performance.now();
    };
    img.src = url;
  }
  renderCursor() {
    const s = this.s;
    if (!this.cursorEl) return;
    this.cursorEl.className = 'cursor' + (s.cursorOn ? ' is-active' : '') + (s.cursorCls ? ' ' + s.cursorCls : '');
    if (this.cursorText) this.cursorText.textContent = s.cursorLabel;
  }
  renderCard() {
    if (!this.cardEl) return;
    this.cardEl.classList.toggle('is-on', this.s.kartu);
    this.covers.forEach((c, i) => c.classList.toggle('is-on', i === this.s.aktif));
  }
  setMenu(open) {
    this.s.menuOpen = open;
    if (this.menuPanel) this.menuPanel.hidden = !open;
    if (this.menuBtn) { this.menuBtn.textContent = open ? 'Tutup' : 'Menu'; this.menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    this.renderNav();
  }
  renderNav() {
    if (!this.nav) return;
    this.nav.classList.toggle('is-solid', this.s.navSolid);
    this.nav.classList.toggle('is-hidden', this.s.navHidden && !this.s.menuOpen);
  }
  copyEmail() {
    const email = CONFIG.email;
    const done = (ok) => {
      if (this.copyBtn) this.copyBtn.textContent = ok ? 'Email tersalin' : 'Gagal menyalin, salin manual ya';
      clearTimeout(this.salinT);
      this.salinT = setTimeout(() => { if (this.copyBtn) this.copyBtn.textContent = 'Salin email'; }, 2400);
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(email).then(() => done(true), () => done(false));
      else done(false);
    } catch (err) { done(false); }
  }
  bindEvents() {
    const L = [];
    const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); L.push(() => t.removeEventListener(ev, fn, o)); };
    const fr = this.frame;
    if (fr) {
      on(fr, 'pointerenter', (e) => {
        this.inside = true; this.ghost = false; this.last = null;
        const p = this.localPos(e); this.cur.x = p.x; this.cur.y = p.y;
      });
      on(fr, 'pointermove', (e) => {
        this.inside = true; this.ghost = false; this.lastInteract = performance.now();
        if (!this.gerakSet) { this.gerakSet = true; if (this.hintEl) this.hintEl.classList.add('is-hidden'); }
        const p = this.localPos(e); this.cur.x = p.x; this.cur.y = p.y; this.cur.t = 1; this.addPoint(p.x, p.y);
      });
      on(fr, 'pointerdown', (e) => {
        const p = this.localPos(e); this.cur.x = p.x; this.cur.y = p.y; this.cur.t = 1;
        this.last = null; this.addPoint(p.x, p.y); this.lastInteract = performance.now();
      });
      on(fr, 'pointerleave', () => {
        this.inside = false; this.cur.t = 0; this.last = null; this.lastInteract = performance.now();
      });
      if (window.ResizeObserver) { this.ro = new ResizeObserver(() => this.resizeGL()); this.ro.observe(fr); }
    }
    on(window, 'pointermove', (e) => {
      this.mouse.x = e.clientX; this.mouse.y = e.clientY;
      if (e.pointerType === 'mouse' && !this.s.cursorOn) {
        this.cpos.x = this.kpos.x = e.clientX; this.cpos.y = this.kpos.y = e.clientY;
        this.s.cursorOn = true; this.renderCursor();
      }
      this.par.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      this.par.ty = -(e.clientY / window.innerHeight - 0.5) * 2;
      // tombol magnetik: ikut tertarik ke arah kursor
      const m = !this.reduce && e.pointerType === 'mouse' && e.target && e.target.closest ? e.target.closest('.mag') : null;
      if (this.magEl && this.magEl !== m) { this.magEl.style.transform = ''; this.magEl._mag = null; this.magEl = null; }
      if (m) {
        const r = m.getBoundingClientRect(), tr = m._mag || { x: 0, y: 0 };
        const cx = r.left - tr.x + r.width / 2, cy = r.top - tr.y + r.height / 2;
        const mx = (e.clientX - cx) * 0.25, my = (e.clientY - cy) * 0.35;
        m._mag = { x: mx, y: my };
        m.style.transform = 'translate(' + mx.toFixed(1) + 'px,' + my.toFixed(1) + 'px)';
        this.magEl = m;
      }
    }, { passive: true });
    on(document, 'pointerleave', () => {
      this.mouse.x = this.mouse.y = -400; this.par.tx = this.par.ty = 0;
      this.s.cursorOn = false; this.s.kartu = false; this.renderCursor(); this.renderCard();
    });
    on(document, 'pointerover', (e) => {
      if (e.pointerType !== 'mouse' || !e.target || !e.target.closest) return;
      const t = e.target;
      // kursor: membesar di link, berlabel di elemen yang punya data-cursor
      const lab = t.closest('[data-cursor]');
      const link = t.closest('a,button,label');
      const p = t.closest('[data-proj]');
      const next = {
        cursorCls: lab ? 'is-label' : (link ? 'is-link' : ''),
        cursorLabel: lab ? lab.getAttribute('data-cursor') : this.s.cursorLabel,
        kartu: !!p,
        aktif: p ? Number(p.getAttribute('data-proj')) : this.s.aktif
      };
      const s = this.s;
      if (next.cursorCls !== s.cursorCls || next.cursorLabel !== s.cursorLabel || next.kartu !== s.kartu || next.aktif !== s.aktif) { Object.assign(s, next); this.renderCursor(); this.renderCard(); }
      // teks diacak jadi karakter kode waktu di-hover
      if (this.reduce) return;
      const el = t.closest('[data-scramble]');
      if (!el || (e.relatedTarget && el.contains(e.relatedTarget))) return;
      this.scramble(el.classList.contains('work') ? el.querySelector('.work-t') : el);
    });
    on(window, 'dragover', (e) => { e.preventDefault(); document.body.classList.add('dragging'); });
    on(window, 'dragleave', (e) => { if (!e.relatedTarget) document.body.classList.remove('dragging'); });
    on(window, 'drop', (e) => {
      e.preventDefault(); document.body.classList.remove('dragging');
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) this.loadFile(f);
    });
    on(window, 'resize', () => { clearTimeout(this.rt); this.rt = setTimeout(() => this.layout(), 80); });
    on(window, 'scroll', () => this.onScroll(), { passive: true });
    if (this.menuBtn) on(this.menuBtn, 'click', () => this.setMenu(!this.s.menuOpen));
    if (this.menuPanel) on(this.menuPanel, 'click', (e) => { if (e.target.closest('a')) this.setMenu(false); });
    if (this.copyBtn) on(this.copyBtn, 'click', () => this.copyEmail());
    if (this.fileInput) on(this.fileInput, 'change', () => {
      const f = this.fileInput.files && this.fileInput.files[0];
      if (f) this.loadFile(f);
      this.fileInput.value = '';
    });
    this.unbind = () => L.forEach((fn) => fn());
  }
  onScroll() {
    const sy = window.scrollY, d = sy - this.navSy;
    this.navSy = sy;
    const heroH = this.nameEl && this.nameEl.parentElement ? this.nameEl.parentElement.offsetHeight : 800;
    const solid = sy > heroH - 80;
    let hidden = this.s.navHidden;
    if (sy < 120) hidden = false;
    else if (d > 6) hidden = true;
    else if (d < -6) hidden = false;
    if (solid !== this.s.navSolid || hidden !== this.s.navHidden) { this.s.navSolid = solid; this.s.navHidden = hidden; this.renderNav(); }
  }

  /* ---------- loop animasi ---------- */
  tick(now) {
    const dt = Math.min(0.05, (now - this.prev) / 1000); this.prev = now;
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const sy = window.scrollY;
    const vel = (sy - this.lastSy) / Math.max(dt, 0.001); this.lastSy = sy;
    const heroEl = this.nameEl ? this.nameEl.parentElement : null;
    const heroH = heroEl ? heroEl.offsetHeight : 900;
    const heroVisible = sy < heroH + 40;

    for (let k = this.pts.length - 1; k >= 0; k--) {
      this.pts[k].s -= dt * 0.85;
      if (this.pts[k].s <= 0) this.pts.splice(k, 1);
    }
    const prog = this.reduce ? 1 : Math.max(0, Math.min(1, (now - this.introStart) / 1800));
    const introDone = prog >= 1;

    // kursor "hantu" pas diam, biar efeknya tetap kelihatan
    if (!this.reduce && introDone && !this.inside && heroVisible && now - this.lastInteract > 2600) {
      if (!this.ghost) { this.ghost = true; this.last = null; }
      this.ghostT += dt;
      this.cur.x = this.fw * (0.5 + 0.27 * Math.sin(this.ghostT * 0.8));
      this.cur.y = this.fh * (0.4 + 0.17 * Math.sin(this.ghostT * 1.27 + 0.9));
      this.cur.t = 0.9; this.addPoint(this.cur.x, this.cur.y);
    } else if (this.ghost && !this.inside) { this.ghost = false; this.cur.t = 0; }

    this.cur.s += (this.cur.t - this.cur.s) * Math.min(1, dt * 7);
    this.par.x += (this.par.tx - this.par.x) * Math.min(1, dt * 4);
    this.par.y += (this.par.ty - this.par.y) * Math.min(1, dt * 4);

    // parallax hero waktu scroll
    if (this.frame) this.frame.style.translate = this.isMobile || this.reduce ? '' : '0 ' + (sy * 0.12).toFixed(1) + 'px';

    const gl = this.gl, U = this.U;
    if (gl && this.canvas && heroVisible) {
      const b = this.ptsBuf; b.fill(0);
      b[0] = this.cur.x / this.fw; b[1] = 1 - this.cur.y / this.fh; b[2] = this.cur.s;
      for (let j = 0; j < this.pts.length && j < 31; j++) {
        const o = (j + 1) * 3;
        b[o] = this.pts[j].x / this.fw; b[o + 1] = 1 - this.pts[j].y / this.fh; b[o + 2] = this.pts[j].s * 0.42;
      }
      gl.uniform2f(U.uRes, this.canvas.width, this.canvas.height);
      gl.uniform2f(U.uPar, this.reduce ? 0 : this.par.x, this.reduce ? 0 : this.par.y);
      gl.uniform1f(U.uImgAspect, this.imgAspect);
      gl.uniform1f(U.uTime, now / 1000);
      gl.uniform1f(U.uProg, ease(prog));
      gl.uniform1f(U.uN, this.glyphN);
      gl.uniform1f(U.uCell, 10 * this.dpr);
      gl.uniform1f(U.uR, this.R * this.dpr);
      const tDuo = this.duoTarget;
      this.duo += (tDuo - this.duo) * Math.min(1, dt * 5);
      gl.uniform1f(U.uDuo, this.duo);
      gl.uniform3fv(U.uPts, b);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    // huruf besar (nama & ajakan): yang dekat kursor memanjang ke atas
    if (!this.reduce) {
      const px = this.mouse.x + window.scrollX, py = this.mouse.y + sy;
      for (let c = 0; c < this.chars.length; c++) {
        const st = this.charState[c];
        if (!st) continue;
        const dx = (px - st.cx) / (st.fs * 0.55), dy = (py - (st.cy + st.k * sy)) / (st.fs * 1.6);
        const target = 1 + 0.2 * Math.exp(-(dx * dx + dy * dy));
        if (Math.abs(target - st.s) < 0.0005) continue;
        st.s += (target - st.s) * Math.min(1, dt * 9);
        this.chars[c].style.transform = 'scaleY(' + st.s.toFixed(4) + ')';
      }
      if (this.nameEl) {
        this.nameEl.style.translate = (-this.par.x * 10).toFixed(2) + 'px ' + (this.isMobile ? 0 : sy * 0.28).toFixed(1) + 'px';
      }
    }

    // marquee: makin cepat & berbalik arah ngikutin scroll
    if (vel > 1) this.mqDir = 1; else if (vel < -1) this.mqDir = -1;
    if (this.mqTrack && this.mqW > 0 && !this.reduce) {
      this.mqX += (40 + Math.min(1500, Math.abs(vel)) * 0.4) * this.mqDir * dt;
      this.mqX = ((this.mqX % this.mqW) + this.mqW) % this.mqW;
      this.mqTrack.style.transform = 'translate3d(' + (-this.mqX).toFixed(1) + 'px,0,0)';
    }

    // teks Tentang: kata menyala satu per satu waktu di-scroll
    if (this.aboutEl && this.words.length) {
      const r = this.aboutEl.getBoundingClientRect(), vh = window.innerHeight;
      if (r.top < vh && r.bottom > 0) {
        // kalau halaman tidak bisa di-scroll (misal tampilan Fit), semua kata langsung menyala
        const bisaScroll = document.documentElement.scrollHeight > vh + 40;
        const p = (this.reduce || !bisaScroll) ? 1 : Math.max(0, Math.min(1, (vh * 0.85 - r.top) / (r.height + vh * 0.3)));
        const lit = p * this.words.length;
        for (let i = 0; i < this.words.length; i++) {
          const o = Math.round((0.16 + 0.84 * Math.max(0, Math.min(1, lit - i))) * 100) / 100;
          const w = this.words[i];
          if (w._o !== o) { w._o = o; w.style.opacity = String(o); }
        }
      }
    }

    // progress bar scroll
    if (this.progEl) {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const pr = Math.max(0, Math.min(1, sy / max));
      if (this.progEl._p !== pr) { this.progEl._p = pr; this.progEl.style.transform = 'scaleX(' + pr.toFixed(4) + ')'; }
    }

    // kursor custom
    if (this.cursorEl) {
      const k1 = this.reduce ? 1 : Math.min(1, dt * 16);
      this.cpos.x += (this.mouse.x - this.cpos.x) * k1; this.cpos.y += (this.mouse.y - this.cpos.y) * k1;
      this.cursorEl.style.transform = 'translate3d(' + this.cpos.x.toFixed(1) + 'px,' + this.cpos.y.toFixed(1) + 'px,0)';
    }

    // kartu preview proyek: ngikutin kursor, miring sesuai kecepatan
    if (this.cardEl) {
      const k2 = this.reduce ? 1 : Math.min(1, dt * 7);
      const ox = this.kpos.x;
      this.kpos.x += (this.mouse.x - this.kpos.x) * k2; this.kpos.y += (this.mouse.y - this.kpos.y) * k2;
      const vx = (this.kpos.x - ox) / Math.max(dt, 0.001);
      const offT = this.mouse.x > window.innerWidth * 0.6 ? -(320 + 60) : 60;
      this.koff += (offT - this.koff) * Math.min(1, dt * 6);
      const rT = this.reduce ? 0 : Math.max(-10, Math.min(10, vx * 0.015));
      this.krot += (rT - this.krot) * Math.min(1, dt * 6);
      this.kscale += ((this.s.kartu ? 1 : 0.7) - this.kscale) * Math.min(1, dt * 8);
      this.cardEl.style.transform = 'translate3d(' + (this.kpos.x + this.koff).toFixed(1) + 'px,' + (this.kpos.y - 110).toFixed(1) + 'px,0) rotate(' + this.krot.toFixed(2) + 'deg) scale(' + this.kscale.toFixed(3) + ')';
    }

    this.raf = requestAnimationFrame(this.loop);
  }
}

document.addEventListener('DOMContentLoaded', () => new Portofolio().init());
