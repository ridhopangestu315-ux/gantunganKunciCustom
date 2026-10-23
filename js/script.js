/* =================================
   0. PENGATURAN (bagian yang sering diedit)
================================= */

// Alamat Google Apps Script tujuan pesanan (spreadsheet).
// Ganti di sini jika Anda membuat Apps Script baru.
const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbwiN5fFsRcknCfaFS8lX6YhSILMvizOEof0mugYKk6H50fiSokmG6ENcsDmmKiduDON/exec";

// Awalan nomor pesanan, contoh hasilnya: KIRA-1760000000000
const AWALAN_NOMOR_PESANAN = "KIRA-";

// Nama penyimpanan di browser (localStorage).
// Kunci dibuat baru agar sisa keranjang produk roti lama tidak muncul.
const KUNCI_KERANJANG = "keranjangKira";
const KUNCI_PESANAN = "pesananKira";


/* =================================
   1. DATA KERANJANG
================================= */

let keranjang = JSON.parse(
    localStorage.getItem(KUNCI_KERANJANG)
) || [];


/* =================================
   2. NOTIFIKASI TOAST
================================= */

let timerToast;

function tampilkanToast(judul, pesan) {
    const toast = document.getElementById("toast");
    const judulToast = document.getElementById("toast-title");
    const pesanToast = document.getElementById("toast-message");
    const ikonToast = toast.querySelector(".toast-icon");

    clearTimeout(timerToast);

    judulToast.textContent = judul;
    pesanToast.textContent = pesan;
    ikonToast.textContent = "✓";

    toast.classList.add("show");

    timerToast = setTimeout(function() {
        toast.classList.remove("show");
    }, 3000);
}

document.getElementById("toast-close").addEventListener("click", function() {
    clearTimeout(timerToast);
    document.getElementById("toast").classList.remove("show");
});


/* =================================
   3. SIMPAN KERANJANG
================================= */

function simpanKeranjang() {
    localStorage.setItem(
        KUNCI_KERANJANG,
        JSON.stringify(keranjang)
    );
}


/* =================================
   4. FORMAT HARGA RUPIAH
================================= */

function formatRupiah(angka) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(angka);
}


/* =================================
   5. AMBIL DATA PRODUK
================================= */

function ambilDataProduk(tombol) {
    const kartu = tombol.closest(".product-card");

    const nama = kartu.querySelector(".product-name").textContent.trim();

    const hargaText = kartu.querySelector(".product-price").textContent;

    const harga = Number(hargaText.replace(/[^\d]/g, ""));

    const gambar = kartu.querySelector("img").getAttribute("src");

    return {
        nama: nama,
        harga: harga,
        gambar: gambar
    };
}


/* =================================
   6. TAMBAH PRODUK KE KERANJANG
================================= */

document.querySelectorAll(".btn-product").forEach(function(tombol) {
    tombol.addEventListener("click", function() {
        const produk = ambilDataProduk(tombol);

        const produkAda = keranjang.find(function(item) {
            return item.nama === produk.nama;
        });

        if (produkAda) {
            produkAda.jumlah++;
        } else {
            keranjang.push({
                ...produk,
                jumlah: 1
            });
        }

        simpanKeranjang();
        perbaruiJumlahKeranjang();

        tampilkanToast(
            "Berhasil ditambahkan!",
            produk.nama + " masuk ke keranjang."
        );
    });
});


/* =================================
   7. PERBARUI JUMLAH KERANJANG
================================= */

function perbaruiJumlahKeranjang() {
    const totalBarang = keranjang.reduce(function(total, item) {
        return total + item.jumlah;
    }, 0);

    const tombolKeranjang = document.querySelector(
        '.cart-button[href="#keranjang"]'
    );

    if (tombolKeranjang) {
        tombolKeranjang.textContent = "🛒 " + totalBarang;
    }
}


/* =================================
   8. TAMPILAN KERANJANG
================================= */

const tampilanKeranjang = document.createElement("div");

tampilanKeranjang.id = "cart-modal";

