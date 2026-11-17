# Portofolio, cara pakai

Website portofolio satu halaman: HTML, CSS, dan JavaScript biasa. Nggak perlu install Node, npm, atau framework apa pun.

## Isi folder

| File | Isinya |
| --- | --- |
| `index.html` | Struktur dan semua teks halaman |
| `css/style.css` | Semua tampilan: warna, font, layout, animasi CSS |
| `js/main.js` | Animasi, efek foto WebGL, kursor, dll. Pengaturan **CONFIG** ada di paling atas |
| `assets/` | Tempat naruh foto kamu |

## Cara buka di browser lewat VS Code

1. **Ekstrak zip-nya dulu.** Klik kanan file zip, pilih *Extract All*. Jangan dibuka langsung dari dalam zip.
2. Buka **VS Code**, pilih **File → Open Folder…**, terus pilih folder `portofolio`.
3. Pasang extension **Live Server** (buatan Ritwick Dey):
   - Klik ikon Extensions di sidebar kiri (atau tekan `Ctrl+Shift+X`).
   - Cari `Live Server`, terus klik **Install**.
4. Buka `index.html`, klik kanan di editornya, pilih **Open with Live Server**. Bisa juga klik tombol **Go Live** di pojok kanan bawah VS Code.
5. Browser kebuka otomatis di `http://127.0.0.1:5500/index.html`.
   Setiap kali kamu save file (`Ctrl+S`), halaman langsung refresh sendiri.

> **Kenapa pakai Live Server?** Kalau `index.html` cuma di-double-click (alamatnya jadi `file:///...`), halamannya tetap jalan. Bedanya, browser nggak ngizinin efek WebGL baca foto dari folder `assets`, jadi yang tampil foto placeholder. Lewat Live Server, foto kamu kebaca normal.

## Ganti nama, email, foto, dan warna

Buka `js/main.js`. Paling atas ada bagian ini:

```js
const CONFIG = {
  nama: 'Bima Saputra',
  email: 'halo@example.com',
  foto: 'assets/foto.jpg',
  gayaFoto: 'asli',      // 'asli' atau 'duotone'
  latar: '#2433E8',
  aksen: '#FF9ED8'
};
```

- **nama**: dipakai di nama besar, logo (inisial), badge yang muter, dan footer.
- **email**: tampil di bagian Kontak dan disalin waktu tombol *Salin email* diklik.
- **foto**: simpan fotomu sebagai `assets/foto.jpg`, atau ganti path-nya. Paling bagus foto potret (tegak) dengan wajah di bagian atas, lebarnya minimal sekitar 1000px. Isi `''` kalau mau pakai placeholder.
- **latar / aksen**: warna utama. Buat nuansa web Lando Norris, pakai `latar: '#111112'` dan `aksen: '#D2FF00'`. Warna turunan lain (gelap, terang, abu) dihitung otomatis.

## Ganti teks lainnya

Semua ada di `index.html`, dan tiap bagian ditandai komentar `<!-- ===== ... ===== -->`:

- **Sapaan dan paragraf hero**: bagian HERO.
- **Daftar proyek**: bagian KARYA. Kalau jumlahnya berubah, ganti juga angka `(3)` di judul.
- **Kartu preview proyek** (yang muncul ngikutin kursor): ada di paling bawah file, elemen `class="cover"`. Urutannya sama dengan `data-proj="0"`, `"1"`, `"2"`.
- **Strip skill berjalan**: bagian STRIP KEAHLIAN.
- **Paragraf Tentang**: cukup tulis kalimat biasa. Efek kata-menyala-waktu-scroll dibuat otomatis.
- **Link GitHub / LinkedIn**: ganti `href`-nya.

## Catatan

- **Butuh internet** buat font (Mona Sans dan Fraunces diambil dari Google Fonts). Kalau offline, pakai font cadangan sistem.
- Kalau ada yang aneh, tekan `F12`, buka tab **Console**, dan lihat pesan error-nya.
- Kalau setting "kurangi animasi" (reduce motion) di Windows/HP aktif, sebagian besar animasi otomatis dimatikan. Ini memang disengaja.
- Mau online? Folder ini bisa langsung di-upload ke Vercel, Netlify, atau GitHub Pages tanpa proses build.
