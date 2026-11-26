# Zenkai para Samsung (Tizen)

La app de TV es un marco muy fino (`index.html`) que abre la web publicada con el modo TV
(`?tv=1`): navegación con flechas, teclas multimedia del control y foco visible. Como carga la
web en vivo, **los cambios del sitio llegan solos**; solo hay que reempaquetar si cambia esta carpeta.

## 1. Preparar
1. `SITE` en `index.html` apunta a https://zenkai.cyberstein.dev (cámbialo si el dominio cambia).
2. Instala [Tizen Studio](https://developer.tizen.org/development/tizen-studio/download) con
   *TV Extensions* (Package Manager → Extension SDK) y *Certificate Manager*.
3. Crea un **certificado de Samsung** (Certificate Manager → Samsung, con una cuenta Samsung):
   hace falta el DUID de tu TV para poder instalar la app en ella.

## 2. Poner la TV en modo desarrollador
Ajustes → Apps (o pantalla de Smart Hub) → pulsa **12345** con el control → *Developer mode: ON* →
escribe la IP de tu PC → reinicia la TV. Después, en Tizen Studio, *Device Manager → Remote Device
Manager → +* con la IP de la TV, y activa el interruptor de conexión.

## 3. Instalar
En Tizen Studio: *File → Import → Tizen → Tizen Project* (esta carpeta `tizen/`) y *Run As →
Tizen Web Application*. O por consola:

```
tizen package -t wgt -s <perfil-de-certificado> -- tizen
sdb connect <ip-de-la-tv>
tizen install -n Zenkai.wgt -t <nombre-de-la-tv>
```

## Probar sin TV
Abre el sitio con `?tv=1` en el navegador del PC (queda activado; `?tv=0` lo apaga): se maneja
con las flechas y Enter. Teclas del control: ⏪ ⏩ ▶ ⏸ ⏯ y Atrás (volver / salir).

## Iniciar sesión en la TV
Sin teclado: la TV muestra un **QR y un código** (se renuevan solos cada 5 minutos). Se escanea con
el celular, que abre `/tv?code=…`, pide iniciar sesión si hace falta y se pulsa **Autorizar**; la
TV entra sola. También se puede entrar a `/tv` y escribir el código. «Usar correo y contraseña»
queda como alternativa.

## Para publicar en la tienda de Samsung
Hay que pasar su revisión (Seller Office).