tampilanKeranjang.innerHTML = `
    <div class="cart-box">
        <button id="tutup-keranjang" type="button">
            ✕ Tutup
        </button>

        <h2>Keranjang Belanja</h2>

        <div id="isi-keranjang"></div>

        <h3 id="total-belanja">Total: Rp 0</h3>

        <button id="pesan-sekarang" type="button">
            Pesan Sekarang
        </button>

        <button id="kosongkan-keranjang" type="button">
            Kosongkan Keranjang
        </button>

    </div>
`;

document.body.appendChild(tampilanKeranjang);


/* =================================
   9. BUKA KERANJANG
================================= */

const tombolBukaKeranjang = document.querySelector(
    '.cart-button[href="#keranjang"]'
);

if (tombolBukaKeranjang) {
    tombolBukaKeranjang.addEventListener("click", function(event) {
        event.preventDefault();

        tampilkanKeranjang();

        tampilanKeranjang.style.display = "flex";
    });
}


/* =================================
   10. TUTUP KERANJANG
================================= */

document.getElementById("tutup-keranjang")
    .addEventListener("click", function() {
        tampilanKeranjang.style.display = "none";
    });

// Tutup jika pengguna menekan area luar keranjang
tampilanKeranjang.addEventListener("click", function(event) {
    if (event.target === tampilanKeranjang) {
        tampilanKeranjang.style.display = "none";
    }
});


/* =================================
   11. TAMPILKAN ISI KERANJANG
================================= */


function tampilkanKeranjang() {
    const isi = document.getElementById("isi-keranjang");
    const totalElement = document.getElementById("total-belanja");
    const tombolPesan = document.getElementById("pesan-sekarang");
    const tombolKosongkan = document.getElementById("kosongkan-keranjang");

    isi.innerHTML = "";

    // Jika keranjang kosong
    if (keranjang.length === 0) {
        isi.textContent = "Keranjang kamu masih kosong.";

        totalElement.style.display = "none";
        tombolPesan.style.display = "none";
        tombolKosongkan.style.display = "none";

        return;
    }

    // Jika keranjang berisi produk
    totalElement.style.display = "block";
    tombolPesan.style.display = "block";
    tombolKosongkan.style.display = "block";

    let total = 0;

    keranjang.forEach(function(item, index) {
        const subtotal = item.harga * item.jumlah;
        total += subtotal;

        const baris = document.createElement("div");
        baris.className = "cart-item";

        baris.innerHTML = `
            <img src="${item.gambar}" alt="${item.nama}">

            <div class="cart-item-info">
                <strong>${item.nama}</strong>
                <p>${formatRupiah(item.harga)}</p>

                <div class="cart-controls">
                    <button type="button"
                        data-aksi="kurang"
                        data-index="${index}">−</button>

                    <span>${item.jumlah}</span>

                    <button type="button"
                        data-aksi="tambah"
                        data-index="${index}">+</button>

                    <button type="button"
                        data-aksi="hapus"
                        data-index="${index}">Hapus</button>
                </div>
            </div>

            <strong>${formatRupiah(subtotal)}</strong>
        `;

        isi.appendChild(baris);
    });

    totalElement.textContent = "Total: " + formatRupiah(total);
}


/* =================================
   12. TAMBAH, KURANG, DAN HAPUS
================================= */

document.getElementById("isi-keranjang")
    .addEventListener("click", function(event) {
        const tombol = event.target.closest("button");

        if (!tombol) return;

        const index = Number(tombol.dataset.index);
        const aksi = tombol.dataset.aksi;

        if (!keranjang[index]) return;

        if (aksi === "tambah") {
            keranjang[index].jumlah++;
        }

        if (aksi === "kurang") {
            keranjang[index].jumlah--;

            if (keranjang[index].jumlah <= 0) {
                keranjang.splice(index, 1);
            }
        }

        if (aksi === "hapus") {
            keranjang.splice(index, 1);

            tampilkanToast(
                "Produk dihapus",
                "Produk telah dihapus dari keranjang."
            );
        }

        simpanKeranjang();
        perbaruiJumlahKeranjang();
        tampilkanKeranjang();
    });


