const express = require('express');
const app = express();
const port = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send('Bot WhatsApp Online!');
});

app.listen(port, () => {
  console.log(`Server attivo sulla porta ${port}`);
});

const { Client, LocalAuth, Poll } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

let targetGroupId = null;

client.on('qr', (qr) => {
    console.log('Scansiona questo QR Code con il tuo WhatsApp:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Bot connesso e operativo!');
    console.log('📌 Il gruppo è già memorizzato, pronto per l\'invio automatico delle 08:00.');
});

// Cattura l'ID del gruppo al primo messaggio (se non già salvato)
client.on('message_create', async (msg) => {
    const isGroup = msg.from.endsWith('@g.us') || (msg.to && msg.to.endsWith('@g.us'));
    
    if (isGroup && !targetGroupId) {
        targetGroupId = msg.from.endsWith('@g.us') ? msg.from : msg.to;
        console.log(`🎯 Gruppo agganciato con successo! ID: ${targetGroupId}`);
    }
});

// ⏰ PROGRAMMAZIONE ORARIA: Tutti i giorni alle 08:00 ('0 8 * * *')
cron.schedule('0 8 * * *', async () => {
    // Usiamo direttamente l'ID del tuo gruppo che abbiamo visto prima
    const groupId = targetGroupId || '120363429413655671@g.us';

    try {
        console.log('⏰ Ore 08:00 raggiunte! Invio dei sondaggi giornalieri...');
        
        // 1° Sondaggio: Chi esce?
        const pollChiEsce = new Poll(
            'Chi esce?', 
            ['Sì', 'No']
        );
        await client.sendMessage(groupId, pollChiEsce);
        console.log('🚀 Sondaggio "Chi esce?" inviato!');

        // Attendiamo 3 secondi tra un sondaggio e l'altro per non intasare WhatsApp
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 2° Sondaggio: Fascia oraria
        const pollFasciaOraria = new Poll(
            'Fascia oraria:', 
            ['16', '17', '18', '19', '20']
        );
        await client.sendMessage(groupId, pollFasciaOraria);
        console.log('🚀 Sondaggio "Fascia oraria" inviato con successo!');

    } catch (err) {
        console.log('⚠️ Errore durante l\'invio automatico:', err.message);
    }
});

client.initialize();
