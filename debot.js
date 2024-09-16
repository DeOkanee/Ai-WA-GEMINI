const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
require('dotenv').config();

const gemini_api_key = process.env.GEMINI_API_KEY; //Ganti dengan Api Key Gemini 

// Buat client WhatsApp dengan menggunakan autentikasi lokal
const client = new Client({
    authStrategy: new LocalAuth()
});

// Ketika kode QR tersedia
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Scan kode QR di atas dengan WhatsApp Anda.');
});

// Ketika bot siap digunakan
client.on('ready', () => {
    console.log('Bot siap digunakan!');
});

// Fungsi untuk mendapatkan respons dari Gemini API
async function getGeminiResponse(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${gemini_api_key}`;
    const headers = {
        'Content-Type': 'application/json'
    };
    const data = {
        contents: [
            {
                parts: [{ text: prompt }]
            }
        ]
    };

    try {
        const response = await axios.post(url, data, { headers });
        console.log('Respons API:', response.data); // Debugging response dari API
        return response.data.candidates[0].content.parts[0].text || "Maaf, tidak ada jawaban yang tersedia saat ini.";
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        return `Maaf, terjadi kesalahan: ${error.response ? error.response.status : 'unknown'} - ${error.message}`;
    }
}

// Ketika ada pesan masuk
client.on('message', async (msg) => {
    console.log(`Pesan diterima: ${msg.body}`);

    // Periksa apakah pesan berasal dari grup
    if (msg.from.includes('@g.us')) {
        // Periksa apakah pesan di grup berisi tag bot
        if (msg.body.includes('@6283893934424')) { //ganti dengan nomor BOT Anda
            // Tampilkan status mengetik
            client.sendMessage(msg.from, '_Sedang mengetik..._');

            // Dapatkan respons dari Gemini API
            const response = await getGeminiResponse(msg.body);

            // Kirim balasan menggunakan fitur reply
            msg.reply(response);
        }
    } else {
        // Jika pesan bukan dari grup (pesan pribadi)
        // Tampilkan status mengetik
        client.sendMessage(msg.from, '_Sedang mengetik..._');

        // Dapatkan respons dari Gemini API
        const response = await getGeminiResponse(msg.body);

        // Kirim balasan
        msg.reply(response);
    }
});

// Jalankan bot
client.initialize();