/* =================================
   13. KOSONGKAN KERANJANG
================================= */

document.getElementById("kosongkan-keranjang")
    .addEventListener("click", function() {
        if (keranjang.length === 0) {
            tampilkanToast(
                "Keranjang kosong",
                "Belum ada produk yang perlu dihapus."
            );
            return;
        }

        keranjang = [];

        simpanKeranjang();
        perbaruiJumlahKeranjang();
        tampilkanKeranjang();

        tampilkanToast(
            "Keranjang dikosongkan",
            "Semua produk berhasil dihapus."
        );
    });


/* =================================
   14. PENCARIAN PRODUK
================================= */

const formPencarian = document.querySelector(".search-box");

if (formPencarian) {
    formPencarian.addEventListener("submit", function(event) {
        event.preventDefault();

        const input = document.getElementById("search-input");

        const kataKunci = input.value.trim().toLowerCase();

        const semuaProduk = document.querySelectorAll(".product-card");

        let jumlahCocok = 0;

        semuaProduk.forEach(function(kartu) {
            const nama = kartu.querySelector(".product-name")
                .textContent.toLowerCase();

            const cocok = nama.includes(kataKunci);

            kartu.style.display = cocok ? "" : "none";

            if (cocok) {
                jumlahCocok++;
            }
        });

        document.getElementById("produk").scrollIntoView({
            behavior: "smooth"
        });

        if (jumlahCocok === 0) {
            tampilkanToast(
                "Produk tidak ditemukan",
                "Coba gunakan nama produk yang berbeda."
            );
        } else {
            tampilkanToast(
                "Pencarian selesai",
                "Ditemukan " + jumlahCocok + " produk."
            );
        }
    });
}


/* =================================
   15. JALANKAN SAAT HALAMAN DIBUKA
================================= */

perbaruiJumlahKeranjang();


/* FORMULIR PEMESANAN KIRA COLLECTIBLES */

const formPesanan = document.createElement("div");

formPesanan.id = "form-pesanan";

formPesanan.innerHTML = `
    <div class="checkout-box">
        <button id="tutup-checkout" type="button">
            ✕ Tutup
        </button>

        <h2>Formulir Pemesanan</h2>
        <p>Isi data berikut untuk memesan produk.</p>

        <form id="checkout-form">
            <label for="nama-pelanggan">Nama lengkap</label>
            <input
                type="text"
                id="nama-pelanggan"
                required
                maxlength="100"
                placeholder="Masukkan nama Anda"
            >

            <label for="nomor-hp">Nomor WhatsApp</label>
            <input
                type="tel"
                id="nomor-hp"
                required
                maxlength="20"
                placeholder="Contoh: 081234567890"
            >

            <label for="alamat-pelanggan">Alamat pengiriman</label>
            <textarea
                id="alamat-pelanggan"
                required
                maxlength="500"
                placeholder="Nama jalan, nomor rumah, kota"
            ></textarea>

            <label for="catatan-pesanan">Catatan (opsional)</label>
            <textarea
                id="catatan-pesanan"
                maxlength="300"
                placeholder="Contoh: tolong tambah bubble wrap"
            ></textarea>

            <div id="ringkasan-checkout"></div>

            <button type="submit" class="btn btn-primary">
                Buat Pesanan
            </button>
        </form>
    </div>
`;

document.body.appendChild(formPesanan);


/* =================================
   16. BUKA FORMULIR PEMESANAN
================================= */

document.getElementById("pesan-sekarang")
    .addEventListener("click", function() {

        if (keranjang.length === 0) {
            tampilkanToast(
                "Keranjang masih kosong",
                "Tambahkan produk terlebih dahulu."
            );
            return;
        }

        // Tampilkan ringkasan pesanan
        const total = keranjang.reduce(function(jumlah, item) {
            return jumlah + item.harga * item.jumlah;
        }, 0);

        document.getElementById("ringkasan-checkout").innerHTML = `
            <h3>Ringkasan Pesanan</h3>
            <p>Jumlah jenis produk: ${keranjang.length}</p>
            <strong>Total: ${formatRupiah(total)}</strong>
        `;

        formPesanan.style.display = "flex";
    });


