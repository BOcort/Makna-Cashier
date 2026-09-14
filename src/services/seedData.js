// Initial menu catalog seed data for Makna Coffee POS
import { runQuery, execSingle, getLastInsertId } from './db.js';

export const INITIAL_MENUS = [
  // ── SIGNATURE ──
  {
    name: 'Kopi Pandan Makna',
    categoryId: 1,
    badge: 'Best Seller',
    description: 'Espresso shot premium dipadukan susu creamy segar dan sirup pandan asli beraroma harum tropis yang khas.',
    imageData: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVymY6BVpkvwkkO5Ek5qZ-eQbS-B4Wm_sSpUgO7v79YlbWFduPzVV5LJ4RQcjns5KSC4OV_AOSCW3oGb1TKiufDiKTiAOdSStU7PulqlH2flSuXGAyWPiDeCxNKvAXIEhtfobChDkuhTIW87JXMWOAAPaNST_LDdYZ5QrOluGv3QOIBfd8h_YU_7bGzqGrrfqpUmx7QH8fh6mR12K3rcfq33TaRYwkvePRC9K-aNzmVlm28bjHAcWglg',
    prices: { 1: 28000, 2: 32000, 3: 35000 } // Regular: 28k, Large: 32k, XL: 35k
  },
  {
    name: 'Makna Aren Creamy',
    categoryId: 1,
    badge: 'Favorit',
    description: 'Espresso pekat berpadu harmonis dengan gula aren organik berkualitas dan krim susu lembut.',
    imageData: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmqzsW8b4AaXU33ahAp-uZ66EcKuDLrAGRzVBtB-0qcTMjvVneIeZNkAkOlwqzLY1dithg19BuQCHQkCrwxbLNYDXUwGjlNnWZ9EX0YyuW8oeE4hQXq8A5TVugICYUi2k4TjO2DWVs-tzv2r6E9-nFGWQvwWcgdwOhojMv0xJPyzs17me98VH_RH8_QWGRe_tswqDtTo5kDcT6UXlN4Lad9c7YDsl-jbcBoyuRfjAmmXv1xtaEqY1Osg',
    prices: { 1: 25000, 2: 29000, 3: 32000 }
  },
  {
    name: 'Berry Cold Brew',
    categoryId: 1,
    badge: '',
    description: 'Cold brew macerated 18 jam dengan infus buah liar berry segar, sensasi sparkling yang menyegarkan dahaga.',
    imageData: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3zuVkFxqDd6ccMFFd9zWH8YE29Iy4IeFMrPHqqpTHmgGDLvrt7_VFMPwjDnT3mOEQhWR1bdZBlFzhAM7C0cXWCJiV9as2vA6hSpy43peF6nIPS1HbGOSiGBEepKB2ijmRDacprkxx9n3HXcvG0DCeh7T-KtzfGclXBNy-VM8sZntqX6urcMWkgYoax-qlxO1ppkSjYo6z3gQTXzBRJ9oSYdTCwnPIMak4qxfHBFCiy1Z-DMCNha8kpg',
    prices: { 1: 30000, 2: 34000, 3: 37000 }
  },
  {
    name: 'Pandan Oat Latte',
    categoryId: 1,
    badge: 'Plant-Based',
    description: 'Pilihan plant-based ramah laktosa menggunakan susu oat premium impor dengan aroma daun pandan segar.',
    imageData: 'https://lh3.googleusercontent.com/aida-public/AB6AXuALpGMgteT4-KM1g4fDbLbNG8AFK3b_Npvi7LabtVIGD2lthzM6rs_u0zWVuxXsPJsdmMaiUxJWRQROUsGJ5ECYgVFHwX4NJ5-T8orS523p2-NA-9CUGg20Z1jk1D76NP3hR_sbIhFjFjA-s1uvNFj7Pfxo2uXlO6Q13RMLGOOrJH7jjGiliub_G8N9qcjZVp7oPgX5ys4vghFVWTPyzbLbtdIj_MWjPVLcPkV82qwF_fWH0A4vzkoucw',
    prices: { 1: 32000, 2: 36000, 3: 39000 }
  },

  // ── ESPRESSO & COFFEE ──
  {
    name: 'Cafe Latte',
    categoryId: 2,
    badge: '',
    description: 'Double shot espresso seimbang berpadu dengan steamed fresh milk bertekstur microfoam halus.',
    imageData: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzNwhmg3gkQ0AwNdpWqiu3NBLAT8squ9RcfRnEhIU-KuWglPga2Zj9xo_7SVPux303UggLMmsY9jvNrpwN2nTeUHDpgHDboZJVSSJzHQCWoSq09xwa69dqlYSea1B4L12ysCdj9R18L7s5hPdsPB3wE-pPQ4C6Erwa0nKrA15An9BcNRpiTXMoU1UL75zmQfM_tbZYfciJWG1TkNmVFlpQw7XB_WNQSNw-joIFhMgVUP4vj7gXTMoM4Q',
    prices: { 1: 24000, 2: 28000, 3: 31000 }
  },
  {
    name: 'Cappuccino',
    categoryId: 2,
    badge: '',
    description: 'Espresso klasik dengan perbandingan seimbang antara espresso, susu hangat, dan busa tebal bertabur cokelat bubuk.',
    imageData: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZ4lw-Wq9un18QkFmV9Qt0K77Zi_FMdoLnu4xqBQbI0v-ecDNycjVi0q3JMa90YfIvzE_rwsv9nCd0nSO-Y875Hzlh8XQ0HHzTfgGnGvwpHMSZ-GLQeOtZRTMXvVwoRi_4M57JPNiolb78PIsPRkXfgF-tuGrhVDajmj8CKxzL_TL734m8f-SSKB_Xd1caEOKG7XK5G1f_88URjXJQidJqf8551aT4pLdRSoMXxhhtCLHk9gjekCS6-g',
    prices: { 1: 24000, 2: 28000, 3: 31000 }
  },
  {
    name: 'Americano',
    categoryId: 2,
    badge: '',
    description: 'Espresso murni yang diencerkan dengan air panas atau dingin dengan aroma kacang dan citrus yang bersih.',
    imageData: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAoxQ_UvUkXdKic2c92k5lYczAQHKWvnM28f9WHO4am_IXWICM1QC8Y20lk1hlzoGMyGrtzPu6e3iJFFE5z4uneZ2K8fvNgd-bzh-LAGjDvtUFo6oiO3KGHYAWiXp-owBouC4xH3-8Tv28DHaxwY0khH_68S_zSovvqMDmawOJc9zQSyr6ktvw0OWyJUf57ecvrG6c2-JI1CItWlxEM2KH_CDu_y2um5VIWZlYmaFOia1r_jHSIwCpViA',
    prices: { 1: 20000, 2: 24000, 3: 27000 }
  },
  {
    name: 'Caramel Macchiato',
    categoryId: 2,
    badge: '',
    description: 'Vanilla syrup berpadu dengan susu steamed, ditandai espresso pekat dan lelehan saus karamel gurih.',
    imageData: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAFk3W7cGLVT4CU7CK9M2Ul6UBirUI0o2p5BU19yGXvM6cn1nGILd8LlhrmrA-DWhHOD9bXzh4vYr-CvrEHw3n9qIkBD8HwIIi4RJJUG559TtR1dXbGqc6GwkAo_iO40kZ1A8ot6BEjbWB6UqcQzTGAZkPj-_llxa3KLe1CYTu61F1IeJPk_nTF-C1XlWbVTIjRx6zqep_Qqz64Swnw30b-4o0LPZ4iQ7GsZ82VPhbPQewISO-13StfVA',
    prices: { 1: 28000, 2: 32000, 3: 35000 }
  },
  {
    name: 'Piccolo Latte',
    categoryId: 2,
    badge: '',
    description: 'Ristretto shot pekat disajikan dalam gelas 100ml dengan susu silky bersuhu pas.',
    imageData: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6UK8IHOt3RdXpmwTsHZXSsgqLPXav-cUeEjns-1dtceGDwbq5oQU9kVwWLCIokHO3eUiL0Rfq3b1ywAM0tpTerHyCnXLNhe2PRZo0cYcaActnK5j-CpcZkqfILjFoNWyZ1u5dfaBGIxvrOPYQG4d2vXoqUut8haeQk1ejTtaFt4VLfqeCVdQl141n33qKUJ8_flqbm3L6uHH7wqJ5JcPI31ltUaWL9a2DtQAeA3ezh7fyP_PfORlxBw',
    prices: { 1: 22000, 2: 26000 }
  },
  {
    name: 'Espresso Double',
    categoryId: 2,
    badge: '',
    description: 'Ekstraksi 36 gram kopi murni dengan profil roasting medium dark, aroma cokelat dan kacang yang tebal.',
    imageData: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCO1zM2eeayruhBp6SKZ4l3FdbLTlo94e30I-ibB2n7YNH1yDM98xOt4FabzKEegI8_kwwT2SBp2QjsAQIeT_KOfKQZRL4OOjBHe1ifoYPragB9TWWvPW3RrovmkOyj8kUKgD8CQMTJqGkGAaAjfSFy91BZZJFp7QEVa6mmCZhDV4YfEW85nHAE30BZGfDHWYpf1BhlTvHaD5tmwBole5kg3lz88BhFk7PHpYmt0fDtNwsyriIJY89wjg',
    prices: { 1: 18000 }
  },

  // ── NON-COFFEE ──
  {
    name: 'Matcha Latte Uji',
    categoryId: 3,
    badge: '',
    description: 'Bubuk matcha murni asal Kyoto yang di-whisk tradisional dan dipadukan susu manis lembut.',
    imageData: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDHl5C_SxXFMeVZf71XeZRPkGV1x0aqF5pW92f8xSE4ylxqDv8X-e9n-2fxM15i5G0KAXaiFNRZso4lk6d7ACw8UHBtEnPHUaefwRFH8EGODu0gWeM6sFrmrBJ3nzq5AMSN_-RjuVk9891Cz8BdPzZCo68M5lGFVUYoPPkf3ry5za6B1hXfgbiz3HHF-2dzfZEdGNjrWZVFqzZ1HwaY1OjJMPG54F3IuEUXgdO6J7XlGgSKFSn_21bdjw',
    prices: { 1: 27000, 2: 31000, 3: 34000 }
  },
  {
    name: 'Artisan Dark Chocolate',
    categoryId: 3,
    badge: '',
    description: 'Cokelat hitam 70% asal Bali dengan rasa cocoa pekat, tidak terlalu manis dan berkarakter gurih.',
    imageData: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBn7aSmN6nJo3HsSWjuLmL3hBLm27i88GbVXGStxfp7o5w-tMunAO9Aphpd-IMK-hHm0KBRALRrzZTig3u3F62INPYQ0vK2Usj4p-W2W2GpOkiZ22pQTOJdDuGu2I1hLzxBN7VGPTGn9RjQ6BJdSDla8giv9AWCQZEuAfG33C743dIyI770KLPEtmZepJnmEwuHoeojHX73jhPKTjYvWHfj5WL1QTVlGGm952KwuVc06x2u8WA7-kji5Q',
    prices: { 1: 26000, 2: 30000, 3: 33000 }
  },
  {
    name: 'Taro Milk Fusion',
    categoryId: 3,
    badge: '',
    description: 'Perpaduan ubi ungu manis dan susu gurih dengan tekstur kental yang menyenangkan.',
    imageData: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdtJCzQeD35xIpxVKVvvKKWEdchdx1NZfD1KjLaiftlMTZutopMo09QnlLI6isqLMCwH9KtEMDSkIU2SbwEsZkm0oQnXcMsOJuNMl9WsVTd1uEGXl67c_VHg0CzKSJPdJO6hSSE4kTJ-sV-RpnPRh9fuHcYXWJfR031e_5Vc3omS8iF7lhpOo_RmxCn77A65qq5sI9c-kXCXq8ksnJpx_xzLKWAEPO8v09YkYAwqeV9ABjNwk9ytSJNA',
    prices: { 1: 25000, 2: 29000, 3: 32000 }
  },
  {
    name: 'Earl Grey Milk Tea',
    categoryId: 3,
    badge: '',
    description: 'Seduhan teh hitam beraroma minyak bergamot elegan berpadu susu segar yang lembut.',
    imageData: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
    prices: { 1: 24000, 2: 28000, 3: 31000 }
  },
  {
    name: 'Red Velvet Latte',
    categoryId: 3,
    badge: '',
    description: 'Rasa khas red velvet cake yang gurih cokelat berpadu vanilla creamy dan susu hangat.',
    imageData: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80',
    prices: { 1: 26000, 2: 30000, 3: 33000 }
  },

  // ── SNACK ──
  {
    name: 'Butter Croissant',
    categoryId: 4,
    badge: 'Pastry',
    description: 'Croissant berlapis renyah dengan aroma mentega Prancis yang kaya, disajikan hangat dengan selai homemade.',
    imageData: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAr-jxS6rLC-j8ETWMRlZpp8g-MwavMOohzUCBkf45CKNXoN7x_SzLDOPDA4gp-ravXkzgvdfJl-nRp9-3IhlpKsmF7A5qeSS-fiOKWw28PLsfTqRJPtQXZWKNjgVdFdu_0G8XmJSRBnXcGIJp0iYDkBVeXiJyLAQfnu4AXxKGWex93_cWJuGIol2oIVEV-wmgDKPAkVD7QAsZ-Kdtu2AViInjzN9CFdvm51bIY-yOJHwX6QQuyEkg6nw',
    prices: { 1: 22000 }
  },
  {
    name: 'Churros Cinnamon Dip',
    categoryId: 4,
    badge: 'Dessert',
    description: 'Stik churros renyah bertabur gula palem dan kayu manis wangi, dilengkapi saus dark chocolate hangat.',
    imageData: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDOPfLQx24ZoojMPKhlUOIODcUOV5yl6HADvo7Ft03iC5JKWebbCxbmm1s6P-e2JlGXcIW_bCYwmy7GVvJFiUP9_-5LbAwib3ObpgVj4CiwqHO9cc2WbtB8y0vi-Fn4G_5lDtRZhQRJmaDCtIQnSu3DXGEOrGzoaWvkPuWeRlvbdg-aZb_Kf75jjBcw2dZ4i3HieEmqHsCz0wuLXXv_TP9jndQpzZbA8bKn4-o_6aI2smV6pFJLLjD6hQ',
    prices: { 1: 24000 }
  },
  {
    name: 'Truffle French Fries',
    categoryId: 4,
    badge: 'Savory',
    description: 'Kentang goreng renyah bumbu sea salt, disiram minyak truffle aromatik dan taburan keju parmesan parut.',
    imageData: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhWumhjUxzroY0z847yI8ULUvz6Miy5HchfVlZhG7uE1TuT0FT1TOgco6pQnh1tjOtBvxh3waGF3d1aXRuKIBZ94MU-nSTdnYQtChRzpCBUS-XPN41kdFsOTYb_EVJ8YnnK91-7b8KO_DxblK3jXr6clH-rX_7M-Bv_7FHK3HyI2phE8s8cXj8jHpMZKwStYnLguogWeo95ydJ5-qF2SPtjcko7THg3Yvlzp2FNzrhwNCkMo-e7KRHjw',
    prices: { 1: 26000 }
  },
  {
    name: 'Singkong Keju Makna',
    categoryId: 4,
    badge: 'Tradisional',
    description: 'Singkong merekah lembut gurih khas Abepura dengan balutan bumbu rempah dan keju cheddar melimpah.',
    imageData: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDRJLcVrDftUDpicX-4YiFBOuj_jAJWABVaDqWKrfaTOwdNXEHq5fxaIxY5kV1gjTQ9O8NBKV9Dr9TLykecaaAv2djaeJVlL49NU2rm4hFXUEmt2FmHwnkN5PfIlFbW3oqMKYpXm-sFBeL2LS03DW0myUw1yGaEtsEb5-La-d9GdLo5rdrLsB-3LCr3yqgvsyZ13EOyw-pGsbWPL2Pc2Mtl7OPpdmBl2T5Ngqdd6KAM-I0P3FgCACHEpg',
    prices: { 1: 20000 }
  },

  // ── MAKANAN UTAMA ──
  {
    name: 'Nasi Goreng Makna Special',
    categoryId: 5,
    badge: "Chef's Signature",
    description: 'Nasi goreng harum rempah nusantara dengan suwiran ayam gurih, telur mata sapi, sate ayam dan kerupuk.',
    imageData: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHykxw6amBSj-MVz1vhpohCXCjzIw8bLII3iF995BtMwqPRmRtxu3qx4Ut1lJUqdnKhcNJptMnpszMECx61gZJo2F8-5Qry14iq3z3uDlz6gm91HtmkPq-bIafKUhI9w_j0s_PDIbmALnq1VCq-6172e2xwKc2EFytRj8V7OS7cIoUjD6Pb1ohPEEVdCapVy2ReGuHnU4sqld7TKcP-CU76SipnBuxcr1sMc-1chegHVeaWKDWJIu2xg',
    prices: { 1: 35000 }
  },
  {
    name: 'Spaghetti Aglio Olio Smoked Beef',
    categoryId: 5,
    badge: 'Pasta',
    description: 'Pasta al dente ditumis minyak zaitun extra virgin, bawang putih renyah, cabai kering, dan smoked beef gurih.',
    imageData: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxE3q9xeI1OSV3F2Fz6k6iQ69yImu3YAJHJpQgX2jyBL8pG0pH-Q4jBoUNIro4tebFMTE07Py1gGGT32f98GJ_w48Ruj4ynXrsSafZcMEQuZD5nJ8tadAG2EAHGmMqgecC5mzZbQPo93ozkkWoc_lvn-JwQmxyo4c8cCJ4CSbWtEyv3MWkogSqg300ae-n8qwDKbOOKhdi6WTjgd3nar2ZEZBEIaJc-wORHx07prQ3h-_afMk9fB33ag',
    prices: { 1: 38000 }
  },
  {
    name: 'Beef Teriyaki Rice Bowl',
    categoryId: 5,
    badge: 'Rice Bowl',
    description: 'Irisan daging sapi empuk dimasak saus teriyaki manis gurih, disajikan di atas nasi hangat pulen dan wijen sangrai.',
    imageData: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZ04TKRKMZOAXleurrEGpZwEHUPGeKQWGz9fmhIPpMWEvjdx4xoeiJb8OvneXPw7LEIgwFubuYCLm59vXJMxvkUFBixHnjO7Dw4oFatAxdK9N6y5Oto-Wns5VOIuRj1guFDvbVfAoHuRQEJyhgEiPCKyaT6GMBJxjfQX6DGq62fRKpg6OsBCfXetb-k2o1f2YlGUcrPT0736H-NXrESMqw1AHKcBMykjYBsw6DLlNbIBrV0j1C-jOpUQ',
    prices: { 1: 42000 }
  },
  {
    name: 'Chicken Katsu Curry Rice',
    categoryId: 5,
    badge: 'Japanese Curry',
    description: 'Fillet dada ayam berbalut tepung panko renyah disajikan dengan saus kari Jepang kental dan kentang wortel lembut.',
    imageData: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtTEQ0pZbr5m-cHWuV4rd59_ExXj93vTCmUCcjB7KKyYYkLlxc68fvFKltamQAkEohTB1JrZ2AyTj7n3D4_ZpT8nr5rGAlHQpfPWgkRbdkyLuF6m-Q2iT4gra8ZYO9b4OgJ7oM-23snEjJ3L504I7YFVCXiALV_A47J-NRoUemBbbJByHB3bfhqdCfVFjj_QTCWA51ctbJYoKZtr7x6WMhBX3Qez1gaNWzMpHMoqFTE7LITMk70mtdvg',
    prices: { 1: 39000 }
  }
];

