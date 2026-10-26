# asistente-ia

Herramienta de consola en Node.js que lee un archivo de texto, lo envía a un modelo de inteligencia artificial (Groq) y guarda el resultado en un archivo nuevo. Sirve para resumir, explicar, hacer preguntas de repaso o traducir apuntes.

## Cómo configurarlo

1. Copia el archivo `.env.example` y renómbralo como `.env`.
2. Pega tu API key de Groq en la variable `GROQ_API_KEY`.
3. No es necesario instalar dependencias adicionales, ya que Node.js 18 o superior incluye `fetch`.

## Cómo usarlo

Ejecuta los siguientes comandos desde la terminal:

```bash
npm start -- apuntes/sesion_fs.txt resumir
npm start -- apuntes/sesion_fs.txt preguntas
npm start -- apuntes/sesion_fs.txt explicar
npm start -- apuntes/sesion_fs.txt traducir
npm start -- historial
```

El modo es opcional y, por defecto, se utiliza `resumir`.

Cada ejecución crea un archivo nuevo junto al archivo de entrada. Por ejemplo:

```text
apuntes/sesion_fs_resumir.txt
```

## Reflexión

### 1. Resultados del paso 4 de la parte 1

**Estructura de la respuesta:**

El texto generado por la IA se encuentra en `datos.choices[0].message.content`.

El campo `usage` contiene información sobre los tokens utilizados:

- `prompt_tokens`: cantidad de tokens utilizados en la entrada.
- `completion_tokens`: cantidad de tokens generados en la respuesta.
- `total_tokens`: cantidad total de tokens utilizados.

**Fallas provocadas:**

- **Clave mal escrita:** devuelve el estado `401` con el mensaje `"Invalid API Key"`.
- **Modelo mal escrito:** devuelve el estado `404`, indicando que el modelo no existe.
- **URL mal escrita:** devuelve el estado `404`, con un mensaje como `"unknown URL"`.

En los tres casos, la respuesta no contiene el campo `choices`. Por eso, al intentar acceder a `datos.choices[0]`, el programa falla con el error:

```text
TypeError: Cannot read properties of undefined
```

Por esta razón, es importante revisar `respuesta.ok` antes de intentar leer los datos de la respuesta.

### 2. ¿Por qué la clave va en `.env`?

Si guardo la clave directamente en el código y subo el proyecto a GitHub, cualquier persona podría verla y utilizarla.

El archivo `.env` se incluye en `.gitignore` para evitar que se suba al repositorio. Por otro lado, el archivo `.env.example` contiene un ejemplo de las variables necesarias, pero no incluye la clave real.

Si la clave se publica por error, tendría que revocarla y generar una nueva.

### 3. ¿Por qué usar `await` con `fetch` y `respuesta.json()`?

Porque ambas operaciones devuelven promesas, es decir, representan valores que todavía no están disponibles.

Al utilizar `await`, JavaScript espera a que la promesa se resuelva antes de continuar con la siguiente instrucción.

Sin `await`, podría intentar utilizar la promesa en lugar del resultado esperado, obteniendo un valor incorrecto en vez del texto de la respuesta.

### 4. ¿Qué es `respuesta.ok`?

Es una propiedad que devuelve `true` cuando el código de estado HTTP de la respuesta está entre `200` y `299`.

Que `fetch` no lance un error no significa que la solicitud haya sido exitosa. La API puede responder con estados como `401` o `404` sin que `fetch` genere una excepción automáticamente.

Por eso, es necesario comprobar `respuesta.ok` antes de intentar acceder a los datos de la respuesta.

### 5. Diferencias con la API de NVIDIA (gRPC)

- **Dependencias:** con NVIDIA instalé dependencias para trabajar con gRPC; con `fetch` no necesité instalar ninguna dependencia adicional.
- **Formato de los datos:** con NVIDIA utilicé archivos `.proto` y mensajes binarios; con `fetch` envío y recibo información en formato JSON.
- **Protocolo:** con NVIDIA utilicé gRPC; con `fetch` utilizo HTTP.
- **Autenticación:** con `fetch`, la clave de acceso se envía en la cabecera `Authorization` utilizando el formato `Bearer`.

