# llistadelacompra

Servei intern que serveix el tauler de la retornada darrere una contrasenya.

## Estructura del repositori

```
llistadelacompra/
├── server.js          servidor amb autenticació bàsica, sense dependències
├── package.json
├── render.yaml        configuració del servei a Render
├── .gitignore
└── public/
    └── index.html     el tauler (projecte executiu + tasques)
```

## Posada en marxa a Render

1. Puja aquests fitxers al repositori `llistadelacompra`, respectant la carpeta `public/`.
2. A Render: **New → Web Service** i tria el repositori. Si detecta el `render.yaml`, ja ho omple tot; si no, posa `node server.js` com a *start command* i deixa el *build command* buit.
3. A **Environment**, afegeix dues variables:
   - `AUTH_USER`: l'usuari que compartireu.
   - `AUTH_PASS`: la contrasenya d'accés a la pàgina.
4. Desplega. El navegador demanarà usuari i contrasenya la primera vegada.

El `render.yaml` demana una instància *starter*, de pagament, que no s'adorm: la pàgina respon a l'instant sempre. Si vols una altra mida, canvia-ho a **Settings → Instance Type**.

## Dues contrasenyes diferents

- La d'aquest servidor (`AUTH_USER` / `AUTH_PASS`) dona accés a llegir la pàgina.
- La de l'equip, dins del tauler, dona accés a llegir i escriure els estats de les tasques a Supabase.

Són independents a propòsit: qui té la primera pot consultar el pla; només qui té les dues pot moure l'estat de les tasques.

## Actualitzar el contingut

Quan hi hagi una versió nova del tauler, substitueix `public/index.html` i fes commit. Render torna a desplegar sol. Els estats de les tasques no es perden: viuen a Supabase, no dins del fitxer.

## Nota de seguretat

El document conté horaris, trajectes i adreces. Dues recomanacions: no facis servir el domini per defecte a cap lloc públic, i revisa de tant en tant qui té les contrasenyes.
