const path = require('path');

// Carga el archivo .env (igual que en la sesión 5). Si no existe, seguimos sin él.
try {
    process.loadEnvFile(path.join(__dirname, '..', '.env'));
} catch (error) {
    // no hay .env, usamos las variables de entorno que ya existan
}

async function main() {
    const respuesta = await fetch(process.env.API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
            model: process.env.MODEL,
            messages: [
                { role: 'user', content: 'Explícame en una frase qué es Node.js' }
            ]
        })
    });

    const datos = await respuesta.json();
    console.log(datos.choices[0].message.content);
}

main();