/* =================================
   17. TUTUP FORMULIR
================================= */

document.getElementById("tutup-checkout")
    .addEventListener("click", function() {
        formPesanan.style.display = "none";
    });


/* Tutup formulir jika area luar diklik */
formPesanan.addEventListener("click", function(event) {
    if (event.target === formPesanan) {
        formPesanan.style.display = "none";
    }
});


/* =================================
   18. SIMPAN PESANAN DI BROWSER
================================= */

document.getElementById("checkout-form")
    .addEventListener("submit", function(event) {
        event.preventDefault();

        if (keranjang.length === 0) {
            tampilkanToast(
                "Keranjang kosong",
                "Silakan pilih produk terlebih dahulu."
            );
            formPesanan.style.display = "none";
            return;
        }

        const nama = document.getElementById("nama-pelanggan")
            .value.trim();

        const nomorHP = document.getElementById("nomor-hp")
            .value.trim();

        const alamat = document.getElementById("alamat-pelanggan")
            .value.trim();

        const catatan = document.getElementById("catatan-pesanan")
            .value.trim();

        if (!nama || !nomorHP || !alamat) {
            tampilkanToast(
                "Data belum lengkap",
                "Isi nama, nomor HP, dan alamat."
            );
            return;
        }

        const total = keranjang.reduce(function(jumlah, item) {
            return jumlah + item.harga * item.jumlah;
        }, 0);

        const pesananBaru = {
            id: AWALAN_NOMOR_PESANAN + Date.now(),
            tanggal: new Date().toISOString(),
            pelanggan: {
                nama: nama,
                nomorHP: nomorHP,
                alamat: alamat
            },
            produk: keranjang.map(function(item) {
                return {
                    nama: item.nama,
                    harga: item.harga,
                    jumlah: item.jumlah,
                    subtotal: item.harga * item.jumlah
                };
            }),
            catatan: catatan,
            total: total,
            status: "Menunggu konfirmasi"
        };

        try {
            const daftarPesanan = JSON.parse(
                localStorage.getItem(KUNCI_PESANAN) || "[]"
            );

            daftarPesanan.push(pesananBaru);


            // URL_APPS_SCRIPT diatur di bagian "0. PENGATURAN" paling atas file
            const dataKirim = {
                nama: pesananBaru.pelanggan.nama,
                nomor_hp: pesananBaru.pelanggan.nomorHP,
                alamat: pesananBaru.pelanggan.alamat,
                produk: JSON.stringify(pesananBaru.produk),
                total: pesananBaru.total,
                catatan : pesananBaru.catatan
            };

            fetch(URL_APPS_SCRIPT, {
                method: "POST",
                mode: "no-cors",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8"
                },
                body: JSON.stringify(dataKirim)
            }).then(function() {
                console.log("Permintaan pengiriman sudah dikirim.");
            }).catch(function(error) {
                console.error("Gagal mengirim permintaan:", error);
            });


            localStorage.setItem(
                KUNCI_PESANAN,
                JSON.stringify(daftarPesanan)
            );

            // Kosongkan keranjang setelah berhasil disimpan
            keranjang = [];
            simpanKeranjang();
            perbaruiJumlahKeranjang();
            tampilkanKeranjang();

            // Tutup kedua modal
            formPesanan.style.display = "none";
            tampilanKeranjang.style.display = "none";

            // Reset formulir
            document.getElementById("checkout-form").reset();

            tampilkanToast(
                "Pesanan berhasil dibuat!",
                "Nomor pesanan: " + pesananBaru.id
            );

            console.log("Pesanan tersimpan:", pesananBaru);

        } catch (error) {
            console.error("Gagal menyimpan pesanan:", error);

            tampilkanToast(
                "Gagal menyimpan pesanan",
                "Periksa penyimpanan browser dan coba lagi."
            );
        }
    });
