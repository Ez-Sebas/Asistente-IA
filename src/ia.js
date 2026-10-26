const path = require('path');

try {
    process.loadEnvFile(path.join(__dirname, '..', '.env'));
} catch (error) {
    
}

async function preguntarIA(mensajeSistema, mensajeUsuario) {
    if (!process.env.GROQ_API_KEY) {
        throw new Errro('Falta GROQ_API_KEY en el archivo .env')
    }

    if (!process.env.API_URL) {
        throw new Errro('Falta API_URL en el archivo .env')
    }

    const respuesta = await fetch(process.env.API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
            model: process.env.model,
            messages: [
                {role: 'system', content: mensajeSistema},
                {role: 'user', content: mensajeUsuario}
            ]
        }),
        signal: AbortSignal.timeout(30000)
    });

    if (!respuesta.ok) {
        let mensajeError = `Error ${respuesta.status}`;
        try {
            const cuerpo = await respuesta.json();
            if (cuerpo.error && cuerpo.error.message) {
                mensajeError += `: ${cuerpo.error.message}`
            }
        } catch (error) {
            
        }
        throw new Error(mensajeError)
    }

    const datos = await respuesta.json();
    return {
        texto: datos.choices[0].message.content,
        totalTokens: datos.usage ? datos.usage.total_tokens : null
    };;
}

module.exports = {
    preguntarIA
}