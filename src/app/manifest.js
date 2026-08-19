export default function manifest() {
    return {
        name: 'BorrowHub - ระบบยืม-คืน',
        short_name: 'BorrowHub',
        description: 'แอพสำหรับยืม-คืนอุปกรณ์และของใช้ในมหาวิทยาลัย ยืมง่าย คืนสะดวก',
        start_url: '/',
        display: 'standalone',
        background_color: '#3F4E65',
        theme_color: '#F4C518',
        icons: [
            {
                src: '/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    };
}