export function ensureSeedData() {
  // Ensure table migration if columns don't exist yet
  try {
    runQuery('ALTER TABLE menu_items ADD COLUMN description TEXT DEFAULT ""');
  } catch {
    // Column may already exist
  }
  try {
    runQuery('ALTER TABLE menu_items ADD COLUMN badge TEXT DEFAULT ""');
  } catch {
    // Column may already exist
  }

  // Ensure default categories exist
  const categories = [
    { id: 1, name: 'Signature', sort_order: 1 },
    { id: 2, name: 'Coffee', sort_order: 2 },
    { id: 3, name: 'Non-Coffee', sort_order: 3 },
    { id: 4, name: 'Snack', sort_order: 4 },
    { id: 5, name: 'Makanan', sort_order: 5 }
  ];

  for (const cat of categories) {
    runQuery('INSERT OR IGNORE INTO categories (id, name, sort_order) VALUES (?, ?, ?)', [cat.id, cat.name, cat.sort_order]);
  }

  // Ensure default sizes exist
  const sizes = [
    { id: 1, name: 'Regular', sort_order: 1 },
    { id: 2, name: 'Large', sort_order: 2 },
    { id: 3, name: 'X-Large', sort_order: 3 }
  ];

  for (const sz of sizes) {
    runQuery('INSERT OR IGNORE INTO sizes (id, name, sort_order) VALUES (?, ?, ?)', [sz.id, sz.name, sz.sort_order]);
  }

  // Ensure default payment methods
  const paymentMethods = [
    { id: 1, name: 'Cash', type: 'cash', sort_order: 1, badge: 'Utama', description: 'Batas laci: Rp 2.000.000 • Tanpa MDR', cash_limit: 2000000, mdr_rate: '0%' },
    { id: 2, name: 'QRIS', type: 'digital', sort_order: 2, badge: 'Auto Settlement', description: 'MDR: 0% (Usaha Mikro) • Bank Indonesia', mdr_rate: '0%' },
    { id: 3, name: 'Transfer', type: 'transfer', sort_order: 3, badge: 'BCA & Mandiri', description: 'Notifikasi instan via webhook kasir / Cek mutasi', account_number: 'BCA 1290884910' },
    { id: 4, name: 'EDC / Debit', type: 'edc', sort_order: 4, badge: 'Mesin EDC 01', description: 'MDR: 0.15% • Terminal ID: EDC-ABP-088', mdr_rate: '0.15%', terminal_id: 'EDC-ABP-088' }
  ];

  for (const pm of paymentMethods) {
    try {
      runQuery(
        'INSERT OR IGNORE INTO payment_methods (id, name, type, sort_order, badge, description, cash_limit, mdr_rate, account_number, terminal_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [pm.id, pm.name, pm.type, pm.sort_order, pm.badge, pm.description, pm.cash_limit || 0, pm.mdr_rate || '', pm.account_number || '', pm.terminal_id || '']
      );
    } catch {
      runQuery('INSERT OR IGNORE INTO payment_methods (id, name, type, sort_order) VALUES (?, ?, ?, ?)', [pm.id, pm.name, pm.type, pm.sort_order]);
    }
  }

  // Ensure default locations
  const defaultLocations = [
    {
      id: 1,
      name: 'Makna Coffee - Kotaraja (Pusat)',
      address: 'Jl. Abepura - Kotaraja No. 88, Wai Mhorock, Kec. Abepura, Kota Jayapura, Papua 99225',
      latitude: -2.583120,
      longitude: 140.672110,
      plus_code: 'CMMF+87 Jayapura, Papua',
      phone: '+62 812-4829-1092',
      opening_hours: '08:00 - 23:00 WIT (Buka)',
      rating: 4.9,
      reviews_count: 184,
      branch_code: 'OUT-KTJ-01',
      status_operasional: 'active',
      terminals_count: 3
    },
    {
      id: 2,
      name: 'Makna Coffee - Abepura',
      address: 'Jl. Raya Abepura, Dekat Lingkaran Abepura, Kota Jayapura, Papua 99225',
      latitude: -2.595120,
      longitude: 140.665210,
      plus_code: 'CMJH+42 Jayapura, Papua',
      phone: '+62 812-4829-1093',
      opening_hours: '08:00 - 23:00 WIT (Buka)',
      rating: 4.8,
      reviews_count: 142,
      branch_code: 'OUT-ABP-02',
      status_operasional: 'active',
      terminals_count: 2
    },
    {
      id: 3,
      name: 'Makna Coffee - Waena',
      address: 'Jl. Buper Waena, Heram, Kota Jayapura, Papua 99351',
      latitude: -2.571430,
      longitude: 140.642150,
      plus_code: 'CMV2+9X Jayapura, Papua',
      phone: '+62 812-4829-1094',
      opening_hours: 'Persiapan Renovasi Outlet',
      rating: 4.7,
      reviews_count: 89,
      branch_code: 'OUT-WNA-03',
      status_operasional: 'draft',
      terminals_count: 1
    }
  ];

  for (const loc of defaultLocations) {
    try {
      runQuery(
        'INSERT OR IGNORE INTO locations (id, name, address, latitude, longitude, plus_code, phone, opening_hours, rating, reviews_count, branch_code, status_operasional, terminals_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [loc.id, loc.name, loc.address, loc.latitude, loc.longitude, loc.plus_code, loc.phone, loc.opening_hours, loc.rating, loc.reviews_count, loc.branch_code, loc.status_operasional, loc.terminals_count]
      );
    } catch {
      runQuery('INSERT OR IGNORE INTO locations (id, name, address) VALUES (?, ?, ?)', [loc.id, loc.name, loc.address]);
    }
  }

  // Check if menu_items is empty
  const countRes = execSingle('SELECT COUNT(*) as cnt FROM menu_items');
  if (!countRes || countRes.cnt === 0) {
    for (const item of INITIAL_MENUS) {
      runQuery(
        'INSERT INTO menu_items (name, category_id, description, badge, image_data, is_active) VALUES (?, ?, ?, ?, ?, 1)',
        [item.name, item.categoryId, item.description, item.badge, item.imageData]
      );
      const menuId = getLastInsertId();
      for (const [sizeId, price] of Object.entries(item.prices)) {
        runQuery(
          'INSERT INTO menu_sizes (menu_item_id, size_id, price) VALUES (?, ?, ?)',
          [menuId, Number(sizeId), price]
        );
      }
    }
  }
}
