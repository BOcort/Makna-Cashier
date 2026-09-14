export default function About() {
    const folderGuide = [
        {
            name: 'pages',
            purpose: 'Menampung halaman berdasarkan route seperti Home, About, Dashboard, atau Detail.',
        },
        {
            name: 'layouts',
            purpose: 'Menyimpan struktur yang konsisten untuk banyak halaman, seperti header, footer, dan wrapper.',
        },
        {
            name: 'components',
            purpose: 'Menyimpan komponen reusable seperti card, modal, input, atau button.',
        },
        {
            name: 'hooks',
            purpose: 'Menaruh custom hook untuk logika state, fetching, form handling, atau interaksi UI.',
        },
        {
            name: 'utils',
            purpose: 'Menyimpan helper function yang bersifat umum, misalnya format tanggal, validasi, atau mapper data.',
        },
    ]

    const buildGuide = [
        'Mulai dari struktur folder yang jelas sebelum menulis UI.',
        'Pisahkan halaman, komponen kecil, dan helper agar mudah dirawat.',
        'Gunakan layout untuk mengurangi duplikasi markup antar halaman.',
        'Pakai nama folder dan file yang konsisten supaya developer lain cepat memahami isi project.',
    ]

    return (
        <section className="page-shell">
            <div className="hero-panel">
                <p className="eyebrow">About</p>
                <h2>Kenapa struktur folder itu penting?</h2>
                <p className="lead-text">
                    Struktur yang rapi membuat project lebih gampang dibaca, di-scale, dan di-maintain. Developer baru bisa
                    langsung tahu file mana untuk page, layout, komponen, atau helper logic.
                </p>
            </div>

            <div className="section-grid">
                {folderGuide.map((folder) => (
                    <article key={folder.name} className="info-card">
                        <p className="card-label">Folder</p>
                        <h3>{folder.name}</h3>
                        <p>{folder.purpose}</p>
                    </article>
                ))}
            </div>

            <div className="content-grid">
                <article className="panel">
                    <p className="card-label">Cara membangun</p>
                    <h3>Prinsip kerja yang disarankan</h3>
                    <ul className="steps-list compact-list">
                        {buildGuide.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                </article>

                <article className="panel accent-panel">
                    <p className="card-label">Rekomendasi</p>
                    <h3>Alur membuat fitur baru</h3>
                    <p>
                        Tambahkan page, buat komponen reusable bila perlu, lalu sambungkan lewat route. Dengan begitu,
                        folder tetap punya fungsi yang jelas dan semestinya.
                    </p>
                    <div className="mini-snippet">
                        <span>1. Page</span>
                        <span>2. Layout</span>
                        <span>3. Component</span>
                        <span>4. Utils</span>
                    </div>
                </article>
            </div>
        </section>
    )
}
