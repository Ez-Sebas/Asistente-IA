const fs = require('fs');
const path = require('path');
const { preguntarIA } = require('./ia');

// Carga el .env
try {
    process.loadEnvFile(path.join(__dirname, '..', '.env'));
} catch (error) {
    // no hay .env, usamos las variables de entorno que ya existan
}

// Modos disponibles y su instrucción de sistema
const MODOS = {
    resumir: 'Resume el siguiente texto en máximo 5 viñetas, en español.',
    explicar: 'Explica el siguiente texto como si fuera para alguien que empieza a programar, en español.',
    preguntas: 'Genera 3 preguntas de repaso con su respuesta, en español.',
    traducir: 'Traduce el siguiente texto al inglés conservando el formato.'
};

// Límite de caracteres por el plan gratuito
const LIMITE_CARACTERES = 6000;

function mostrarUso() {
    console.log('Uso: node src/index.js <archivo> [modo]');
    console.log('Modos disponibles: ' + Object.keys(MODOS).join(', '));
    console.log('También: node src/index.js historial');
}

function guardarHistorial(registro) {
    const rutaHistorial = path.join(__dirname, '..', 'data', 'historial.json');
    let historial = [];

    // Si el archivo existe y es válido, lo leemos
    if (fs.existsSync(rutaHistorial)) {
        try {
            const contenido = fs.readFileSync(rutaHistorial, 'utf8');
            historial = JSON.parse(contenido);
            if (!Array.isArray(historial)) {
                historial = [];
            }
        } catch (error) {
            // historial dañado: lo reiniciamos
            historial = [];
        }
    }

    historial.push(registro);
    fs.writeFileSync(rutaHistorial, JSON.stringify(historial, null, 2));
}

function mostrarHistorial() {
    const rutaHistorial = path.join(__dirname, '..', 'data', 'historial.json');

    if (!fs.existsSync(rutaHistorial)) {
        console.log('Aún no hay historial. Ejecuta el programa con un archivo primero.');
        return;
    }

    let historial = [];
    try {
        const contenido = fs.readFileSync(rutaHistorial, 'utf8');
        historial = JSON.parse(contenido);
        if (!Array.isArray(historial)) {
            throw new Error('No es un arreglo');
        }
    } catch (error) {
        console.log('El archivo de historial está dañado. Se reiniciará en la próxima ejecución.');
        return;
    }

    const ultimas = historial.slice(-5).reverse();
    if (ultimas.length === 0) {
        console.log('Aún no hay ejecuciones registradas.');
        return;
    }

    console.log('Últimas ejecuciones:');
    ultimas.forEach((r, i) => {
        console.log(`${i + 1}. [${r.fecha}] ${r.archivo} → ${r.modo}`);
        console.log(`   Entrada: ${r.caracteresEntrada} chars | Salida: ${r.caracteresSalida} chars | Tokens: ${r.tokens || 'N/D'}`);
        console.log(`   Modelo: ${r.modelo}`);
    });
}

async function main() {
    const [,, archivo, modo = 'resumir'] = process.argv;

    // Comando historial
    if (archivo === 'historial') {
        mostrarHistorial();
        return;
    }

    // Validación: falta el archivo
    if (!archivo) {
        mostrarUso();
        process.exitCode = 1;
        return;
    }

    // Validación: el archivo no existe
    if (!fs.existsSync(archivo)) {
        console.log(`El archivo "${archivo}" no existe.`);
        mostrarUso();
        process.exitCode = 1;
        return;
    }

    // Validación: el modo no existe
    if (!MODOS[modo]) {
        console.log(`El modo "${modo}" no existe.`);
        mostrarUso();
        process.exitCode = 1;
        return;
    }

    // Leer el archivo
    const contenido = fs.readFileSync(archivo, 'utf8');

    // Validación: archivo vacío
    if (!contenido.trim()) {
        console.log(`El archivo "${archivo}" está vacío.`);
        process.exitCode = 1;
        return;
    }

    // Límite de tamaño
    let textoAEnviar = contenido;
    if (contenido.length > LIMITE_CARACTERES) {
        console.log(`Aviso: el texto supera los ${LIMITE_CARACTERES} caracteres. Se enviarán solo los primeros ${LIMITE_CARACTERES}.`);
        textoAEnviar = contenido.slice(0, LIMITE_CARACTERES);
    }

    try {
        // Llamar a la IA
        const resultado = await preguntarIA(MODOS[modo], textoAEnviar);

        // Construir la ruta de salida: <nombre>_<modo>.txt junto al archivo de entrada
        const dir = path.dirname(archivo);
        const base = path.basename(archivo, path.extname(archivo));
        const rutaSalida = path.join(dir, `${base}_${modo}.txt`);

        // Guardar el resultado
        fs.writeFileSync(rutaSalida, resultado);

        // Mostrar en consola
        console.log('--- Resultado ---');
        console.log(resultado);
        console.log('-----------------');
        console.log(`Guardado en: ${rutaSalida}`);

        // Guardar en el historial
        guardarHistorial({
            fecha: new Date().toISOString(),
            archivo,
            modo,
            modelo: process.env.MODEL,
            caracteresEntrada: textoAEnviar.length,
            caracteresSalida: resultado.length,
            tokens: null // la API no devuelve usage en este flujo simple
        });

    } catch (error) {
        // Manejo de errores (Parte 5)
        if (error.name === 'TimeoutError') {
            console.log('La API tardó demasiado en responder.');
        } else if (error instanceof TypeError) {
            console.log('No se pudo conectar. Revisa tu internet o la API_URL.');
        } else if (error.message.includes('401')) {
            console.log('La API key no es válida. Revisa tu archivo .env.');
        } else if (error.message.includes('429')) {
            console.log('Superaste el límite. Espera unos segundos e inténtalo de nuevo.');
        } else if (error.message.includes('404')) {
            console.log('Recurso no encontrado. Revisa el nombre del modelo o la API_URL.');
        } else {
            console.log('Error: ' + error.message);
        }
        process.exitCode = 1;
    }
}

main();
