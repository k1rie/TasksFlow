# Configuración de Variables de Entorno

## Pasos para configurar las variables de entorno:

### 1. Crear el archivo .env
Copia el archivo `env-template.txt` y renómbralo a `.env`:

```bash
cp env-template.txt .env
```

### 2. Configurar las variables de entorno
Edita el archivo `.env` con tus valores reales:

#### Base de datos MySQL:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_real_de_mysql
DB_NAME=smartclass
DB_PORT=3306
```

#### Servidor:
```env
PORT=8000
NODE_ENV=development
```

#### CORS (para el frontend):
```env
CORS_ORIGIN=http://localhost:3000
```

#### Email (opcional, si usas nodemailer):
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_app_password_de_gmail
```

#### JWT (opcional, si usas autenticación):
```env
JWT_SECRET=tu_jwt_secret_muy_seguro_y_largo
```

#### Archivos (opcional, si usas multer):
```env
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

### 3. Crear la base de datos
Ejecuta el script SQL que está en `db/db.sql` para crear la base de datos y las tablas necesarias.

### 4. Instalar dependencias
```bash
npm install
```

### 5. Ejecutar el servidor
```bash
npm start
```

## Notas importantes:
- **NUNCA** subas el archivo `.env` al repositorio
- El archivo `.env` ya está incluido en `.gitignore`
- Cambia todas las contraseñas y secretos por valores reales
- Para Gmail, necesitas usar una "App Password" en lugar de tu contraseña normal
